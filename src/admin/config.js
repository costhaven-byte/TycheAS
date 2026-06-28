// Lucrator admin dashboard configuration.
// ---------------------------------------------------------------------------
// After deploying the Apps Script Web App (see google/SETUP.md), paste the
// values below. Until APPS_SCRIPT_URL is set, the dashboard runs on local mock
// data so you can see and click through the full UI offline.

export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxpx2-riu_HBdMURXt26d7tIz-1kp-G62gie05Li46A0WosZICtE47WfA1h0SNJ3wYD/exec' // e.g. 'https://script.google.com/macros/s/XXXX/exec'
export const API_TOKEN = 'E4JS0TTA9WQc7bhjliXwi4RSASKjaZwU' // must match API_TOKEN in google/Code.gs
export const ADMIN_PASSWORD = '!AShemleidm0626' // dashboard passphrase — change this

// True once the backend is configured. Drives live vs. mock mode.
export const IS_LIVE = Boolean(APPS_SCRIPT_URL && API_TOKEN)

// Column header keys — must match google/Code.gs exactly.
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

// Reused from the marketing site's offering: the CRM plus à-la-carte add-ons.
export const PACKAGES = [
  'Lucrator CRM',
  'CRM + Quote Assistant',
  'CRM + Follow-up & Reviews',
  'CRM + 24/7 Chatbot',
  'CRM + Landing Page',
  'Full Suite',
]

export const CLOSERS = ['Ahmed', 'Selim']
export const STATUSES = ['Open', 'In Progress', 'Completed', 'Canceled']

// Shown when the backend isn't configured yet, so the UI is never empty.
export const MOCK_DATA = {
  potential: [
    {
      row: 2,
      'Client Name': 'Cedar & Sage Catering',
      'Client ID': 'P-260612-091500',
      Industry: 'Catering',
      'Interest in Package': 'CRM + Quote Assistant',
      'Need (prototype)': 'Quote assistant demo on their menu',
      'Receive/Due Date': '2026-06-26',
      Status: 'Open',
    },
    {
      row: 3,
      'Client Name': 'NorthAir HVAC',
      'Client ID': 'P-260610-141200',
      Industry: 'HVAC',
      'Interest in Package': 'CRM + Follow-up & Reviews',
      'Need (prototype)': 'Missed-call follow-up flow',
      'Receive/Due Date': '2026-06-29',
      Status: 'In Progress',
      'Assigned To': 'Ahmed',
    },
    {
      row: 4,
      'Client Name': 'Bloom Dental',
      'Client ID': 'P-260605-100000',
      Industry: 'Clinic',
      'Interest in Package': 'CRM + 24/7 Chatbot',
      'Need (prototype)': 'Booking chatbot mock',
      'Receive/Due Date': '2026-06-24',
      Status: 'Completed',
    },
    {
      row: 5,
      'Client Name': 'Vista Realty',
      'Client ID': 'P-260601-120000',
      Industry: 'Real estate',
      'Interest in Package': 'CRM + Landing Page',
      'Need (prototype)': 'Landing page concept',
      'Receive/Due Date': '2026-06-18',
      Status: 'Canceled',
    },
  ],
  closed: [
    {
      row: 2,
      'Client Name': 'Bloom Dental',
      'Client ID': 'P-260605-100000',
      Industry: 'Clinic',
      'Package Bought': 'CRM + 24/7 Chatbot',
      Duration: '6 months',
      Closer: 'Selim',
      'Activation Date': '2026-06-15',
      'End Date': '2026-12-15',
    },
    {
      row: 3,
      'Client Name': 'Apex Auto Repair',
      'Client ID': 'C-260520-090000',
      Industry: 'Mechanics',
      'Package Bought': 'CRM + Quote Assistant',
      Duration: '12 months',
      Closer: 'Ahmed',
      'Activation Date': '2026-06-01',
      'End Date': '2027-06-01',
    },
  ],
}
