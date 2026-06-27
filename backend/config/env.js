// config/env.js
// Loads and validates environment variables ONCE at startup.
// Nothing else in the app should read process.env directly — import `env` from here.
// This gives us a single, typed-ish, validated source of truth for config.

import dotenv from 'dotenv';

dotenv.config();

/**
 * Read an env var, trimming surrounding whitespace (the .env values the user
 * pastes sometimes carry a leading space). Returns `fallback` when unset/empty.
 */
function read(key, fallback = undefined) {
  const raw = process.env[key];
  if (raw === undefined || raw === null) return fallback;
  const trimmed = String(raw).trim();
  return trimmed === '' ? fallback : trimmed;
}

const env = {
  // Runtime
  nodeEnv: read('NODE_ENV', 'development'),
  port: Number(read('PORT', '5000')),
  isProduction: read('NODE_ENV', 'development') === 'production',

  // Frontend origins allowed through CORS
  frontendUrl: read('FRONTEND_URL', 'http://localhost:5173'),
  productionFrontendUrl: read('PRODUCTION_FRONTEND_URL'),

  // Meta / Graph API
  meta: {
    userAccessToken: read('META_USER_ACCESS_TOKEN'),
    appId: read('META_APP_ID'),
    appSecret: read('META_APP_SECRET'),
    instagramAccountId: read('INSTAGRAM_ACCOUNT_ID'),
    facebookPageId: read('FACEBOOK_PAGE_ID'),
    // Optional: a dedicated Page access token. Facebook Page publishing usually
    // requires a Page token rather than a user token. If absent we fall back to
    // the user token and surface a clear error if Meta rejects it.
    facebookPageAccessToken: read('FACEBOOK_PAGE_ACCESS_TOKEN'),
    // Graph API host + version are configurable so we can point Instagram-Login
    // tokens at graph.instagram.com if needed, and bump versions without a deploy.
    graphBaseUrl: read('GRAPH_API_BASE_URL', 'https://graph.facebook.com'),
    graphVersion: read('GRAPH_API_VERSION', 'v21.0'),
  },

  // Webhooks (Instagram/Messenger event delivery)
  webhook: {
    // Shared secret you choose; Meta echoes it back during GET verification.
    verifyToken: read('WEBHOOK_VERIFY_TOKEN'),
    // Auto-reply to brand-new inbound DMs (handy for a welcome message).
    autoReplyEnabled: read('AUTO_REPLY_ENABLED', 'false') === 'true',
    autoReplyMessage: read(
      'AUTO_REPLY_MESSAGE',
      'Hi 👋 Thanks for reaching out! Learn more at https://lucrator.vercel.app'
    ),
  },
};

/**
 * Validate that the critical Meta config is present. We warn rather than crash
 * so the server still boots (and /api/meta/health stays up) even if Meta config
 * is incomplete — the /test endpoint will report exactly what's missing.
 */
export function validateEnv() {
  const required = {
    META_USER_ACCESS_TOKEN: env.meta.userAccessToken,
    INSTAGRAM_ACCOUNT_ID: env.meta.instagramAccountId,
    FACEBOOK_PAGE_ID: env.meta.facebookPageId,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    // Never print the values — only the names of what's missing.
    console.warn(
      `[config] Warning: missing Meta env vars: ${missing.join(', ')}. ` +
        `Meta endpoints will fail until these are set. Health check still works.`
    );
  }

  return { ok: missing.length === 0, missing };
}

export default env;
