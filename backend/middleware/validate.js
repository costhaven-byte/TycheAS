// middleware/validate.js
//
// Lightweight, dependency-free request validation. Each route declares a tiny
// schema; this builds an Express middleware that checks req.body / req.query and
// throws a 400 ApiError with a clear field-by-field message on failure.
//
// Schema shape: { field: { required?, type?, enum?, validate?(value)->bool|string } }
//   type: 'string' | 'number' | 'boolean' | 'url'

import ApiError from '../utils/ApiError.js';

function checkValue(name, value, rule) {
  if (value === undefined || value === null || value === '') {
    if (rule.required) return `"${name}" is required.`;
    return null; // optional + absent -> fine
  }

  if (rule.type === 'url') {
    try {
      const u = new URL(String(value));
      if (!/^https?:$/.test(u.protocol)) return `"${name}" must be an http(s) URL.`;
    } catch {
      return `"${name}" must be a valid URL.`;
    }
  } else if (rule.type === 'number') {
    if (Number.isNaN(Number(value))) return `"${name}" must be a number.`;
  } else if (rule.type === 'boolean') {
    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
      return `"${name}" must be a boolean.`;
    }
  } else if (rule.type === 'string') {
    if (typeof value !== 'string') return `"${name}" must be a string.`;
    if (rule.maxLength && value.length > rule.maxLength) {
      return `"${name}" must be at most ${rule.maxLength} characters.`;
    }
  }

  if (rule.enum && !rule.enum.includes(value)) {
    return `"${name}" must be one of: ${rule.enum.join(', ')}.`;
  }

  if (typeof rule.validate === 'function') {
    const res = rule.validate(value);
    if (res !== true) return typeof res === 'string' ? res : `"${name}" is invalid.`;
  }

  return null;
}

/**
 * @param {object} schema
 * @param {'body'|'query'} [source='body']
 */
export function validate(schema, source = 'body') {
  return function validateMiddleware(req, _res, next) {
    const data = source === 'query' ? req.query : req.body || {};
    const errors = [];

    for (const [field, rule] of Object.entries(schema)) {
      const msg = checkValue(field, data[field], rule);
      if (msg) errors.push(msg);
    }

    if (errors.length > 0) {
      return next(ApiError.badRequest('Validation failed.', { details: { errors } }));
    }
    next();
  };
}

export default validate;
