// services/meta/MetaService.js
//
// THE central service for all Meta (Instagram + Facebook + Messaging) work.
// Controllers depend ONLY on this. They must never import GraphApiClient or
// the domain modules directly, and must never call Meta Graph API themselves.
//
// Design:
//   - One GraphApiClient instance (single place that does HTTP to Meta).
//   - Domain modules (instagram/facebook/messaging) are composed in and exposed
//     as namespaced sub-objects: metaService.instagram.*, metaService.facebook.*
//   - Future channels (WhatsApp, Messenger as its own surface) plug in the same
//     way: add a module, compose it here, expose a namespace. Nothing else changes.
//
// This is also the natural seam for the future multi-provider layer: LinkedIn /
// TikTok / Google services will each get their own Service class following this
// exact shape, registered in a provider registry.

import GraphApiClient from './GraphApiClient.js';
import { createInstagram } from './instagram.js';
import { createFacebook } from './facebook.js';
import { createMessaging } from './messaging.js';
import env from '../../config/env.js';

export class MetaService {
  constructor(config = {}) {
    const cfg = {
      userAccessToken: config.userAccessToken ?? env.meta.userAccessToken,
      instagramAccountId: config.instagramAccountId ?? env.meta.instagramAccountId,
      facebookPageId: config.facebookPageId ?? env.meta.facebookPageId,
      facebookPageAccessToken:
        config.facebookPageAccessToken ?? env.meta.facebookPageAccessToken,
      graphBaseUrl: config.graphBaseUrl ?? env.meta.graphBaseUrl,
      graphVersion: config.graphVersion ?? env.meta.graphVersion,
    };
    this.config = cfg;

    // The single HTTP client. Default token = user token.
    this.client = new GraphApiClient({
      baseUrl: cfg.graphBaseUrl,
      version: cfg.graphVersion,
      defaultToken: cfg.userAccessToken,
    });

    // Domain namespaces.
    this.instagram = createInstagram({
      client: this.client,
      igAccountId: cfg.instagramAccountId,
    });

    this.facebook = createFacebook({
      client: this.client,
      pageId: cfg.facebookPageId,
      pageToken: cfg.facebookPageAccessToken,
    });

    this.messaging = createMessaging({
      client: this.client,
      pageId: cfg.facebookPageId,
      igAccountId: cfg.instagramAccountId,
    });

    // Placeholder namespaces for future channels — present so callers and docs
    // can reference a stable shape before the real implementation lands.
    this.whatsapp = {
      isConfigured: false,
      note: 'WhatsApp Business API not yet implemented. Add a whatsapp.js module and compose it here.',
    };
  }

  /**
   * Connectivity / credentials check. Probes IG profile and FB Page in parallel
   * and reports per-surface status WITHOUT throwing, so the frontend can render
   * a clear "what works / what is broken" panel.
   */
  async verifyConnection() {
    const result = {
      ok: false,
      instagram: { ok: false },
      facebook: { ok: false },
      checkedAt: new Date().toISOString(),
    };

    const [ig, fb] = await Promise.allSettled([
      this.instagram.getProfile(),
      this.facebook.getPage(),
    ]);

    if (ig.status === 'fulfilled') {
      result.instagram = {
        ok: true,
        id: ig.value.id,
        username: ig.value.username,
      };
    } else {
      result.instagram = {
        ok: false,
        code: ig.reason?.code,
        message: ig.reason?.message,
      };
    }

    if (fb.status === 'fulfilled') {
      result.facebook = { ok: true, id: fb.value.id, name: fb.value.name };
    } else {
      result.facebook = {
        ok: false,
        code: fb.reason?.code,
        message: fb.reason?.message,
      };
    }

    result.ok = result.instagram.ok && result.facebook.ok;
    return result;
  }
}

// Export a ready-to-use singleton built from environment config, plus the class
// (so tests / future multi-tenant code can construct per-account instances).
const metaService = new MetaService();
export default metaService;
