---
name: lead-saving-system
description: >-
  Scaffold a complete, client-ready "lead saving system" — a sales pipeline /
  lead-management dashboard (the same kind as our internal Lucrator admin) backed
  by a Google Sheet, plus a public lead-capture form that feeds it. Use this
  whenever we're building a CRM, pipeline board, lead tracker, lead database,
  prospect/deal manager, or "admin dashboard" for a client, or when someone says
  "set up the lead system / pipeline / lead saving system for <business>", even
  if they don't name this skill. This is our standard starting template — reach
  for it instead of writing a lead dashboard from scratch. ALWAYS begin by
  collecting the client brief (industry, brand name, colors, services, team)
  before generating anything.
---

# Lead Saving System

This skill builds the lead-management product we sell to clients: a password-gated
**pipeline dashboard** (Potential → Closed deals, plus a month Calendar, a stat
strip, and search/filter/sort) whose database is a **Google Sheet** reached
through a **Google Apps Script Web App** — no server to host or pay for. A
self-contained **public lead form** pushes inbound leads straight into the
pipeline. Until the Sheet is wired up, the whole UI runs on in-memory mock data
so it's fully clickable offline for demos.

It's the same architecture as our own Lucrator admin, generalized into a template.
Everything brand-specific is centralized in **two files** (`src/admin/config.js`
and `src/index.css`), so spinning up a new client is "copy the template, answer a
few questions, edit those two files, deploy a Sheet."

## Why it's built this way (so you can adapt it confidently)

- **Google Sheet as the database.** Clients trust a spreadsheet; it's free,
  shareable, and needs no backend hosting. The Apps Script Web App is the only
  moving part and it lives in *their* Google account, so we hand off cleanly.
- **Token + password, not real auth.** This is an internal pipeline board, not a
  bank. A shared `API_TOKEN` (site ↔ script) plus an `ADMIN_PASSWORD` gate is the
  right amount of security for the value at stake. Don't over-engineer it.
- **Mock-data fallback (`IS_LIVE`).** Lets us demo and develop with zero setup,
  and degrades gracefully if the Sheet is unreachable. Keep this — it's what makes
  the template feel instantly alive.
- **One config object drives the columns.** The Sheet headers, the dashboard
  columns, the dropdowns, and the mock data all derive from `config.js`. Change a
  column in one place and the whole app follows.

## Step 1 — Always collect the brief first

Before writing any files, gather what makes this client's system theirs. Use the
`AskUserQuestion` tool (it's faster for the user than free-typing) for the choices
below, but adapt — if they already told you some of this, don't re-ask.

Collect:

1. **Business / brand name** — e.g. "NorthAir HVAC", "Bloom Dental". Drives the
   dashboard title, the logo initial, and the session key.
2. **Industry / niche** — shapes the placeholder copy, the example mock leads, and
   the default services. (HVAC, dental clinic, real estate, catering, law firm…)
3. **Brand color** — the single confident accent. Ask for a hex or a described
   color ("wine red", "forest green", "navy"). You'll convert it to the `clay`
   token in `index.css`. One accent only — see `references/theming.md`.
4. **Services / packages they sell** — the dropdown of what a lead can be
   interested in and what gets "bought" on close. Default to a sensible set for
   the industry if they're unsure.
5. **Team members (closers)** — the people who own/close deals. Even one name is
   fine; default to a single owner.
6. **Where it should live** — a **standalone app** we host/hand off (default), or
   **dropped into an existing client site** they already have. See Step 4.

Pipeline statuses (Open / In Progress / Completed / Canceled) and the column
layout are good defaults — only change them if the client clearly needs different
stages. Don't ask about passwords yet; you'll generate strong defaults and tell
them where to change them during setup.

## Step 2 — Scaffold from the template

The complete, working app lives in `assets/template/`. Copy it into the target
location (a new folder for a standalone build, or merge into their existing
project — see Step 4). It's a Vite + React 18 + Tailwind v4 app with no backend
dependency.

Read `references/architecture.md` for the file-by-file map and the data flow if
you need to reason about how a piece fits before changing it.

## Step 3 — Apply the brief (edit only these spots)

The template is intentionally generic ("Acme" brand, neutral indigo accent). To
make it the client's, you edit a short, well-defined list — resist touching
anything else, since the rest is proven and shared across clients:

1. **`src/admin/config.js` → the `BRAND` object** — `name`, `initial` (one
   letter for the logo chip), and `tagline`.
2. **`src/admin/config.js` → `SERVICES`** — the packages/services dropdown.
3. **`src/admin/config.js` → `CLOSERS`** — the team.
4. **`src/admin/config.js` → `MOCK_DATA`** — replace the example leads with 3–4
   believable ones for this industry, so demos look real. Keep the column keys
   exactly as they are.
5. **`src/index.css` → the `/* brand accent */` block** — set the `clay` tokens to
   the client's color. Follow `references/theming.md`; it's an OKLCH recipe, not
   guesswork. Leave the functional colors (`win` green, `alert` red) alone unless
   the client explicitly wants a strict single-hue look.
6. **`index.html`** — `<title>` and meta description.

That's it. Statuses, columns, and Sheet headers only change if the brief said so —
and if you change a column, change it in **both** `config.js` (`COLS`) **and**
`google/Code.gs` (`SHEETS`), because they must match exactly. See
`references/architecture.md` → "Changing columns".

## Step 4 — Standalone vs. existing site

- **Standalone (default).** Copy the whole `assets/template/` into a new folder
  (e.g. `clients/<brand>-leads/`). `npm install && npm run dev`. The root route is
  a clean landing page with the lead form; `#/admin` is the dashboard.
- **Into an existing client site** that's already Vite + React + Tailwind: copy
  `src/admin/` and `src/LeadForm.jsx`, merge the brand + functional tokens from
  `src/index.css` into their theme, add the hash-route check from `src/App.jsx`
  (the `#/admin` branch), and import the lead form where they want it. Don't drag
  in the template's landing page.

After copying, verify it runs (`npm run dev`, open the root and `#/admin` —
password is in `config.js`). The dashboard should show the mock leads immediately.

## Step 5 — Wire the Google Sheet (go-live)

The app works on mock data with zero setup, but to actually save leads the client
needs their Sheet. Walk them through `google/SETUP.md` (it's in the template,
already client-facing). The short version:

1. New Google Sheet → Extensions ▸ Apps Script → paste `google/Code.gs`.
2. Set `API_TOKEN` in `Code.gs` to a long random string; run `setup()` to build
   the tabs; Deploy ▸ Web app (Execute as: Me, Access: Anyone) → copy the `/exec`
   URL.
3. In `src/admin/config.js` set `APPS_SCRIPT_URL`, `API_TOKEN` (same string), and
   `ADMIN_PASSWORD`. `IS_LIVE` flips true automatically and the app goes live.

Generate strong default values for `API_TOKEN` and `ADMIN_PASSWORD` so nothing
ships blank, and tell the client these are theirs to keep secret. Never commit a
client's real token/password to a public repo.

## Working as a two-person team (Mac + Windows, via GitHub)

This template is committed and pulled across machines, so keep it OS-agnostic:
relative paths only, LF line endings, never commit `node_modules` or `dist` (the
template's `.gitignore` covers this). The `.nvmrc` pins Node 20 so both machines
match. Nothing in the scaffold is platform-specific — if you add tooling, make
sure it runs the same on macOS and Windows.

## Quick reference

| You want to… | Edit |
| --- | --- |
| Rename the brand / change the logo letter | `config.js` → `BRAND` |
| Recolor to the client's brand | `index.css` → brand accent block (see theming.md) |
| Change the services dropdown | `config.js` → `SERVICES` |
| Change who can close deals | `config.js` → `CLOSERS` |
| Make the demo data look like the client | `config.js` → `MOCK_DATA` |
| Add/rename a pipeline column | `config.js` → `COLS` **and** `Code.gs` → `SHEETS` |
| Go live (save real leads) | `google/SETUP.md` + fill `config.js` top three values |

Reference files:
- `references/architecture.md` — file map, data flow, how to change columns safely.
- `references/theming.md` — the OKLCH single-accent color recipe + worked examples.
