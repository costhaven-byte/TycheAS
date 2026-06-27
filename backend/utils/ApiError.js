// utils/ApiError.js
// A normalized error type used everywhere in the backend. Controllers/services
// throw ApiError; the central error middleware turns it into clean JSON.

export default class ApiError extends Error {
  /**
   * @param {number} statusCode  HTTP status to return to the client.
   * @param {string} message     Safe, human-readable message (NO secrets).
   * @param {object} [options]
   * @param {string} [options.code]     Stable machine code, e.g. 'INVALID_TOKEN'.
   * @param {object} [options.details]  Extra safe context for the frontend.
   * @param {boolean} [options.isOperational=true]  Expected error vs. a bug.
   */
  constructor(statusCode, message, { code, details, isOperational = true } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || httpCodeToName(statusCode);
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message, opts) {
    return new ApiError(400, message, { code: 'BAD_REQUEST', ...opts });
  }

  static unauthorized(message, opts) {
    return new ApiError(401, message, { code: 'INVALID_TOKEN', ...opts });
  }

  static forbidden(message, opts) {
    return new ApiError(403, message, { code: 'MISSING_PERMISSION', ...opts });
  }

  static notFound(message, opts) {
    return new ApiError(404, message, { code: 'NOT_FOUND', ...opts });
  }

  static rateLimited(message, opts) {
    return new ApiError(429, message, { code: 'RATE_LIMITED', ...opts });
  }

  static notImplemented(message, opts) {
    return new ApiError(501, message, { code: 'NOT_IMPLEMENTED', ...opts });
  }
}

function httpCodeToName(statusCode) {
  const map = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR',
    501: 'NOT_IMPLEMENTED',
    502: 'UPSTREAM_ERROR',
  };
  return map[statusCode] || 'ERROR';
}
