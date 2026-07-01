import 'dotenv/config'

// Default search space. Override per-run with CLI flags:
//   node find.js --industries "hvac,mechanic" --cities "Austin,Dallas" --max 50
export const DEFAULT_CITIES = [
  'Houston',
  'San Antonio',
  'Dallas',
  'Austin',
  'Fort Worth',
  'El Paso',
  'Arlington',
  'Corpus Christi',
  'Plano',
  'Lubbock',
]

// keyword -> friendly label used in the email body.
export const INDUSTRIES = [
  { keyword: 'restaurant', label: 'restaurant' },
  { keyword: 'cafe', label: 'cafe' },
  { keyword: 'hair salon', label: 'salon' },
  { keyword: 'nail salon', label: 'salon' },
  { keyword: 'medical clinic', label: 'clinic' },
  { keyword: 'dental clinic', label: 'dental practice' },
  { keyword: 'auto repair shop', label: 'auto shop' },
  { keyword: 'HVAC contractor', label: 'HVAC business' },
]

export const env = {
  placesKey: process.env.GOOGLE_PLACES_API_KEY || '',
  gmailUser: process.env.GMAIL_USER || '',
  gmailPass: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
  senderName: process.env.SENDER_NAME || 'The Lucrator team',
  replyTo: process.env.REPLY_TO || process.env.GMAIL_USER || '',
  mailingAddress: process.env.MAILING_ADDRESS || 'Lucrator',
  dailyCap: Number(process.env.DAILY_SEND_CAP || 40),
  minDelay: Number(process.env.MIN_DELAY_SECONDS || 45),
  maxDelay: Number(process.env.MAX_DELAY_SECONDS || 90),
  llm: {
    apiKey: process.env.LLM_API_KEY || '',
    baseUrl: (process.env.LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/$/, ''),
    model: process.env.LLM_MODEL || 'gemini-2.5-flash',
  },
}

// Tiny CLI flag parser: --key value  (and bare --dry-run style booleans)
export function parseArgs(argv = process.argv.slice(2)) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const key = a.slice(2)
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) {
      out[key] = true
    } else {
      out[key] = next
      i++
    }
  }
  return out
}
