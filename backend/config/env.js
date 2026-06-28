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

  // API key that protects the backend's own endpoints. The frontend must send
  // it as the `x-api-key` header. Without it set, the API is unprotected (dev
  // only) — see middleware/apiKeyAuth.js, which fails closed in production.
  apiKey: read('API_KEY'),

  // Number of proxies in front of the app (Render/Vercel/etc. set X-Forwarded-For).
  // Used by Express `trust proxy` so per-IP rate limiting sees the real client IP.
  // Default 1 in production (one proxy), 0 locally.
  trustProxy: Number(read('TRUST_PROXY', read('NODE_ENV', 'development') === 'production' ? '1' : '0')),

  // FAQ chatbot (public widget on the marketing site). Powered by OpenRouter
  // (OpenAI-compatible API that proxies to many models, including Claude).
  chatbot: {
    // OpenRouter API key — server-side only, never exposed to the browser.
    apiKey: read('OPENROUTER_API_KEY'),
    // OpenRouter base URL (override only if self-hosting a proxy).
    baseUrl: read('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
    // Model slug. Haiku is plenty for a scripted FAQ bot and is among the
    // cheapest/fastest — browse openrouter.ai/models for other slugs.
    model: read('CHATBOT_MODEL', 'anthropic/claude-haiku-4.5'),
    // Optional attribution headers OpenRouter uses for its rankings page.
    siteUrl: read('OPENROUTER_SITE_URL', read('PRODUCTION_FRONTEND_URL', '')),
    appName: read('OPENROUTER_APP_NAME', 'Lucrator FAQ Bot'),
    // Hard cap on questions per visitor IP before we steer them to a free audit.
    questionLimit: Number(read('CHATBOT_QUESTION_LIMIT', '5')),
    // Window the per-IP cap resets over (ms). Default 24h.
    windowMs: Number(read('CHATBOT_WINDOW_MS', String(24 * 60 * 60 * 1000))),
    // Display name the booking/buying agent signs its calendar entries with.
    agentName: read('CHATBOT_AGENT_NAME', 'Lucri'),
  },

  // CRM (Google Apps Script Web App that backs the admin dashboard + calendar).
  // The chatbot's booking/buying agent writes here so bookings and sales land on
  // the same calendar the client already sees. Same URL + token as the frontend
  // dashboard uses (src/admin/config.js). Without these, the agent stays in
  // "FAQ-only" mode — it can talk, but it can't book or sell.
  crm: {
    appsScriptUrl: read('APPS_SCRIPT_URL'),
    apiToken: read('CRM_API_TOKEN'),
  },

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
