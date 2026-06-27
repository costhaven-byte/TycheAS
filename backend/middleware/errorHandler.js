// middleware/errorHandler.js
//
// Centralized error middleware. Every error in the app funnels here and leaves
// as clean, secret-free JSON. This is the ONLY place that formats error output.

import env from '../config/env.js';
import logger from '../utils/logger.js';
import { redact } from '../utils/sanitize.js';
import ApiError from '../utils/ApiError.js';

// 404 handler — registered after all routes.
export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Error handler — must keep all four args for Express to recognize it.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Normalize plain errors (and service errors carrying a statusCode).
  let apiError = err;
  if (!(err instanceof ApiError)) {
    const status = Number(err?.statusCode) || 500;
    apiError = new ApiError(status, err?.message || 'Internal server error.', {
      code: err?.code,
      isOperational: status < 500,
    });
  }

  // Log server-side with full (redacted) context.
  const logPayload = {
    code: apiError.code,
    status: apiError.statusCode,
    path: `${req.method} ${req.originalUrl}`,
    details: redact(apiError.details),
  };
  if (apiError.statusCode >= 500 || !apiError.isOperational) {
    logger.error(`Unhandled error: ${redact(apiError.message)}`, logPayload);
  } else {
    logger.warn(`Request error: ${redact(apiError.message)}`, logPayload);
  }

  // Build the client response — always redacted, never includes secrets.
  const body = {
    success: false,
    error: {
      code: apiError.code,
      message: redact(apiError.message),
      details: redact(apiError.details),
    },
  };

  // Only include a stack trace in non-production, and only redacted.
  if (!env.isProduction && apiError.statusCode >= 500) {
    body.error.stack = redact(apiError.stack);
  }

  res.status(apiError.statusCode || 500).json(body);
}

export default errorHandler;
