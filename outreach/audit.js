import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env, parseArgs } from './config.js'
import { readCsv } from './lib/csv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_PATH = path.join(__dirname, 'templates', 'audit.html')
const LEADS_PATH = path.join(__dirname, 'data', 'leads.csv')
const OUT_DIR = path.join(__dirname, 'data', 'audits')

function slugify(s) {
  return (s || 'audit')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function findLead(query) {
  if (!query) return null
  const q = String(query).toLowerCase()
  const leads = readCsv(LEADS_PATH)
  return (
    leads.find((l) => (l.email || '').toLowerCase() === q) ||
    leads.find((l) => (l.business || '').toLowerCase().includes(q)) ||
    null
  )
}

function main() {
  const args = parseArgs()
  const query = args.for || args._?.[0] || process.argv[2]
  const lead = findLead(query)

  if (query && !lead) {
    console.error(`✗ No lead in leads.csv matches "${query}". Generating a blank audit instead.`)
  }

  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const fields = {
    BUSINESS: esc(lead?.business || 'Business name'),
    INDUSTRY: esc(lead?.industryLabel || lead?.industry || '—'),
    CITY: esc(lead?.city || '—'),
    WEBSITE: esc((lead?.website || '—').replace(/^https?:\/\//, '').replace(/\/.*$/, '')),
    PHONE: esc(lead?.phone || '—'),
    RATING: esc(lead?.rating || '—'),
    REVIEWS: esc(lead?.reviews || '—'),
    DATE: esc(date),
    PREPARED_BY: esc(env.senderName || 'Lucrator'),
    REPLY_TO: esc(env.replyTo || env.gmailUser || 'contact.lucrator@gmail.com'),
    RECO: '',
    NEXT: '',
  }

  let html = fs.readFileSync(TEMPLATE_PATH, 'utf8')
  for (const [k, v] of Object.entries(fields)) {
    html = html.replaceAll(`{{${k}}}`, v)
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const outPath = path.join(OUT_DIR, `${slugify(lead?.business || query || 'blank')}-audit.html`)
  fs.writeFileSync(outPath, html, 'utf8')

  console.log(`✓ Audit ready: ${path.relative(process.cwd(), outPath)}`)
  console.log('  Open it in your browser, fill it in on the call, then use the "Save as PDF" button to send.')
  console.log(`  (On Windows: start "" "${outPath}")`)
}

main()
