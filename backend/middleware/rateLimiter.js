// middleware/rateLimiter.js
//
// Basic rate limiting using express-rate-limit. We expose two limiters:
//   - apiLimiter:   generous global limit for all /api traffic.
//   - writeLimiter: stricter limit for publishing/replying actions, which hit
//                   Meta's own quotas and are easy to abuse.

import rateLimit from 'express-rate-limit';
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

export default apiLimiter;
