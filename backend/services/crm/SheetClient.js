// services/crm/SheetClient.js
// The ONLY file that HTTP-calls the Google Apps Script Web App (the Sheet that
// backs the admin dashboard + calendar). Everything else goes through CrmService.
// Mirrors the GraphApiClient pattern: one thin transport, no business logic.
//
// Apps Script quirk (matches the frontend's src/admin/api.js): a POST is answered
// with a 302 that the HTTP client follows as a GET, which can DROP the request
// body. So we mirror every field onto the query string too — doPost() merges
// e.parameter as a fallback, so the token + payload survive the redirect.

import axios from 'axios';
import env from '../../config/index.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../utils/logger.js';

export function isConfigured() {
  return Boolean(env.crm.appsScriptUrl && env.crm.apiToken);
}

/**
 * Call an Apps Script action. Returns the parsed `{ ok, ... }` JSON on success.
 * @param {string} action  one of the actions handled in google/Code.gs
 * @param {object} fields   action-specific fields (all coerced to strings)
 * @returns {Promise<object>}
 */
export async function call(action, fields = {}) {
  if (!isConfigured()) {
    throw new ApiError(503, 'The booking system is not connected right now.', {
      code: 'CRM_NOT_CONFIGURED',
      isOperational: true,
    });
  }

  const payload = { token: env.crm.apiToken, action, ...fields };

  // Build the query-string mirror (short string values only).
  const url = new URL(env.crm.appsScriptUrl);
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });

  try {
    const { data } = await axios.post(url.toString(), JSON.stringify(payload), {
      timeout: 15000,
      // text/plain avoids a CORS preflight (irrelevant server-side, but keeps
      // the contract identical to the browser client) and Apps Script parses it.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      maxRedirects: 5, // follow the 302 → GET that Apps Script issues
    });

    if (!data || data.ok !== true) {
      throw new Error(data?.error || 'Apps Script returned an error');
    }
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    logger.error('CRM SheetClient request failed', {
      action,
      message: err?.message,
      status: err?.response?.status,
    });
    throw new ApiError(502, 'The booking system had trouble saving that.', {
      code: 'CRM_UPSTREAM_ERROR',
      isOperational: true,
    });
  }
}

export default { isConfigured, call };
