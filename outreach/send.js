import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env, parseArgs } from './config.js'
import { readCsv, appendCsv } from './lib/csv.js'
import { assignVariant, compose } from './lib/template.js'
import { sendEmail, verifyConnection } from './lib/mailer.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LEADS_PATH = path.join(__dirname, 'data', 'leads.csv')
const LOG_PATH = path.join(__dirname, 'data', 'sent-log.csv')

const LOG_COLUMNS = ['sentAt', 'email', 'business', 'city', 'industry', 'variant', 'subject', 'status', 'messageId', 'replied']

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const rand = (min, max) => Math.floor(min + Math.random() * (max - min))

async function main() {
  const args = parseArgs()
  const dryRun = Boolean(args['dry-run'])
  const limit = Number(args.limit || env.dailyCap)

  const leads = readCsv(LEADS_PATH)
  if (leads.length === 0) {
    console.error('✗ No leads in data/leads.csv. Run `npm run find` first.')
    process.exit(1)
  }

  // Skip anyone already emailed (resumable across days).
  const alreadySent = new Set(readCsv(LOG_PATH).map((r) => (r.email || '').toLowerCase()))
  const queue = leads.filter((l) => l.email && !alreadySent.has(l.email.toLowerCase()))

  console.log(
    `${leads.length} leads · ${alreadySent.size} already sent · sending up to ${limit} today` +
      (dryRun ? '  [DRY RUN — nothing will actually send]' : '')
  )

  if (!dryRun) {
    try {
      await verifyConnection()
      console.log(`✓ SMTP connection OK as ${env.gmailUser}\n`)
    } catch (e) {
      console.error(`✗ SMTP verify failed: ${e.message}`)
      process.exit(1)
    }
  }

  let sent = 0
  for (let i = 0; i < queue.length && sent < limit; i++) {
    const lead = queue[i]
    const variant = assignVariant(i)
    const { subject, text, html } = compose(lead, variant)

    if (dryRun) {
      console.log(`\n─── [${variant}] → ${lead.email} (${lead.business}, ${lead.city})`)
      console.log(`Subject: ${subject}`)
      console.log(text)
      sent++
      continue
    }

    let status = 'sent'
    let messageId = ''
    try {
      messageId = await sendEmail({ to: lead.email, subject, text, html })
      sent++
      console.log(`✓ [${variant}] ${lead.email} — ${lead.business}`)
    } catch (e) {
      status = 'error: ' + e.message
      console.error(`✗ ${lead.email} — ${e.message}`)
    }

    appendCsv(
      LOG_PATH,
      {
        sentAt: new Date().toISOString(),
        email: lead.email,
        business: lead.business,
        city: lead.city,
        industry: lead.industry,
        variant,
        subject,
        status,
        messageId,
        replied: '',
      },
      LOG_COLUMNS
    )

    if (sent < limit && i < queue.length - 1) {
      const wait = rand(env.minDelay, env.maxDelay)
      await sleep(wait * 1000)
    }
  }

  console.log(`\n${dryRun ? 'Would send' : 'Sent'} ${sent} email(s).`)
  if (!dryRun) console.log('Logged to data/sent-log.csv. Track results with `npm run stats`.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
