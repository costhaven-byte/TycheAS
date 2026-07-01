import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readCsv } from './lib/csv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOG_PATH = path.join(__dirname, 'data', 'sent-log.csv')

// A/B performance. Opens can't be tracked reliably without a pixel (and Gmail
// proxies/caches images), so we score on REPLIES — the metric that matters.
// Mark a reply by putting any non-empty value in the `replied` column of
// data/sent-log.csv (e.g. "yes", or the date they replied).
function main() {
  const rows = readCsv(LOG_PATH).filter((r) => (r.status || '').startsWith('sent'))
  if (rows.length === 0) {
    console.log('No sent emails logged yet.')
    return
  }
  const byVariant = {}
  for (const r of rows) {
    const v = r.variant || '?'
    byVariant[v] = byVariant[v] || { sent: 0, replied: 0, subject: r.subject }
    byVariant[v].sent++
    if ((r.replied || '').trim() !== '') byVariant[v].replied++
  }

  console.log(`A/B results — ${rows.length} emails sent\n`)
  console.log('Variant  Subject                        Sent  Replied  Reply rate')
  console.log('───────  ─────────────────────────────  ────  ───────  ──────────')
  for (const v of Object.keys(byVariant).sort()) {
    const s = byVariant[v]
    const rate = s.sent ? ((s.replied / s.sent) * 100).toFixed(1) + '%' : '—'
    console.log(
      `  ${v}      ${(s.subject || '').padEnd(29).slice(0, 29)}  ${String(s.sent).padStart(4)}  ${String(
        s.replied
      ).padStart(7)}  ${rate.padStart(10)}`
    )
  }
  console.log('\nTip: fill the `replied` column in data/sent-log.csv as replies come in, then re-run.')
}

main()
