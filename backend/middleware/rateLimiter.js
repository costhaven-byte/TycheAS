// middleware/rateLimiter.js
//
// Basic rate limiting using express-rate-limit. We expose two limiters:
//   - apiLimiter:   generous global limit for all /api traffic.
//   - writeLimiter: stricter limit for publishing/replying actions, which hit
//                   Meta's own quotas and are easy to abuse.

import rateLimit from 'express-rate-limit';
import env from '../config/index.js';
import ApiError from '../utils/ApiError.js';

function handler(_req, _res, next) {
  next(ApiError.rateLimited('Too many requests. Please slow down and try again later.'));
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Per-visitor cap for the FAQ chatbot: each IP gets a fixed number of questions
// before we stop answering and steer them to a free audit / the FAQ page. Unlike
// the other limiters this does NOT error — it responds 200 with `limitReached`
// so the widget can show the booking prompt instead of a failure. The controller
// reads `req.rateLimit.remaining` to tell the visitor how many questions are left.
export const chatLimiter = rateLimit({
  windowMs: env.chatbot.windowMs,
  max: env.chatbot.questionLimit,
  standardHeaders: true,
  legacyHeaders: false,
  // Don't burn a question on a server-side failure — only successful answers count.
  skipFailedRequests: true,
  handler(req, res) {
    const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
    res.status(200).json({
      success: true,
      data: {
        reply:
          lang === 'ar'
            ? 'لقد وصلت إلى الحد الأقصى للأسئلة. للمتابعة، احجز تدقيقًا مجانيًا أو اطّلع على صفحة الأسئلة الشائعة.'
            : "You've reached the question limit for this chat. To go further, book a free audit or check out our FAQ page.",
        limitReached: true,
        questionsRemaining: 0,
      },
    });
  },
});

export default apiLimiter;
