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
import env from '../config/env.js';
import logger from '../utils/logger.js';

// Lightweight in-memory log of recent events (no DB yet). Handy for debugging
// and for a future "activity feed" in the frontend.
const recentEvents = [];
const MAX_EVENTS = 100;

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

  // Optional welcome auto-reply. AI replies will replace this later.
  if (env.webhook.autoReplyEnabled && senderId && text) {
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
