# Architecture Notes

This document explains *why* the backend is shaped the way it is, so future
contributors (and future providers) extend it consistently.

## Layered flow

```
HTTP request
   │
   ▼
routes/*          validation + rate limiting, maps URL → controller
   │
   ▼
controllers/*     read validated input, call a service, shape the response
   │              (NEVER import Axios or call Meta directly)
   ▼
services/meta/    MetaService (facade)
   │                ├── instagram.js   domain logic (paths + field selection)
   │                ├── facebook.js
   │                └── messaging.js
   ▼
services/meta/GraphApiClient.js   the ONLY HTTP caller to Meta Graph API
   │
   ▼
Meta Graph API
```

Errors travel back up as a normalized `ApiError` and are formatted once by
`middleware/errorHandler.js`. Secrets are scrubbed by `utils/sanitize.js` before
anything is logged or returned.

## Why a single GraphApiClient

- One place to attach the access token → controllers/domain code never handle secrets.
- One place to set timeouts, base URL, and API version.
- One place where Axios errors become clean `ApiError`s (`utils/metaErrorParser.js`).
- Swapping Graph version or host (e.g. `graph.instagram.com` for IG-Login tokens)
  is a config change, not a code change.

## Why MetaService is a composed facade

`MetaService` wires the domain modules onto namespaces (`instagram`, `facebook`,
`messaging`, future `whatsapp`). Controllers depend on this stable surface. New
Meta capabilities = new module + one line in `MetaService`. Nothing else changes.

It exports both a **singleton** (built from env, used by controllers) and the
**class** (so future multi-tenant code can build a per-account instance with a
different token — the SaaS path).

## Multi-provider future

Meta is the first provider. LinkedIn, TikTok, Google, Stripe, and the AI layer
each follow the same shape:

```
services/<provider>/<Provider>Service.js   facade
services/<provider>/<Provider>ApiClient.js the only HTTP caller for that provider
controllers/<provider>Controller.js
routes/<provider>Routes.js   → mounted in routes/index.js under /<provider>
```

A future `services/registry.js` can index providers (`registry.get('meta')`) once
there are several, enabling generic cross-provider features (e.g. "post to all
connected channels", unified CRM lead capture from any DM/comment source).

## Scheduling

`services/scheduler/SchedulerService.js` defines the contract now (validate +
store + status) with an in-memory store and `engineActive = false`. To go live,
implement an engine that persists jobs and, at `scheduledAt`, calls the matching
`MetaService` action and updates status. The controller and frontend contract
stay identical.

## AI / CRM hooks (later)

- **Caption generation:** a service that drafts captions, returned to the frontend
  for approval, then passed to `instagram.post` / `facebook.post`. Never auto-post
  unreviewed AI content by default.
- **AI DM replies:** slot into `messaging.js` once webhooks deliver inbound DMs.
- **CRM lead creation:** a listener over comments/DMs that creates leads. The
  normalized comment/conversation shapes returned here are already CRM-friendly.
