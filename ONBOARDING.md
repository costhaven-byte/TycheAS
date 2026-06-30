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
Run this once per client (replace the URL, token, and name). It creates their private
Google Sheet with **Leads / Bookings / Sales** tabs and returns their IDs:

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

### 2B. Deploy their dashboard (the lead saver)
The dashboard is configured by env/values only — no code changes per client:
- `APPS_SCRIPT_URL` = the shared Platform `/exec` URL
- `clientId` = from 2A
- per-client `token` = from 2A
- brand name / color (cosmetic)

> The dashboard's calendar view reads the client's **Bookings** tab, so appointments
> the chatbot makes show up there automatically.

### 2C. Connect the chatbot to the client's channels
- **Website:** embed the widget on their site with `VITE_CHATBOT_CLIENT_ID = <clientId>`
  so its bookings/sales route to *their* Sheet.
- **Instagram/Facebook DMs:** have them share their Page + IG to your Business as a
  Partner, assign those assets to your `lucrator backend` system user, and (for
  per-client DM routing) map their Page ID → their `clientId`. For a single client,
  setting `CRM_CLIENT_ID` on the backend is enough.

That's it — the client is live: their site/DMs are answered by the agent, and every
booking/sale lands in their Sheet and on their dashboard calendar.

---

## Security checklist (before real launch)
- **Rotate** the demo Gemini key and the Meta **App Secret** (both appeared in chat).
- Each client's per-client token only accesses *their own* data; the ADMIN token
  (backend only) can reach all clients — never put the ADMIN token in any browser/frontend.
- Free Gemini tier has low rate limits; enable billing for production volume.

## What's built vs. pending
- ✅ Platform (multi-tenant DB + provisioning) — `google/Platform.gs`
- ✅ Chatbot books/sells into any client's Sheet by `clientId` (website + DMs)
- ✅ One-time + per-client deploy steps (this doc)
- ⏳ Client lead-saver dashboard wired to the Platform with the Bookings calendar view
  (the dashboard exists; pointing it at the Platform schema is the next task)
```
