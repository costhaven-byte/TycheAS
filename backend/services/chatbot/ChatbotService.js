// services/chatbot/ChatbotService.js
// Wraps OpenRouter's OpenAI-compatible chat API for the FAQ bot. The system
// prompt (see systemPrompt.js) is the only knowledge the model has; this service
// just turns the visitor's message history into a single grounded reply.

import axios from 'axios';
import env from '../../config/index.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../utils/logger.js';
import { buildSystemPrompt } from './systemPrompt.js';

const MAX_HISTORY = 12; // turns of context we keep — an FAQ bot needs little
const MAX_MESSAGE_CHARS = 1000; // per-message guard against abuse

export function isConfigured() {
  return Boolean(env.chatbot.apiKey);
}

/**
 * Answer one FAQ question.
 * @param {object} args
 * @param {Array<{role:'user'|'assistant', content:string}>} args.messages  Full chat history, oldest first.
 * @param {'en'|'ar'} [args.lang]
 * @returns {Promise<string>} the assistant reply text
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

  // OpenAI/OpenRouter format: the system prompt is the first message.
  const payloadMessages = [
    { role: 'system', content: buildSystemPrompt(lang === 'ar' ? 'ar' : 'en') },
    ...cleaned,
  ];

  try {
    const { data } = await axios.post(
      `${env.chatbot.baseUrl}/chat/completions`,
      {
        model: env.chatbot.model,
        max_tokens: 400, // FAQ answers are short by design
        temperature: 0.3,
        messages: payloadMessages,
      },
      {
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${env.chatbot.apiKey}`,
          'Content-Type': 'application/json',
          // Optional attribution for OpenRouter's rankings page.
          ...(env.chatbot.siteUrl ? { 'HTTP-Referer': env.chatbot.siteUrl } : {}),
          ...(env.chatbot.appName ? { 'X-Title': env.chatbot.appName } : {}),
        },
      },
    );

    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      // Some providers signal a content filter via finish_reason.
      const reason = data?.choices?.[0]?.finish_reason;
      if (reason === 'content_filter') {
        return lang === 'ar'
          ? 'لا أستطيع المساعدة في ذلك. يسعدني الإجابة عن أسئلتك حول Lucrator أو حجز تدقيق مجاني.'
          : "I can't help with that. I'm happy to answer questions about Lucrator or get you booked for a free audit.";
      }
      throw new Error('Empty model response');
    }
    return text;
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

export default { ask, isConfigured };
