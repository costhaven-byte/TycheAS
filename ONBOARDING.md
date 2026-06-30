# Lucrator — Deploy & Client Onboarding Runbook

This is the step-by-step for getting a client live with the **lead saver** + **chatbot**
(booking/buying agent), and for adding more clients with minimal effort afterward.

The design goal: **do the heavy setup ONCE**, then each new client is ~3 small steps
and **zero re-deploying of scripts**.

```
                         ┌─────────────────────────────┐
   client's website  ──▶ │  Chatbot widget (per client) │
   client's IG/FB DMs ──▶ │      ↓ clientId               │
                         │   Backend (deployed ONCE)     │ ──┐
                         └─────────────────────────────┘   │  books/sells by clientId
                                                            ▼
                         ┌─────────────────────────────────────────┐
                         │  Platform Apps Script (deployed ONCE)     │
                         │  → creates + routes each client's Sheet   │
                         └─────────────────────────────────────────┘
                                       │ provisions
                                       ▼
                   Client A Sheet   Client B Sheet   Client C Sheet …
                   (Leads/Bookings/Sales tabs)  ──▶  shown in their dashboard
```

---

## PART 1 — One-time setup (do this once, ever)

### 1A. Deploy the Platform (the database for ALL clients)
1. Go to <https://script.google.com> → **New project**.
2. Delete the default code, paste the contents of **`google/Platform.gs`**.
3. Run the **`setup`** function once (Run ▸ select `setup` ▸ authorize when asked).
4. Open **View ▸ Logs** (or Execution log) and copy the two values it prints:
   - the **ADMIN token** (starts with `admin_…`)
   - the master registry spreadsheet URL (just so you know where the client list lives)
5. **Deploy ▸ New deployment ▸ type: Web app**
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - Click **Deploy**, copy the **`/exec` URL**.

You now have: `APPS_SCRIPT_URL` (the /exec URL) and the `ADMIN token`. Keep them safe.

> You never touch this script again to add clients. Only re-deploy (Manage deployments
> ▸ Edit ▸ New version) if you change `Platform.gs` itself.

### 1B. Deploy the backend (the chatbot brain, deployed ONCE)
The repo has `render.yaml` (Render, free tier). Deploy it, then set env vars
(Render dashboard → your service → Environment). Use `backend/.env.example` as the list.
The ones that matter for this feature:

| Env var | Value |
| --- | --- |
| `CHATBOT_API_KEY` | your LLM key (Gemini demo key is in `.env` for local) |
| `CHATBOT_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `CHATBOT_MODEL` | `gemini-2.5-flash` (2.0-flash is quota-0 on the demo project) |
| `APPS_SCRIPT_URL` | the Platform `/exec` URL from 1A |
| `CRM_API_TOKEN` | the **ADMIN token** from 1A |
| `META_*`, `WEBHOOK_VERIFY_TOKEN` | your Meta app creds (for DM channel) |

Note the backend's public URL (e.g. `https://lucrator-backend.onrender.com`).

### 1C. Register the Meta webhook (only if using IG/FB DMs)
In the Meta App dashboard → Webhooks: callback `=<backend URL>/api/meta/webhook`,
verify token `= WEBHOOK_VERIFY_TOKEN`. Subscribe to `messages` (and `feed`/`comments`
if you want comment replies). This is an app-level step — done once.

---

## PART 2 — Add a client (repeat per client, minimal effort)

### 2A. Provision their Sheet (one call — no script redeploy)
This creates their private Google Sheet with **Leads / Bookings / Sales** tabs, plus a
**Config** tab that holds their chatbot's brain (business name, services, FAQ, booking
types). Two ways to run it — use either:

**Option A — via your backend (recommended):**
```bash
curl -X POST "<BACKEND_URL>/api/admin/provision" \
  -H "Content-Type: application/json" -H "x-api-key: <YOUR_API_KEY>" \
  -d '{"clientName":"Ahmed Restaurant","industry":"Restaurant"}'
```

**Option B — directly against the Platform script:**
```bash
curl -L "<APPS_SCRIPT_URL>?token=<ADMIN_TOKEN>&action=provision&clientName=Ahmed%20Restaurant&industry=Restaurant"
```

Response:
```json
{ "ok": true, "client": {
  "clientId": "C-260630-…",
  "spreadsheetId": "1AbC…",
  "url": "https://docs.google.com/spreadsheets/d/1AbC…/edit",
  "token": "cli_…"
}}
```
- **Share the `url`** with the client (or keep it) — that's their live database.
- Save the **`clientId`** and per-client **`token`** for the next two steps.
- Optional: open their sheet's **Config** tab and tailor the bot — Business name, About,
  Services, Booking types, Tone, FAQ. The bot picks up edits within ~5 minutes, no redeploy.

### 2B. Deploy their dashboard (the lead saver)
The dashboard (the `lead-saving-system` template) is configured by **env vars only** — no
code changes per client. Set these on the deploy (e.g. Vercel → Environment):
```
VITE_APPS_SCRIPT_URL = <shared Platform /exec URL>
VITE_CLIENT_ID       = <clientId from 2A>
VITE_CLIENT_TOKEN    = <per-client token from 2A>
VITE_ADMIN_PASSWORD  = <a password for this client's dashboard>
VITE_BRAND_NAME      = Ahmed's Restaurant
VITE_BRAND_INITIAL   = A
VITE_API_BASE_URL    = <backend URL>     # also turns on the website chatbot widget
VITE_CHATBOT_CLIENT_ID = <clientId from 2A>
```
Their dashboard shows **Leads**, **Bookings**, **Sales**, and a **Calendar** that reads the
Bookings tab — so appointments the chatbot makes appear automatically.

### 2C. Put the chatbot on the client's website
Two options:
- **The template site already includes it** — setting `VITE_API_BASE_URL` + `VITE_CHATBOT_CLIENT_ID`
  (above) auto-loads the widget on the client's landing page.
- **Any other website** — drop one script tag (host `public/lucrator-widget.js` somewhere, e.g. your CDN/backend):
```html
<script src="https://YOUR_HOST/lucrator-widget.js"
        data-api="<BACKEND_URL>"
        data-client-id="<clientId from 2A>"
        data-name="Ahmed's Restaurant"
        data-accent="#b4532a"></script>
```
The widget speaks as the client's business and books/sells into their Sheet.

### 2D. Connect the client's Instagram/Facebook DMs (optional)
Have them share their Page + IG to your Business as a Partner, assign those assets to your
`lucrator backend` system user, and set `CRM_CLIENT_ID` (+ their `FACEBOOK_PAGE_ID` /
`INSTAGRAM_ACCOUNT_ID` / token) on the backend. (Serving many clients' DMs from one backend
needs a Page-ID→clientId map — a small follow-up; website widgets are already multi-client.)

That's it — the client is live: their site/DMs are answered by the agent speaking as their
business, and every booking/sale lands in their Sheet and on their dashboard calendar.

---

## Security checklist (before real launch)
- **Rotate** the demo Gemini key and the Meta **App Secret** (both appeared in chat).
- Each client's per-client token only accesses *their own* data; the ADMIN token
  (backend only) can reach all clients — never put the ADMIN token in any browser/frontend.
- Free Gemini tier has low rate limits; enable billing for production volume.

## What's built
- ✅ Platform (multi-tenant DB + provisioning + per-client Config tab) — `google/Platform.gs`
- ✅ Chatbot speaks AS each client's business (config from their Sheet) and books/sells into
  their Sheet by `clientId` (website widget + DMs)
- ✅ Client lead-saver dashboard on the Platform: Leads / Bookings / Sales + bookings Calendar
- ✅ One-call provisioning endpoint + embeddable website widget
- ⏳ Follow-up: Page-ID→clientId map so one backend serves many clients' DMs at once
```
