// utils/metaErrorParser.js
// Translates raw Meta Graph API / Axios errors into our normalized ApiError.
//
// Meta error shape (inside response.data):
//   { error: { message, type, code, error_subcode, fbtrace_id } }
//
// Reference codes we special-case:
//   190                     -> invalid/expired access token
//   10, 200..299            -> permission / capability problems
//   4, 17, 32, 613         -> app/user/page rate limiting
//   error_subcode 463/467  -> token expired/invalid session
//
// We NEVER include the access token or app secret in the output. The raw URL
// (which carries the token) is redacted by utils/sanitize before logging.

import ApiError from './ApiError.js';
import { redact } from './sanitize.js';

const RATE_LIMIT_CODES = new Set([4, 17, 32, 613, 80001, 80002, 80003, 80004]);

/**
 * @param {unknown} error  An Axios error (or anything thrown by the client).
 * @returns {ApiError}
 */
export function parseMetaError(error) {
  // Not an Axios/HTTP error — likely a bug or a network failure.
  const response = error?.response;
  const requestFailed = error?.request && !response;

  if (requestFailed) {
    return new ApiError(502, 'Could not reach Meta Graph API (network error).', {
      code: 'UPSTREAM_UNREACHABLE',
      details: { reason: redact(error?.message) },
    });
  }

  if (!response) {
    return new ApiError(500, 'Unexpected error while calling Meta.', {
      code: 'INTERNAL_ERROR',
      isOperational: false,
      details: { reason: redact(error?.message) },
    });
  }

  const metaError = response.data?.error || {};
  const code = Number(metaError.code);
  const subcode = Number(metaError.error_subcode);
  const safeMessage = redact(metaError.message) || 'Meta Graph API request failed.';

  // Common, actionable context we can safely expose.
  const details = {
    metaCode: Number.isNaN(code) ? undefined : code,
    metaSubcode: Number.isNaN(subcode) ? undefined : subcode,
    metaType: metaError.type,
    fbtraceId: metaError.fbtrace_id,
    httpStatus: response.status,
  };

  // 1) Invalid / expired token.
  if (code === 190 || subcode === 463 || subcode === 467 || response.status === 401) {
    return new ApiError(401, `Meta access token is invalid or expired. ${safeMessage}`, {
      code: 'INVALID_TOKEN',
      details: {
        ...details,
        hint: 'Generate a fresh long-lived token and update META_USER_ACCESS_TOKEN.',
      },
    });
  }

  // 2) Rate limiting.
  if (RATE_LIMIT_CODES.has(code) || response.status === 429) {
    return new ApiError(429, `Meta rate limit reached. ${safeMessage}`, {
      code: 'RATE_LIMITED',
      details: { ...details, hint: 'Back off and retry after some time.' },
    });
  }

  // 3) Missing permissions / capability.
  if (code === 10 || (code >= 200 && code <= 299) || response.status === 403) {
    return new ApiError(403, `Missing permission for this Meta action. ${safeMessage}`, {
      code: 'MISSING_PERMISSION',
      details: {
        ...details,
        hint: 'Check the app permissions/scopes and that the token has the required Page/IG grants.',
      },
    });
  }

  // 4) Bad request (invalid params, bad image URL, etc.).
  if (response.status === 400) {
    return new ApiError(400, `Meta rejected the request. ${safeMessage}`, {
      code: 'META_BAD_REQUEST',
      details,
    });
  }

  // 5) Fallback — pass through Meta's HTTP status (clamped to a sane range).
  const status = response.status >= 400 && response.status < 600 ? response.status : 502;
  return new ApiError(status, `Meta Graph API error. ${safeMessage}`, {
    code: 'META_ERROR',
    details,
  });
}

export default parseMetaError;
