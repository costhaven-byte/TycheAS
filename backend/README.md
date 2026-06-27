# Lucrator Backend

A standalone Node.js + Express backend for **Lucrator**, providing Meta (Instagram + Facebook) integrations through a single, reusable **`MetaService`**. The React + Vite frontend calls these REST endpoints — it never talks to Meta directly, and it never sees an access token.

> Built to grow into a multi-provider SaaS backend. WhatsApp, Messenger, LinkedIn, TikTok, Google services, Stripe, and AI features are designed to plug in alongside Meta without reshaping the architecture.

---

## Architecture

```
backend/
├── config/          # env loading + validation (single source of truth)
├── controllers/     # HTTP layer — calls MetaService only
├── middleware/      # CORS, rate limiting, validation, error handling
├── routes/          # endpoint → controller mapping + per-route validation
├── services/
│   ├── meta/        # MetaService + GraphApiClient + domain modules
│   └── scheduler/   # scheduling interface (structure only, no engine yet)
├── utils/           # ApiError, asyncHandler, logger, error parser, sanitizer
├── docs/            # supplementary docs
├── app.js           # builds the Express app
├── server.js        # entry point (listen + lifecycle)
├── .env.example
└── README.md
```

### The golden rule
**Only `services/meta/GraphApiClient.js` ever performs an HTTP call to the Meta Graph API.** Domain modules (`instagram.js`, `facebook.js`, `messaging.js`) describe *what* to call; `MetaService` composes them into one facade; controllers call **`MetaService` only**. Nothing else imports Axios or hits Graph.

```
Controller → MetaService → (instagram|facebook|messaging) → GraphApiClient → Meta
```

### Adding a future provider (the extension pattern)
1. Create `services/<provider>/<Provider>Service.js` with its own client (mirroring `GraphApiClient`).
2. Expose namespaced methods (e.g. `linkedin.publishPost()`).
3. Add `controllers/<provider>Controller.js` and `routes/<provider>Routes.js`.
4. Mount it in `routes/index.js`: `router.use('/linkedin', linkedinRoutes)`.

No existing files change. This is how WhatsApp/Messenger/LinkedIn/TikTok/Google/Stripe and the AI layer will land.

---

## Setup

```bash
cd backend
cp .env.example .env      # then fill in real values
npm install
npm run dev               # auto-reload (node --watch)
# or
npm start
```

Server boots on `http://localhost:5000`. The health endpoint works even if Meta credentials are missing/invalid; `/api/meta/test` tells you exactly what's wrong.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | no (default 5000) | HTTP port |
| `NODE_ENV` | no (default development) | Runtime mode |
| `FRONTEND_URL` | yes | Allowed CORS origin (dev) |
| `PRODUCTION_FRONTEND_URL` | no | Allowed CORS origin (prod) |
| `META_USER_ACCESS_TOKEN` | yes | Token used for Graph calls |
| `META_APP_ID` | recommended | Meta app id |
| `META_APP_SECRET` | recommended | Meta app secret (never sent to client) |
| `INSTAGRAM_ACCOUNT_ID` | yes | IG Business account id |
| `FACEBOOK_PAGE_ID` | yes | Facebook Page id |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | no | Page token (needed for DMs; recommended for FB publishing) |
| `GRAPH_API_BASE_URL` | no | Override Graph host |
| `GRAPH_API_VERSION` | no (default v21.0) | Graph API version |

> **Security:** `.env` is gitignored. Tokens and the app secret are never returned to the frontend and are redacted from all logs and error responses.

---

## Authentication

All endpoints require an API key **except** `GET /api/meta/health` and the Meta
`GET/POST /api/meta/webhook` (which Meta calls directly and which are secured by
the verify token + request signature).

Send the key on every request:

```
x-api-key: <API_KEY>
```
(or `Authorization: Bearer <API_KEY>`)

Set `API_KEY` in `.env`. **In production the API refuses to serve protected
routes if `API_KEY` is unset** (fails closed). CORS is *not* a substitute — it
only constrains browsers, so the API key is the real access control. Missing or
wrong key → `401 UNAUTHORIZED`.

```bash
curl -H "x-api-key: $API_KEY" http://localhost:5000/api/meta/instagram/profile
```

## Response format

Success:
```json
{ "success": true, "data": { /* ... */ } }
```

Error (clean, secret-free):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Meta access token is invalid or expired. ...",
    "details": { "metaCode": 190, "hint": "..." }
  }
}
```

**Error codes:** `BAD_REQUEST`, `INVALID_TOKEN`, `MISSING_PERMISSION`, `RATE_LIMITED`, `META_BAD_REQUEST`, `META_ERROR`, `UPSTREAM_UNREACHABLE`, `NOT_FOUND`, `NOT_IMPLEMENTED`, `INTERNAL_ERROR`.

---

## Endpoints

Base path: `/api/meta`

### `GET /api/meta/health`
**Purpose:** Backend liveness check (no Meta call).
**Params:** none.

```bash
curl http://localhost:5000/api/meta/health
```
```json
{ "success": true, "data": { "status": "healthy", "service": "lucrator-backend", "uptimeSeconds": 12, "environment": "development", "timestamp": "2026-06-27T10:00:00.000Z" } }
```
**Common errors:** none (always up if the server is running).

---

### `GET /api/meta/test`
**Purpose:** Verify the Meta token, Instagram account id, and Facebook Page id actually work. Probes both surfaces and reports each independently.
**Params:** none.

```bash
curl http://localhost:5000/api/meta/test
```
```json
{
  "success": true,
  "data": {
    "ok": true,
    "instagram": { "ok": true, "id": "1784142...", "username": "lucrator" },
    "facebook": { "ok": true, "id": "6159149...", "name": "Lucrator" },
    "checkedAt": "2026-06-27T10:00:00.000Z"
  }
}
```
**Notes:** Returns HTTP `207` when one surface fails (the other still reported). `instagram`/`facebook` objects include `code` + `message` on failure.
**Common errors:** `INVALID_TOKEN` (190), `MISSING_PERMISSION`.

---

### `GET /api/meta/instagram/profile`
**Purpose:** Instagram Business profile + stats.
**Params:** none.

```bash
curl http://localhost:5000/api/meta/instagram/profile
```
```json
{
  "success": true,
  "data": {
    "id": "1784142...", "username": "lucrator", "name": "Lucrator",
    "biography": "...", "followersCount": 1234, "followsCount": 56,
    "mediaCount": 42, "profilePictureUrl": "https://...", "website": null
  }
}
```
**Common errors:** `INVALID_TOKEN`, `MISSING_PERMISSION` (needs `instagram_basic`).

---

### `GET /api/meta/facebook/page`
**Purpose:** Facebook Page name, id, and basic data.
**Params:** none.

```bash
curl http://localhost:5000/api/meta/facebook/page
```
```json
{
  "success": true,
  "data": {
    "id": "6159149...", "name": "Lucrator", "username": null, "about": "...",
    "category": "Software", "fanCount": 100, "followersCount": 100,
    "link": "https://facebook.com/...", "pictureUrl": "https://..."
  }
}
```
**Common errors:** `INVALID_TOKEN`, `MISSING_PERMISSION` (needs `pages_read_engagement`).

---

### `POST /api/meta/instagram/post`
**Purpose:** Publish an image post to Instagram (2-step container → publish flow).
**Body:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `imageUrl` | string (http/https) | yes | Publicly accessible image URL |
| `caption` | string | no | ≤ 2200 chars |

```bash
curl -X POST http://localhost:5000/api/meta/instagram/post \
  -H "Content-Type: application/json" \
  -d '{ "imageUrl": "https://example.com/pic.jpg", "caption": "Hello from Lucrator" }'
```
```json
{ "success": true, "data": { "published": true, "mediaId": "1789...", "containerId": "1789..." } }
```
**Common errors:** `BAD_REQUEST` (missing/invalid `imageUrl`), `META_BAD_REQUEST` (image not reachable / wrong format), `MISSING_PERMISSION` (needs `instagram_content_publish`), `RATE_LIMITED`.

---

### `POST /api/meta/facebook/post`
**Purpose:** Publish a text and/or image post to the Facebook Page.
**Body:** (at least one of `message`/`imageUrl` required)
| Field | Type | Required | Notes |
|---|---|---|---|
| `message` | string | conditional | Post text (≤ 5000) |
| `imageUrl` | string (http/https) | conditional | If present → photo post |

```bash
curl -X POST http://localhost:5000/api/meta/facebook/post \
  -H "Content-Type: application/json" \
  -d '{ "message": "Big news!", "imageUrl": "https://example.com/pic.jpg" }'
```
```json
{ "success": true, "data": { "published": true, "type": "photo", "postId": "6159..._1234", "photoId": "1011..." } }
```
**Common errors:** `BAD_REQUEST` (neither field), `MISSING_PERMISSION` (needs `pages_manage_posts`; usually a Page token), `INVALID_TOKEN`.

---

### `GET /api/meta/instagram/comments`
**Purpose:** Recent comments across recent media.
**Query:** `mediaLimit` (optional, default 10) — how many recent posts to scan.

```bash
curl "http://localhost:5000/api/meta/instagram/comments?mediaLimit=5"
```
```json
{
  "success": true,
  "data": {
    "count": 2,
    "comments": [
      { "commentId": "178...", "text": "🔥", "username": "user1", "timestamp": "2026-06-27T09:00:00+0000", "likeCount": 0, "mediaId": "178...", "mediaPermalink": "https://instagram.com/p/..." }
    ]
  }
}
```
**Common errors:** `MISSING_PERMISSION` (needs `instagram_manage_comments`), `INVALID_TOKEN`.

---

### `POST /api/meta/instagram/comments/reply`
**Purpose:** Reply to a specific Instagram comment.
**Body:**
| Field | Type | Required |
|---|---|---|
| `commentId` | string | yes |
| `message` | string (≤ 2200) | yes |

```bash
curl -X POST http://localhost:5000/api/meta/instagram/comments/reply \
  -H "Content-Type: application/json" \
  -d '{ "commentId": "17900000000000000", "message": "Thanks! 🙌" }'
```
```json
{ "success": true, "data": { "replied": true, "replyId": "1790...", "commentId": "1790..." } }
```
**Common errors:** `BAD_REQUEST`, `MISSING_PERMISSION` (needs `instagram_manage_comments`), `META_BAD_REQUEST` (comment not found).

---

### `GET /api/meta/instagram/messages`
**Purpose:** Retrieve Instagram DMs. **Requires extra setup** (Page token + advanced permissions + webhook). Until configured, returns a structured explanation instead of failing silently.
**Query:** `limit` (optional, default 20).

```bash
curl http://localhost:5000/api/meta/instagram/messages
```
Response when prerequisites are not met (HTTP `501`):
```json
{
  "success": false,
  "data": {
    "status": "requires_setup",
    "action": "instagram.getConversations",
    "implemented": false,
    "reason": "Instagram/Messenger DM access requires a Page token, advanced permissions, and a webhook.",
    "requiredPermissions": ["instagram_manage_messages", "pages_messaging", "pages_manage_metadata"],
    "setupSteps": [ "Connect the IG account to a Facebook Page.", "..." ],
    "docs": "https://developers.facebook.com/docs/messenger-platform/instagram"
  }
}
```
Once `FACEBOOK_PAGE_ACCESS_TOKEN` + permissions are in place, the same endpoint returns `{ status: "ok", conversations: [...] }`.

---

### `POST /api/meta/instagram/messages/reply`
**Purpose:** Reply to an Instagram DM. Same setup requirements as above.
**Body:**
| Field | Type | Required |
|---|---|---|
| `recipientId` | string | yes |
| `message` | string (≤ 1000) | yes |

```bash
curl -X POST http://localhost:5000/api/meta/instagram/messages/reply \
  -H "Content-Type: application/json" \
  -d '{ "recipientId": "1789...", "message": "Hi! How can we help?" }'
```
Returns `501` + `requires_setup` until configured; afterwards `{ status: "ok", messageId: "..." }`.
**Note:** Meta only allows replies within the messaging window (typically 24h after the user's last message).

---

### `POST /api/meta/schedule`
**Purpose:** Queue a post for later. **Structure only** — the job is stored and validated but **not executed yet** (no scheduler engine wired in). Designed so node-cron, BullMQ, or a DB-backed worker can be added in `services/scheduler/SchedulerService.js` without touching controllers or the frontend.
**Body:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `target` | string | yes | One of `instagram.post`, `facebook.post`, `instagram.comment.reply` |
| `scheduledAt` | ISO datetime string | yes | Must be in the future |
| `payload` | object | yes | Action-specific (e.g. `{ imageUrl, caption }`) |

```bash
curl -X POST http://localhost:5000/api/meta/schedule \
  -H "Content-Type: application/json" \
  -d '{ "target": "instagram.post", "scheduledAt": "2026-07-01T12:00:00.000Z", "payload": { "imageUrl": "https://example.com/pic.jpg", "caption": "Scheduled!" } }'
```
Response (HTTP `202 Accepted`):
```json
{
  "success": true,
  "data": {
    "id": "uuid", "target": "instagram.post", "scheduledAt": "2026-07-01T12:00:00.000Z",
    "status": "queued", "engineActive": false,
    "note": "Job stored but NOT yet executed — scheduler engine is not active. ..."
  }
}
```
**Common errors:** `BAD_REQUEST` (unsupported target, past/invalid `scheduledAt`).

---

### `GET /api/meta/webhook`
**Purpose:** Meta webhook **verification handshake**. Meta calls this once when you register the webhook; it echoes back `hub.challenge` if `hub.verify_token` matches `WEBHOOK_VERIFY_TOKEN`.
**Query:** `hub.mode`, `hub.verify_token`, `hub.challenge` (sent by Meta).
**Returns:** the challenge string (200) or `403`.

### `POST /api/meta/webhook`
**Purpose:** Receives real-time events (Instagram DMs, comments). **Signature-verified** via `X-Hub-Signature-256` (HMAC-SHA256 of the raw body with `META_APP_SECRET`); unsigned/invalid requests get `403`. Always returns `200` quickly, then processes.
**Behavior:** logs the event, stores it in a recent-events buffer, and (if `AUTO_REPLY_ENABLED=true`) auto-replies to new DMs with `AUTO_REPLY_MESSAGE`.

### `GET /api/meta/webhook/events`
**Purpose:** Debug — returns the last 100 received webhook events (no secrets). Useful for verifying delivery and building a future activity feed.

---

## Deployment (required for webhooks)

Webhooks need a public HTTPS URL, so the backend must be deployed. A **Render Blueprint** is included (`../render.yaml`).

1. Push the repo to GitHub.
2. **Render → New → Blueprint** → select the repo. It reads `render.yaml` and creates the service (`rootDir: backend`).
3. When prompted, paste the secret values (`META_*`, `INSTAGRAM_ACCOUNT_ID`, `FACEBOOK_PAGE_ID`, `WEBHOOK_VERIFY_TOKEN`) — same as your local `.env`.
4. Deploy. Your backend is now at e.g. `https://lucrator-backend.onrender.com`.

### Register the webhook in Meta
1. App Dashboard → your use case (Instagram / Pages) → **Webhooks**.
2. **Callback URL:** `https://<your-render-url>/api/meta/webhook`
3. **Verify token:** the same `WEBHOOK_VERIFY_TOKEN` value.
4. Subscribe to fields: `messages`, `messaging_postbacks`, `comments`.
5. Subscribe the **Page** to the app.

After this, inbound DMs/comments arrive at `POST /api/meta/webhook` in real time.

---

## Security summary

- **API-key auth** (`x-api-key`) on all sensitive endpoints; fails closed in production.
- `.env` gitignored; secrets never committed.
- CORS restricted to `FRONTEND_URL` / `PRODUCTION_FRONTEND_URL` (defense in depth, not the primary control — the API key is).
- Helmet security headers.
- Global rate limit (300 req / 15 min per IP) + stricter write limit (20 req / min) on publish/reply.
- Per-route request validation.
- Access tokens & app secret are **never** sent to the frontend and are redacted from logs and error payloads.

## Roadmap (plug-in points)
WhatsApp Business · Messenger · LinkedIn · TikTok · Google Business Profile · Gmail · Google Calendar · Stripe · Claude/OpenAI caption generation · AI DM replies · CRM lead creation from DMs/comments. Each follows the provider extension pattern above.
