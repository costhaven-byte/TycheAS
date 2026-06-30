// services/crm/ClientConfigService.js
// Loads a client's chatbot "brain" — the Config tab on their Google Sheet
// (Business name, About, Services, Booking types, Tone, FAQ, …). The client edits
// those cells themselves; this service fetches them (cached) so the bot can speak
// AS that business. Returns null when there's no client (Lucrator's own marketing
// widget) or the Platform isn't configured — callers then use the default persona.

import * as sheet from './SheetClient.js';
import logger from '../../utils/logger.js';

const TTL_MS = 5 * 60 * 1000; // re-read each client's config at most every 5 min
const cache = new Map(); // clientId -> { config, expires }

/**
 * @param {string} clientId
 * @returns {Promise<object|null>} the Config key/value object, or null
 */
export async function getClientConfig(clientId) {
  if (!clientId || !sheet.isConfigured()) return null;

  const hit = cache.get(clientId);
  if (hit && hit.expires > Date.now()) return hit.config;

  try {
    const data = await sheet.call('getConfig', { clientId });
    const config = data?.config || null;
    cache.set(clientId, { config, expires: Date.now() + TTL_MS });
    return config;
  } catch (err) {
    // Don't break the chat turn if config fetch fails — fall back to default.
    logger.warn('Client config fetch failed', { clientId, message: err?.message });
    // Cache the null briefly so a broken client doesn't hammer the Sheet.
    cache.set(clientId, { config: null, expires: Date.now() + 30 * 1000 });
    return null;
  }
}

export default { getClientConfig };
