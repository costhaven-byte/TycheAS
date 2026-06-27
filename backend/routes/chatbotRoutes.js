// routes/chatbotRoutes.js
// Public FAQ chatbot. No API key — this is called directly from the browser, so
// access is bounded by CORS, the global apiLimiter, and the per-IP chatLimiter
// (the 5-question cap) rather than a shared secret.

import { Router } from 'express';
import * as chatbot from '../controllers/chatbotController.js';
import { validate } from '../middleware/validate.js';
import { chatLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/health', chatbot.health);

router.post(
  '/ask',
  chatLimiter,
  validate({
    // `messages` is an array; shape is checked in the service. We only enforce
    // presence and language here.
    lang: { required: false, type: 'string', enum: ['en', 'ar'] },
  }),
  (req, res, next) => {
    if (!Array.isArray(req.body?.messages) || req.body.messages.length === 0) {
      return next(
        Object.assign(new Error('"messages" must be a non-empty array.'), {
          statusCode: 400,
          code: 'BAD_REQUEST',
        }),
      );
    }
    next();
  },
  chatbot.ask,
);

export default router;
