// services/chatbot/ChatbotService.js
// Wraps OpenRouter's OpenAI-compatible chat API for the assistant. The system
// prompt (see systemPrompt.js) is the bot's knowledge; the tools (see tools.js)
// are its hands. This service runs a small tool-calling loop so the bot can not
// only answer questions but also BOOK appointments and RECORD sales into the
// calendar the client sees — all in one chat turn.

import axios from 'axios';
import env from '../../config/index.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../utils/logger.js';
import { buildSystemPrompt } from './systemPrompt.js';
import { getToolDefinitions, executeTool } from './tools.js';
import * as crm from '../crm/CrmService.js';

const MAX_HISTORY = 12; // turns of context we keep — this bot needs little
const MAX_MESSAGE_CHARS = 1000; // per-message guard against abuse
const MAX_TOOL_ROUNDS = 3; // how many book/sell actions we allow per turn

export function isConfigured() {
  return Boolean(env.chatbot.apiKey);
}

// Whether the booking/buying agent is fully wired (model + CRM both available).
export function agentEnabled() {
  return isConfigured() && crm.isConfigured();
}

// One call to OpenRouter's chat-completions endpoint. Returns the raw message.
async function callModel(messages, tools) {
  const { data } = await axios.post(
    `${env.chatbot.baseUrl}/chat/completions`,
    {
      model: env.chatbot.model,
      max_tokens: 600, // a little more room than FAQ-only, for tool reasoning
      temperature: 0.3,
      messages,
      ...(tools.length ? { tools, tool_choice: 'auto' } : {}),
    },
    {
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${env.chatbot.apiKey}`,
        'Content-Type': 'application/json',
        ...(env.chatbot.siteUrl ? { 'HTTP-Referer': env.chatbot.siteUrl } : {}),
        ...(env.chatbot.appName ? { 'X-Title': env.chatbot.appName } : {}),
      },
    },
  );
  return data;
}

/**
 * Answer one turn — and book/sell if the conversation calls for it.
 * @param {object} args
 * @param {Array<{role:'user'|'assistant', content:string}>} args.messages  Full chat history, oldest first.
 * @param {'en'|'ar'} [args.lang]
 * @returns {Promise<{reply:string, actions:Array<object>}>} the reply plus any booking/sale that landed
 */
export async function ask({ messages, lang = 'en' }) {
  if (!isConfigured()) {
    throw new ApiError(503, 'The assistant is not available right now.', {
      code: 'CHATBOT_NOT_CONFIGURED',
      isOperational: true,
    });
  }

  // Normalize, clamp, and keep only the most recent turns. We trust the system
  // prompt for safety, not the client — but we still bound input size.
  const cleaned = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS).trim() }))
    .filter((m) => m.content.length > 0)
    .slice(-MAX_HISTORY);

  // The chat API expects the conversation to start with a user turn.
  while (cleaned.length && cleaned[0].role !== 'user') cleaned.shift();
  if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== 'user') {
    throw ApiError.badRequest('A user message is required.', { code: 'NO_USER_MESSAGE' });
  }

  // OpenAI/OpenRouter format: the system prompt is the first message. The
  // running `convo` array grows as the model calls tools and we feed results
  // back, so it can confirm a booking/sale in the same turn.
  const tools = getToolDefinitions(); // empty array → bot stays FAQ-only
  const convo = [
    {
      role: 'system',
      content: buildSystemPrompt(lang === 'ar' ? 'ar' : 'en', { agentEnabled: tools.length > 0 }),
    },
    ...cleaned,
  ];
  const actions = []; // bookings/sales that actually landed, for the client UI

  try {
    // Tool loop: model → (tool calls?) → execute → feed results → model → … until
    // it returns a plain text reply or we hit the round cap.
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
      // On the final allowed pass, drop the tools so the model must answer in words.
      const offerTools = round < MAX_TOOL_ROUNDS ? tools : [];
      const data = await callModel(convo, offerTools);
      const message = data?.choices?.[0]?.message;
      const toolCalls = message?.tool_calls;

      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        // Keep the assistant's tool-call message, then append each tool result.
        convo.push(message);
        for (const tc of toolCalls) {
          let args = {};
          try {
            args = JSON.parse(tc.function?.arguments || '{}');
          } catch {
            args = {};
          }
          const { forModel, action } = await executeTool(tc.function?.name, args);
          if (action) actions.push(action);
          convo.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(forModel),
          });
        }
        continue; // loop again so the model can confirm to the visitor
      }

      const text = message?.content?.trim();
      if (text) return { reply: text, actions };

      // No text and no tool call — handle content filters gracefully.
      const reason = data?.choices?.[0]?.finish_reason;
      if (reason === 'content_filter') {
        const reply =
          lang === 'ar'
            ? 'لا أستطيع المساعدة في ذلك. يسعدني الإجابة عن أسئلتك حول Lucrator أو حجز تدقيق مجاني.'
            : "I can't help with that. I'm happy to answer questions about Lucrator or get you booked for a free audit.";
        return { reply, actions };
      }
      throw new Error('Empty model response');
    }

    // Exhausted the loop without a final text reply — give a safe fallback that
    // still acknowledges anything we managed to book/record.
    const reply =
      lang === 'ar'
        ? 'تم! هل يمكنني مساعدتك في أي شيء آخر؟'
        : 'Done! Is there anything else I can help you with?';
    return { reply, actions };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Never leak the key or raw provider error to the client. axios puts the
    // provider's message on err.response.data — log only its safe parts.
    logger.error('Chatbot request failed', {
      message: err?.message,
      status: err?.response?.status,
      providerError: err?.response?.data?.error?.message,
    });
    throw new ApiError(502, 'The assistant had trouble responding. Please try again.', {
      code: 'CHATBOT_UPSTREAM_ERROR',
      isOperational: true,
    });
  }
}

export default { ask, isConfigured, agentEnabled };
