// routes/metaRoutes.js
// Maps each Meta endpoint to its controller, with per-route validation and the
// stricter write-rate-limiter on publishing/replying actions.

import { Router } from 'express';
import * as meta from '../controllers/metaController.js';
import * as webhook from '../controllers/webhookController.js';
import { validate } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { verifyMetaSignature } from '../middleware/verifySignature.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';

const router = Router();

// ── PUBLIC routes (no API key) ──
// Health is an open liveness probe. The Meta webhook is called BY Meta (which
// can't send our API key) and is secured separately: GET by the verify token,
// POST by the X-Hub-Signature-256 signature.
router.get('/health', meta.health);
router.get('/webhook', webhook.verifyWebhook);
router.post('/webhook', verifyMetaSignature, webhook.receiveWebhook);

// ── Everything below requires a valid x-api-key header ──
router.use(apiKeyAuth);

// Diagnostics (reveals account info — protected).
router.get('/test', meta.test);
// Debug: view recently received events (may contain DM text — protected).
router.get('/webhook/events', (_req, res) =>
  res.json({ success: true, data: webhook.getRecentEvents() })
);

// ── Instagram ──
router.get('/instagram/profile', meta.instagramProfile);

router.post(
  '/instagram/post',
  writeLimiter,
  validate({
    imageUrl: { required: true, type: 'url' },
    caption: { required: false, type: 'string', maxLength: 2200 },
  }),
  meta.instagramPost
);

router.get('/instagram/comments', meta.instagramComments);

router.post(
  '/instagram/comments/reply',
  writeLimiter,
  validate({
    commentId: { required: true, type: 'string' },
    message: { required: true, type: 'string', maxLength: 2200 },
  }),
  meta.instagramReplyComment
);

router.get('/instagram/messages', meta.instagramMessages);

router.post(
  '/instagram/messages/reply',
  writeLimiter,
  validate({
    recipientId: { required: true, type: 'string' },
    message: { required: true, type: 'string', maxLength: 1000 },
  }),
  meta.instagramReplyMessage
);

// ── Facebook Page ──
router.get('/facebook/page', meta.facebookPage);

router.post(
  '/facebook/post',
  writeLimiter,
  validate({
    // At least one of message/imageUrl must be present — enforced via validate().
    message: {
      required: false,
      type: 'string',
      maxLength: 5000,
      validate: (v) => (typeof v === 'string' && v.trim().length > 0) || true,
    },
    imageUrl: { required: false, type: 'url' },
  }),
  (req, res, next) => {
    if (!req.body.message && !req.body.imageUrl) {
      return next(
        Object.assign(new Error('Provide at least one of "message" or "imageUrl".'), {
          statusCode: 400,
          code: 'BAD_REQUEST',
        })
      );
    }
    next();
  },
  meta.facebookPost
);

// ── Scheduling (structure only) ──
router.post(
  '/schedule',
  validate({
    target: {
      required: true,
      type: 'string',
      enum: ['instagram.post', 'facebook.post', 'instagram.comment.reply'],
    },
    scheduledAt: { required: true, type: 'string' },
    // payload is action-specific; validated by the target action when executed.
  }),
  meta.schedulePost
);

export default router;
