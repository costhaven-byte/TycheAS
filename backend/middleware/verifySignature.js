// middleware/verifySignature.js
//
// Verifies the X-Hub-Signature-256 header Meta sends on webhook POSTs, proving
// the payload really came from Meta (signed with your App Secret). Requires the
// RAW request body — see app.js, where express.json captures req.rawBody.

import crypto from 'node:crypto';
import env from '../config/env.js';
import logger from '../utils/logger.js';

export function verifyMetaSignature(req, res, next) {
  // If no app secret is configured, we can't verify — fail closed in production,
  // allow in development so local testing isn't blocked.
  if (!env.meta.appSecret) {
    if (env.isProduction) {
      logger.error('Webhook signature check skipped: META_APP_SECRET missing.');
      return res.sendStatus(403);
    }
    return next();
  }

  const signature = req.get('x-hub-signature-256') || '';
  const raw = req.rawBody;
  if (!signature || !raw) {
    logger.warn('Webhook rejected: missing signature or raw body.');
    return res.sendStatus(403);
  }

  const expected =
    'sha256=' +
    crypto.createHmac('sha256', env.meta.appSecret).update(raw).digest('hex');

  // Constant-time compare to avoid timing attacks.
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    logger.warn('Webhook rejected: signature mismatch.');
    return res.sendStatus(403);
  }

  next();
}

export default verifyMetaSignature;
