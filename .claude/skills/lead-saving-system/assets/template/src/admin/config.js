// ============================================================================
//  CONTROL PANEL — everything client-specific lives here.
//  This dashboard reads/writes a client's Google Sheet through the shared
//  Lucrator Platform (google/Platform.gs), which is deployed ONCE for all
//  clients. Per client you only set the env values below (or the fallbacks).
//  See ONBOARDING.md for the deploy steps.
// ============================================================================

// ---- Brand (env-driven so a new client is just env vars, no code edits) ----
export const BRAND = {
  name: import.meta.env.VITE_BRAND_NAME || 'Acme',
  initial: import.meta.env.VITE_BRAND_INITIAL || 'A',
  tagline: import.meta.env.VITE_BRAND_TAGLINE || 'Dashboard',
}

// Session-storage key for "already unlocked this tab". Derived from the brand so
// two client dashboards on the same browser don't share a login.
export const SESSION_KEY = `${BRAND.name.toLowerCase().replace(/\W+/g, '_')}_admin_ok`

// ---- Platform connection (per client) --------------------------------------
// APPS_SCRIPT_URL is the shared Platform /exec URL (same for every client).
// CLIENT_ID + CLIENT_TOKEN come from provisioning this client (see ONBOARDING).
// Until all three are set, the dashboard runs on MOCK_DATA so it's clickable.
export const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''
export const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || ''
export const CLIENT_TOKEN = import.meta.env.VITE_CLIENT_TOKEN || ''
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'change-this-password'

export const IS_LIVE = Boolean(APPS_SCRIPT_URL && CLIENT_ID && CLIENT_TOKEN)

// ---- Columns ---------------------------------------------------------------
// These keys MUST match the tab headers in google/Platform.gs exactly.
export const COLS = {
  leads: {
    id: 'Lead ID',
    name: 'Name',
    contact: 'Contact',
    source: 'Source',
    interest: 'Interest',
    notes: 'Notes',
    date: 'Date',
    status: 'Status',
    owner: 'Owner',
  },
  bookings: {
    id: 'Booking ID',
    name: 'Name',
    contact: 'Contact',
    service: 'Service',
    date: 'Date',
    time: 'Time',
    status: 'Status',
    notes: 'Notes',
    source: 'Source',
    created: 'Created',
  },
  sales: {
    id: 'Sale ID',
    name: 'Name',
    contact: 'Contact',
    item: 'Item',
    amount: 'Amount',
    date: 'Date',
    notes: 'Notes',
    created: 'Created',
  },
}

// ---- Services / interests --------------------------------------------------
// The dropdown for what a lead is interested in. Swap for the client's offering.
export const SERVICES = ['General enquiry', 'Booking', 'Quote', 'Support', 'Other']

// ---- Statuses --------------------------------------------------------------
// If you add a status, also add a style in components/shared.jsx (STATUS_STYLE).
export const LEAD_STATUSES = ['New', 'Contacted', 'Won', 'Lost']
export const BOOKING_STATUSES = ['Booked', 'Done', 'Cancelled']

// ---- Demo data (shown when not yet live, so the UI is never empty) ----------
export const MOCK_DATA = {
  leads: [
    { row: 2, 'Lead ID': 'L-1', Name: 'Sarah Lopez', Contact: 'sarah@email.com', Source: 'Chatbot', Interest: 'Booking', Notes: 'Asked about weekend availability', Date: '2026-06-28', Status: 'New', Owner: '' },
    { row: 3, 'Lead ID': 'L-2', Name: 'Mehdi K.', Contact: '+216 22 123 456', Source: 'Lead form', Interest: 'Quote', Notes: 'Catering for 30', Date: '2026-06-27', Status: 'Contacted', Owner: 'Owner' },
    { row: 4, 'Lead ID': 'L-3', Name: 'Anna R.', Contact: 'anna@email.com', Source: 'Instagram', Interest: 'General enquiry', Notes: '', Date: '2026-06-25', Status: 'Won', Owner: '' },
  ],
  bookings: [
    { row: 2, 'Booking ID': 'B-1', Name: 'Sarah Lopez', Contact: 'sarah@email.com', Service: 'Table for 4', Date: '2026-07-02', Time: '19:30', Status: 'Booked', Notes: 'Window seat', Source: 'Chatbot', Created: '2026-06-28' },
    { row: 3, 'Booking ID': 'B-2', Name: 'Omar B.', Contact: '+216 20 987 654', Service: 'Table for 2', Date: '2026-07-04', Time: '20:00', Status: 'Booked', Notes: '', Source: 'Chatbot', Created: '2026-06-29' },
    { row: 4, 'Booking ID': 'B-3', Name: 'Lina T.', Contact: 'lina@email.com', Service: 'Catering', Date: '2026-06-26', Time: '', Status: 'Done', Notes: 'Birthday, 20 guests', Source: 'Chatbot', Created: '2026-06-20' },
  ],
  sales: [
    { row: 2, 'Sale ID': 'S-1', Name: 'Lina T.', Contact: 'lina@email.com', Item: 'Catering package', Amount: '600', Date: '2026-06-26', Notes: 'Birthday', Created: '2026-06-26' },
    { row: 3, 'Sale ID': 'S-2', Name: 'Walk-in', Contact: '', Item: 'Gift voucher', Amount: '50', Date: '2026-06-24', Notes: '', Created: '2026-06-24' },
  ],
}
