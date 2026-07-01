# Lucrator Outreach

Find local Texas businesses on Google Maps, scrape a contact email from their
website, and send a short, human, A/B-tested Lucrator email — rate-limited and
logged.

It's split into two commands on purpose: **`find` never sends**, and **`send`
only touches `data/leads.csv`** — so you always review the list before a single
email goes out.

## 1. Setup

```bash
cd outreach
npm install
cp .env.example .env      # then fill it in (see below)
```

Fill `.env`:

| Var | What |
|-----|------|
| `GOOGLE_PLACES_API_KEY` | Key with **Places API (New)** enabled in Google Cloud. |
| `GMAIL_USER` | The Gmail/Workspace address the App Password belongs to. |
| `GMAIL_APP_PASSWORD` | 16-char App Password (myaccount.google.com/apppasswords). |
| `SENDER_NAME` | Signature name (e.g. "Selim from Lucrator"). |
| `REPLY_TO` | Where replies should land (defaults to `GMAIL_USER`). |
| `MAILING_ADDRESS` | Real address or business name — **legally required** on the unsubscribe line. |
| `DAILY_SEND_CAP` | Max emails per `send` run (default 40). |
| `MIN/MAX_DELAY_SECONDS` | Random gap between sends (default 45–90s). |

> **Google Cloud:** enable *Places API (New)* (not just the legacy one), then
> restrict the key to that API + your IP so a leak can't rack up charges.

## 2. Find leads

```bash
npm run find                                   # defaults: 8 industries × 10 TX cities, up to 50 emails
npm run find -- --industries "HVAC contractor,auto repair shop" --cities "Austin,Dallas" --max 30
```

Writes `data/leads.csv`. **Open it and prune** anything off-target before sending.
Not every business publishes an email — expect roughly a third to half to yield one.

## 3. Send

```bash
npm run send -- --dry-run        # prints every email exactly as it would send — nothing leaves
npm run send                     # sends up to DAILY_SEND_CAP, then stops
npm run send -- --limit 10       # send just 10
```

- Already-emailed addresses are skipped automatically, so you can run it daily
  until the list is done (respecting the cap).
- Every send is logged to `data/sent-log.csv`.

## 4. A/B tracking

Two variants ship in `lib/template.js` (different subject + angle), split evenly.
Scoring is by **reply** — the only metric that's honest without a tracking pixel
(Gmail proxies/caches images, so open tracking lies).

As replies come in, put any value in the `replied` column of
`data/sent-log.csv`, then:

```bash
npm run stats
```

...to see sent / replied / reply-rate per variant. Keep the winner, rewrite the
loser.

## When someone accepts — the audit deliverable

When a prospect replies "yes, I'd like the audit," generate their one-pager:

```bash
npm run audit -- --for "Brennan's"        # match by business name...
npm run audit -- --for info@example.com   # ...or by email
```

This reads `data/leads.csv` and writes a branded, pre-filled HTML audit to
`data/audits/<business>-audit.html`. Open it in a browser, and **on the call**:

- click a status per row (Solid / At risk / Leaking) — the "lead leak score"
  updates live,
- type what you found in each notes box,
- fill the recommendation + next-steps blocks,
- hit **Save as PDF** (top-right) and email it to the prospect.

Each of the six rows maps a real leak to the Lucrator module that fixes it, so
the audit doubles as the pitch. Business snapshot (industry, city, site, phone,
Google rating) is filled in automatically from the lead.

## Deliverability reality check

Your own `src/admin/components/Outreach.jsx` playbook is right: for anything
beyond a small test batch, move off plain Gmail to a dedicated sending domain
with SPF/DKIM/DMARC, and warm it up. This tool works on Gmail for a first ~40/day
batch, but don't scale a cold campaign on a personal inbox.

Every email includes a plain-text opt-out ("reply stop") and your mailing
address, per CAN-SPAM. Honor opt-outs promptly.
```
