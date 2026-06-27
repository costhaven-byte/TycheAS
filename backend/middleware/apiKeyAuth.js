// middleware/apiKeyAuth.js
//
// Protects the backend's own endpoints. The client (your React frontend, or any
// trusted caller) must send the shared secret as the `x-api-key` header
// (or `Authorization: Bearer <key>`).
//
// IMPORTANT: CORS does NOT protect an API — it only restrains browsers. This is
// the actual access control for non-browser callers (curl, scripts, bots).
//
// Behavior when API_KEY is not configured:
//   - production  -> fail closed (reject everything) so we never ship open.
//   - development -> allow through, with a startup-time expectation that you'll
//     set it before deploying.

import crypto from 'node:crypto';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

// Constant-time string compare to avoid leaking the key via timing.
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function apiKeyAuth(req, _res, next) {
  if (!env.apiKey) {
    if (env.isProduction) {
      logger.error('API_KEY is not set in production — rejecting request.');
      return next(
        new ApiError(500, 'Server authentication is not configured.', {
          code: 'AUTH_NOT_CONFIGURED',
          isOperational: false,
        })
      );
    }
    // Dev convenience: allow, but make it visible.
    logger.warn('API_KEY not set — endpoint is UNPROTECTED (development only).');
    return next();
  }

  const headerKey = req.get('x-api-key');
  const bearer = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const provided = headerKey || bearer;

  if (!provided || !safeEqual(provided, env.apiKey)) {
    return next(
      new ApiError(401, 'Missing or invalid API key.', { code: 'UNAUTHORIZED' })
    );
  }

  next();
}

export default apiKeyAuth;
