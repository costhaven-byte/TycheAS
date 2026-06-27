// ============================================================================
//  CONTROL PANEL — everything client-specific lives here.
//  To brand a new client you mostly edit this file + the accent block in
//  src/index.css. See .claude/skills/lead-saving-system/SKILL.md.
// ============================================================================

// ---- Brand -----------------------------------------------------------------
// name    → dashboard title + browser-visible labels
// initial → the single letter shown in the logo chip
// tagline → small text under the logo in the top bar
export const BRAND = {
  name: 'Acme',
  initial: 'A',
  tagline: 'Pipeline',
}

// Session-storage key for "already unlocked this tab". Derived from the brand so
// two client apps on the same browser don't share a login.
export const SESSION_KEY = `${BRAND.name.toLowerCase().replace(/\W+/g, '_')}_admin_ok`

// ---- Go-live secrets -------------------------------------------------------
// Until APPS_SCRIPT_URL is set, the app runs on the MOCK_DATA below so the whole
// UI is clickable offline. Fill these in after deploying the Apps Script Web App
// (see google/SETUP.md). Never commit a client's real values to a public repo.
export const APPS_SCRIPT_URL = '' // e.g. 'https://script.google.com/macros/s/XXXX/exec'
export const API_TOKEN = 'CHANGE_ME_to_a_long_random_string' // must match API_TOKEN in google/Code.gs
export const ADMIN_PASSWORD = 'change-this-password' // dashboard passphrase

// True once the backend is configured. Drives live vs. mock mode.
export const IS_LIVE = Boolean(APPS_SCRIPT_URL && API_TOKEN)

// ---- Columns ---------------------------------------------------------------
// These keys MUST match the headers in google/Code.gs (SHEETS) exactly. If you
// rename a column, change it in BOTH files and re-run setup() + redeploy.
export const COLS = {
  potential: {
    name: 'Client Name',
    id: 'Client ID',
    industry: 'Industry',
    interest: 'Interest in Package',
    need: 'Need (prototype)',
    due: 'Receive/Due Date',
    status: 'Status',
    assignee: 'Assigned To',
  },
  closed: {
    name: 'Client Name',
    id: 'Client ID',
    industry: 'Industry',
    pkg: 'Package Bought',
    duration: 'Duration',
    closer: 'Closer',
    activation: 'Activation Date',
    end: 'End Date',
  },
}

// ---- Services / packages ---------------------------------------------------
// The dropdown of what a lead is interested in and what gets "bought" on close.
// Swap these for the client's actual offering.
export const SERVICES = [
  'Starter',
  'Standard',
  'Premium',
  'Custom project',
  'Retainer',
]

// ---- Team ------------------------------------------------------------------
// People who own / close deals. One name is fine.
export const CLOSERS = ['Owner']

// Tints cycled across team members in the table (purely cosmetic).
export const CLOSER_TINTS = [
  'bg-clay-tint text-clay-ink',
  'bg-[oklch(0.95_0.03_255)] text-[oklch(0.45_0.12_255)]',
  'bg-win-tint text-win',
  'bg-[oklch(0.95_0.03_85)] text-[oklch(0.45_0.12_85)]',
]

// ---- Pipeline statuses -----------------------------------------------------
// Good defaults; only change if the client needs different stages (and update
// STATUS_STYLE in components/shared.jsx to match any new status).
export const STATUSES = ['Open', 'In Progress', 'Completed', 'Canceled']

// ---- Demo data -------------------------------------------------------------
// Shown when the backend isn't configured yet, so the UI is never empty. Replace
// with 3–4 believable leads for the client's industry. Keep the column keys.
export const MOCK_DATA = {
  potential: [
    {
      row: 2,
      'Client Name': 'Riverside Project',
      'Client ID': 'P-260612-091500',
      Industry: 'Sample industry',
      'Interest in Package': 'Premium',
      'Need (prototype)': 'Walkthrough of the premium plan',
      'Receive/Due Date': '2026-06-26',
      Status: 'Open',
    },
    {
      row: 3,
      'Client Name': 'Hillcrest Group',
      'Client ID': 'P-260610-141200',
      Industry: 'Sample industry',
      'Interest in Package': 'Retainer',
      'Need (prototype)': 'Scope a monthly retainer',
      'Receive/Due Date': '2026-06-29',
      Status: 'In Progress',
      'Assigned To': 'Owner',
    },
    {
      row: 4,
      'Client Name': 'Lakeview Co.',
      'Client ID': 'P-260605-100000',
      Industry: 'Sample industry',
      'Interest in Package': 'Standard',
      'Need (prototype)': 'Quick demo',
      'Receive/Due Date': '2026-06-24',
      Status: 'Completed',
    },
    {
      row: 5,
      'Client Name': 'Summit Partners',
      'Client ID': 'P-260601-120000',
      Industry: 'Sample industry',
      'Interest in Package': 'Custom project',
      'Need (prototype)': 'Custom concept',
      'Receive/Due Date': '2026-06-18',
      Status: 'Canceled',
    },
  ],
  closed: [
    {
      row: 2,
      'Client Name': 'Lakeview Co.',
      'Client ID': 'P-260605-100000',
      Industry: 'Sample industry',
      'Package Bought': 'Standard',
      Duration: '6 months',
      Closer: 'Owner',
      'Activation Date': '2026-06-15',
      'End Date': '2026-12-15',
    },
    {
      row: 3,
      'Client Name': 'Oakwood Ltd.',
      'Client ID': 'C-260520-090000',
      Industry: 'Sample industry',
      'Package Bought': 'Premium',
      Duration: '12 months',
      Closer: 'Owner',
      'Activation Date': '2026-06-01',
      'End Date': '2027-06-01',
    },
  ],
}
