import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readCsv } from '../lib/csv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOG_PATH = path.join(__dirname, 'data', 'activity-log.csv')

// Facebook-group outreach scoring. The email tool scores on replies; here the
// funnel is posts -> DMs -> calls -> booked. We can't track reach reliably, so
// we score on the metrics that matter: DMs earned, calls, and bookings.
//
// Log every post in data/activity-log.csv with its hookId and group, then fill
// in dms / calls / booked as they come in and re-run. Kill dead groups/hooks,
// double down on winners — same discipline as the cold-email A/B test.
const num = (v) => {
  const n = parseInt(String(v || '').trim(), 10)
  return Number.isFinite(n) ? n : 0
}

function tally(rows, key) {
  const out = {}
  for (const r of rows) {
    const k = (r[key] || '?').trim() || '?'
    out[k] = out[k] || { posts: 0, dms: 0, calls: 0, booked: 0 }
    out[k].posts++
    out[k].dms += num(r.dms)
    out[k].calls += num(r.calls)
    out[k].booked += num(r.booked)
  }
  return out
}

function printTable(title, obj) {
  console.log(`\n${title}`)
  console.log('Key                            Posts   DMs  Calls  Booked  DMs/post')
  console.log('─────────────────────────────  ─────  ────  ─────  ──────  ────────')
  const keys = Object.keys(obj).sort((a, b) => obj[b].dms - obj[a].dms)
  for (const k of keys) {
    const s = obj[k]
    const rate = s.posts ? (s.dms / s.posts).toFixed(2) : '—'
    console.log(
      `${k.padEnd(29).slice(0, 29)}  ${String(s.posts).padStart(5)}  ${String(s.dms).padStart(4)}  ${String(
        s.calls
      ).padStart(5)}  ${String(s.booked).padStart(6)}  ${String(rate).padStart(8)}`
    )
  }
}

function main() {
  const rows = readCsv(LOG_PATH).filter((r) => (r.postedAt || '').trim() !== '' && !/example row/i.test(r.notes || ''))
  if (rows.length === 0) {
    console.log('No Facebook posts logged yet. Log them in data/activity-log.csv (delete the example row first).')
    return
  }
  const tot = rows.reduce(
    (a, r) => ({ dms: a.dms + num(r.dms), calls: a.calls + num(r.calls), booked: a.booked + num(r.booked) }),
    { dms: 0, calls: 0, booked: 0 }
  )
  console.log(
    `Facebook group outreach — ${rows.length} posts logged | ${tot.dms} DMs · ${tot.calls} calls · ${tot.booked} booked`
  )
  printTable('By hook', tally(rows, 'hookId'))
  printTable('By group', tally(rows, 'group'))
  printTable('By vertical', tally(rows, 'vertical'))
  console.log('\nTip: fill dms/calls/booked as they come in, then re-run. Kill dead rows, scale the winners.')
}

main()
