// controllers/metaController.js
//
// HTTP layer for Meta endpoints. Controllers:
//   - read validated input from req,
//   - call MetaService (NEVER Meta Graph API directly),
//   - shape a consistent { success, data } response.
// All async errors propagate to the central error middleware via asyncHandler.

import metaService from '../services/meta/index.js';
import scheduler from '../services/scheduler/SchedulerService.js';
import asyncHandler from '../utils/asyncHandler.js';
import env from '../config/env.js';

// Small helper for the success envelope.
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });

// ── Health & diagnostics ──────────────────────────────────────────────────

export const health = asyncHandler(async (_req, res) => {
  ok(res, {
    status: 'healthy',
    service: 'lucrator-backend',
    uptimeSeconds: Math.round(process.uptime()),
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

export const test = asyncHandler(async (_req, res) => {
  // verifyConnection never throws — it reports per-surface status.
  const result = await metaService.verifyConnection();
  const status = result.ok ? 200 : 207; // 207 = partial (one surface failing)
  res.status(status).json({ success: result.ok, data: result });
});

// ── Instagram ────────────────────────────────────────────────────────────

export const instagramProfile = asyncHandler(async (_req, res) => {
  const profile = await metaService.instagram.getProfile();
  ok(res, profile);
});

export const instagramPost = asyncHandler(async (req, res) => {
  const { imageUrl, caption } = req.body;
  const result = await metaService.instagram.publishImage({ imageUrl, caption });
  ok(res, result, 201);
});

export const instagramComments = asyncHandler(async (req, res) => {
  const mediaLimit = req.query.mediaLimit ? Number(req.query.mediaLimit) : undefined;
  const result = await metaService.instagram.getRecentComments({ mediaLimit });
  ok(res, result);
});

export const instagramReplyComment = asyncHandler(async (req, res) => {
  const { commentId, message } = req.body;
  const result = await metaService.instagram.replyToComment({ commentId, message });
  ok(res, result, 201);
});

export const instagramMessages = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const result = await metaService.messaging.getConversations({ limit });
  // If prerequisites aren't met, the service returns a requires_setup descriptor.
  const status = result.status === 'requires_setup' ? 501 : 200;
  res.status(status).json({ success: result.status !== 'requires_setup', data: result });
});

export const instagramReplyMessage = asyncHandler(async (req, res) => {
  const { recipientId, message } = req.body;
  const result = await metaService.messaging.sendReply({ recipientId, message });
  const status = result.status === 'requires_setup' ? 501 : 201;
  res.status(status).json({ success: result.status !== 'requires_setup', data: result });
});

// ── Facebook Page ──────────────────────────────────────────────────────────

export const facebookPage = asyncHandler(async (_req, res) => {
  const page = await metaService.facebook.getPage();
  ok(res, page);
});

export const facebookPost = asyncHandler(async (req, res) => {
  const { message, imageUrl } = req.body;
  const result = await metaService.facebook.publishPost({ message, imageUrl });
  ok(res, result, 201);
});

// ── Scheduling (structure only — not executed yet) ──────────────────────────

export const schedulePost = asyncHandler(async (req, res) => {
  const { target, scheduledAt, payload } = req.body;
  const job = scheduler.schedule({ target, scheduledAt, payload });
  ok(res, job, 202); // 202 Accepted — queued, not executed
});
