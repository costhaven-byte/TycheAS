// controllers/webhookController.js
//
// Meta webhook endpoint. Two responsibilities:
//   GET  /api/meta/webhook  — verification handshake (Meta echoes a challenge).
//   POST /api/meta/webhook  — receive events (DMs, comments) in real time.
//
// Inbound events are signature-verified (see middleware/verifySignature), then
// dispatched. Optionally auto-replies to brand-new DMs with a welcome message.
//
// Design note: this is the seam where future features plug in — AI DM replies,
// CRM lead creation from DMs/comments, etc. Each event type gets a handler here.

import metaService from '../services/meta/index.js';
import * as chatbot from '../services/chatbot/ChatbotService.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';

// Lightweight in-memory log of recent events (no DB yet). Handy for debugging
// and for a future "activity feed" in the frontend.
const recentEvents = [];
const MAX_EVENTS = 100;

// Per-sender DM conversation memory so the agent has context across messages.
// In-memory only (demo): a DB takes over when we go multi-tenant. Each entry is
// { messages: [{role,content}], updatedAt }. Expired after CONVO_TTL_MS idle.
const conversations = new Map();
const CONVO_TTL_MS = 60 * 60 * 1000; // 1h of silence resets the thread
const CONVO_MAX_TURNS = 20; // ChatbotService slices further; this just bounds memory

function getHistory(senderId) {
  const now = Date.now();
  const existing = conversations.get(senderId);
  if (existing && now - existing.updatedAt < CONVO_TTL_MS) return existing.messages;
  const fresh = { messages: [], updatedAt: now };
  conversations.set(senderId, fresh);
  return fresh.messages;
}

function pushHistory(senderId, message) {
  const messages = getHistory(senderId);
  messages.push(message);
  if (messages.length > CONVO_MAX_TURNS) messages.splice(0, messages.length - CONVO_MAX_TURNS);
  conversations.set(senderId, { messages, updatedAt: Date.now() });
  return messages;
}

// Cheap language pick: any Arabic-script character → Arabic, else English.
function detectLang(text) {
  return /[؀-ۿ]/.test(text) ? 'ar' : 'en';
}

function record(event) {
  recentEvents.unshift({ receivedAt: new Date().toISOString(), ...event });
  if (recentEvents.length > MAX_EVENTS) recentEvents.length = MAX_EVENTS;
}

export function getRecentEvents() {
  return recentEvents;
}

/**
 * GET handler — Meta calls this once when you register the webhook. We confirm
 * the verify token matches and echo back hub.challenge as plain text.
 */
export function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token && token === env.webhook.verifyToken) {
    logger.info('Webhook verified by Meta.');
    return res.status(200).send(challenge);
  }
  logger.warn('Webhook verification failed (bad mode or verify token).');
  return res.sendStatus(403);
}

/**
 * POST handler — receives event batches. Always respond 200 quickly so Meta
 * doesn't retry; do the actual work after acknowledging.
 */
export async function receiveWebhook(req, res) {
  // Acknowledge immediately.
  res.sendStatus(200);

  const body = req.body || {};
  try {
    for (const entry of body.entry || []) {
      // Messaging events (DMs) — Instagram & Messenger share this shape.
      for (const msg of entry.messaging || []) {
        await handleMessagingEvent(msg, body.object);
      }
      // Field changes (e.g. new comments) arrive under `changes`.
      for (const change of entry.changes || []) {
        handleChangeEvent(change, body.object);
      }
    }
  } catch (err) {
    // Never throw out of a webhook — just log (redaction handled by logger usage).
    logger.error(`Webhook processing error: ${err?.message}`);
  }
}

async function handleMessagingEvent(msg, object) {
  // Ignore our own outbound echoes to avoid reply loops.
  if (msg.message?.is_echo) return;

  const senderId = msg.sender?.id;
  const text = msg.message?.text;
  record({ type: 'message', object, senderId, text });
  logger.info(`Inbound DM from ${senderId}: ${text ? `"${text}"` : '(non-text)'}`);

  if (!senderId || !text) return; // nothing to answer (e.g. an attachment-only DM)

  // Primary path: let the booking/buying agent handle the conversation. It
  // answers, and — when the CRM is connected — books appointments / records
  // sales straight into the dashboard, all from the DM thread.
  if (chatbot.isConfigured()) {
    try {
      const history = pushHistory(senderId, { role: 'user', content: text });
      const { reply, actions } = await chatbot.ask({ messages: history, lang: detectLang(text) });
      pushHistory(senderId, { role: 'assistant', content: reply });
      await metaService.messaging.sendReply({ recipientId: senderId, message: reply });
      if (actions?.length) {
        logger.info(`Agent actions for ${senderId}: ${actions.map((a) => a.type).join(', ')}`);
      }
      return;
    } catch (err) {
      logger.error(`AI DM reply failed for ${senderId}: ${err?.message}`);
      // fall through to the static welcome reply, if enabled
    }
  }

  // Fallback: optional static welcome auto-reply (used when the agent is off or
  // errors). Configured via AUTO_REPLY_* env.
  if (env.webhook.autoReplyEnabled) {
    try {
      await metaService.messaging.sendReply({
        recipientId: senderId,
        message: env.webhook.autoReplyMessage,
      });
      logger.info(`Auto-replied to ${senderId}.`);
    } catch (err) {
      logger.error(`Auto-reply failed for ${senderId}: ${err?.message}`);
    }
  }
}

function handleChangeEvent(change, object) {
  // e.g. field: 'comments' with value containing the new comment.
  record({ type: 'change', object, field: change.field, value: change.value });
  logger.info(`Webhook change: ${object}/${change.field}`);
  // Future: create CRM lead from a comment, trigger an auto-reply, etc.
}
