// utils/sanitize.js
// Strips secrets out of any string before it can reach logs or HTTP responses.
// Meta requests carry `access_token` in the query string and error payloads
// frequently echo the request URL, so we scrub aggressively.

import env from '../config/env.js';

// Collect the concrete secret values we never want to leak.
function secretValues() {
  return [
    env.meta.userAccessToken,
    env.meta.appSecret,
    env.meta.facebookPageAccessToken,
  ].filter(Boolean);
}

/**
 * Redact secrets from an arbitrary value (string/object/array).
 * Returns a new value; never mutates the input.
 */
export function redact(value) {
  if (value == null) return value;

  if (typeof value === 'string') return redactString(value);

  if (Array.isArray(value)) return value.map(redact);

  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      // Drop obviously-sensitive keys entirely.
      if (/access_token|app_secret|appsecret|client_secret|authorization/i.test(k)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redact(v);
      }
    }
    return out;
  }

  return value;
}

function redactString(str) {
  let result = str;

  // 1) Replace any known secret value verbatim.
  for (const secret of secretValues()) {
    if (secret && result.includes(secret)) {
      result = result.split(secret).join('[REDACTED]');
    }
  }

  // 2) Replace access_token=... query params even if value is unknown/rotated.
  result = result.replace(/(access_token=)[^&\s"']+/gi, '$1[REDACTED]');
  result = result.replace(/(appsecret_proof=)[^&\s"']+/gi, '$1[REDACTED]');

  return result;
}

export default redact;
