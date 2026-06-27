# Architecture — how the lead saving system fits together

A single Vite + React 18 + Tailwind v4 app with two faces, sharing one datastore.

```
Public lead form ──submitLead()──┐
                                 ├──> Apps Script Web App ──> Google Sheet
Admin dashboard ──list/add/...───┘        (google/Code.gs)     (the database)
   (#/admin)
```

When the Sheet isn't configured (`IS_LIVE === false`), every call instead reads
and mutates an in-memory copy of `MOCK_DATA`, so the whole thing works offline.

## File map

```
template/
├── package.json          Vite + React + framer-motion + Tailwind v4. Node ≥20.
├── vite.config.js        React + @tailwindcss/vite plugins. host:true for LAN demos.
├── index.html            <title>/meta — edit per client. Mounts #root.
├── .gitignore / .nvmrc   node_modules/dist ignored; Node 20 pinned (Mac+Windows).
├── google/
│   ├── Code.gs           The entire backend. Paste into Apps Script. Token-gated.
│   └── SETUP.md          Client-facing go-live guide.
└── src/
    ├── main.jsx          React root. No providers — kept dependency-light.
    ├── App.jsx           Zero-dep hash routing: #/admin → dashboard, else landing.
    ├── index.css         Tailwind theme. Brand accent + functional color tokens.
    ├── LeadForm.jsx       Self-contained public lead form → submitLead().
    └── admin/
        ├── config.js     THE control panel: brand, columns, services, team,
        │                 statuses, mock data, and the 3 go-live secrets.
        ├── api.js        Data access. Live (Apps Script) or mock, chosen by IS_LIVE.
        ├── AdminApp.jsx  Dashboard shell: password gate → board + calendar + modals.
        └── components/
            ├── shared.jsx          Modal, form controls, status pill, icons, dates.
            ├── StatCards.jsx       The six-count summary strip.
            ├── DealsTable.jsx      One table for both tabs; search/filter/sort + row menu.
            ├── Calendar.jsx        Month grid; due/activation/end dates as events.
            ├── AddProspectModal.jsx   Add an off-website prospect.
            ├── MoveToClosedModal.jsx  Convert a prospect into a closed deal.
            ├── DealStatusModal.jsx    Set "In Progress" (assign) or Cancel.
            └── DeleteDealModal.jsx    Permanently delete a canceled prospect.
```

## Data flow

- **Inbound lead** → `LeadForm` validates → `submitLead()` (api.js) → `addLead`
  action in `Code.gs` → appended to the **Potential deals** tab. Fire-and-forget:
  the form shows success regardless and logs on failure, so a backend hiccup never
  blocks the visitor.
- **Dashboard load** → `listDeals()` → `list` action → reads both tabs into arrays
  of row objects keyed by header (each carries its 1-based sheet `row`).
- **Add prospect** → `addProspect()` → `addProspect` action → new Potential row.
- **Set in progress / Cancel** → `updateDeal()` → `updateDeal` action → sets the
  row's `Status` (and `Assigned To`) in place by Client ID.
- **Move to closed** → `moveToClosed()` → `moveToClosed` action → appends a row to
  **Closed deals** and removes the prospect from Potential (the full record lives
  on in Closed).
- **Delete** → `deleteDeal()` → `deleteDeal` action → removes the Potential row.

Every request carries the shared `token`. POSTs are sent as `text/plain` to skip
the CORS preflight (Apps Script can't answer `OPTIONS`), and every field is also
mirrored onto the query string because Apps Script answers a POST with a 302 that
`fetch` follows as a GET, which can drop the body. This is load-bearing — don't
"clean it up" into a normal JSON POST or live mode breaks.

## The two tabs (columns)

**Potential deals:** Client Name · Client ID · Industry · Interest in Package ·
Need (prototype) · Receive/Due Date · Status · Assigned To

**Closed deals:** Client Name · Client ID · Industry · Package Bought · Duration ·
Closer · Activation Date · End Date

`Client ID` is auto-generated (`P-`/`C-` + timestamp) when missing, and is the key
used to update/move/delete a row.

## Changing columns safely

The headers exist in two places that **must** agree, or live mode silently breaks:

1. `google/Code.gs` → `SHEETS.<tab>.headers` (the actual spreadsheet columns).
2. `src/admin/config.js` → `COLS.<tab>` (the keys the UI reads by).

If you rename, add, or reorder a column, edit **both**, then in the deployed
script re-run `setup()` (creates/repairs the header row) **and** redeploy the Web
App as a **new version** (Manage deployments ▸ edit ▸ Version: New) — otherwise the
old code keeps serving. The table column lists live in `DealsTable.jsx`
(`POTENTIAL_COLS` / `CLOSED_COLS`) and reference `COLS`, so add a `{ key, label }`
there too for it to show.

## Known gotcha — framer-motion under StrictMode

`AnimatePresence` exit-unmount is unreliable under React StrictMode in dev and can
leave modals/menus stuck on screen. The template therefore renders modals with a
plain `if (!open) return null` (enter animation only) and switches views by keyed
remount, not by `AnimatePresence`. Don't reintroduce `AnimatePresence` for
show/hide in the admin. Modal footer submit buttons call
`form.requestSubmit()` directly rather than relying on the `form="id"` attribute
across the modal's DOM boundary.
