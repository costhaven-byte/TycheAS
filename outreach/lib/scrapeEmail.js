import * as cheerio from 'cheerio'

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

// Junk we never want to email.
const BLOCKLIST = [
  'example.com',
  'sentry',
  'wixpress.com',
  'wix.com',
  'squarespace.com',
  'godaddy.com',
  'domain',
  'yourdomain',
  'email.com',
  'sentry.io',
  '@2x',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  'core.js',
]

const CONTACT_PATHS = ['', 'contact', 'contact-us', 'contactus', 'about', 'about-us']

function cleanEmails(text) {
  const found = new Set()
  for (const raw of text.match(EMAIL_RE) || []) {
    const email = raw.toLowerCase().replace(/\.$/, '')
    const lower = email.toLowerCase()
    if (BLOCKLIST.some((b) => lower.includes(b))) continue
    if (email.length > 60) continue
    found.add(email)
  }
  return [...found]
}

async function fetchText(url, timeoutMs = 10000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      },
    })
    if (!res.ok) return ''
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('text/html')) return ''
    return await res.text()
  } catch {
    return ''
  } finally {
    clearTimeout(t)
  }
}

function extractFromHtml(html) {
  const $ = cheerio.load(html)
  const emails = new Set()
  // mailto links are the most reliable signal.
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const addr = href.replace(/^mailto:/i, '').split('?')[0].trim()
    for (const e of cleanEmails(addr)) emails.add(e)
  })
  for (const e of cleanEmails($('body').text())) emails.add(e)
  return [...emails]
}

// Prefer an address on the site's own domain over gmail/yahoo, etc.
function pickBest(emails, siteHost) {
  if (emails.length === 0) return ''
  const host = (siteHost || '').replace(/^www\./, '')
  const onDomain = emails.find((e) => host && e.endsWith('@' + host))
  if (onDomain) return onDomain
  const preferred = emails.find((e) => /^(info|hello|contact|hi|sales|bookings?|office)@/.test(e))
  return preferred || emails[0]
}

// Words that hint at something worth commenting on in a cold email.
const SIGNAL_WORDS = [
  'hiring',
  'join our team',
  'now open',
  'grand opening',
  'now hiring',
  'introducing',
  'new location',
  'newly',
  'just launched',
  'launch',
  'award',
  'winner',
  'voted',
  'best of',
  'anniversary',
  'celebrating',
  'years',
  'welcome',
  'new menu',
  'expanded',
  'coming soon',
]

function extractSignals(html) {
  const $ = cheerio.load(html)
  const bits = []
  const push = (t) => {
    const s = (t || '').replace(/\s+/g, ' ').trim()
    if (s && s.length > 3 && s.length < 220) bits.push(s)
  }
  push($('title').first().text())
  push($('meta[name="description"]').attr('content'))
  push($('meta[property="og:description"]').attr('content'))
  $('h1, h2, h3').slice(0, 12).each((_, el) => push($(el).text()))
  // Any paragraph/list item mentioning a signal word.
  $('p, li, span').each((_, el) => {
    const t = $(el).text()
    const lower = t.toLowerCase()
    if (SIGNAL_WORDS.some((w) => lower.includes(w))) push(t)
  })
  // Dedupe, keep it compact.
  const seen = new Set()
  const out = []
  for (const b of bits) {
    const key = b.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(b)
    if (out.join(' ').length > 900) break
  }
  return out.join(' | ')
}

// Fetch the site once, returning both a contact email and text signals for
// personalization — so we don't hit the website twice.
export async function scrapeSite(website) {
  if (!website) return { email: '', signals: '' }
  let base
  try {
    base = new URL(website)
  } catch {
    return { email: '', signals: '' }
  }
  const emails = new Set()
  let signals = ''
  for (const path of CONTACT_PATHS) {
    const url = new URL(path, base.origin + '/').href
    const html = await fetchText(url)
    if (!html) continue
    for (const e of extractFromHtml(html)) emails.add(e)
    if (path === '') signals = extractSignals(html) // homepage is the best signal source
  }
  return { email: pickBest([...emails], base.host), signals }
}

export async function findEmail(website) {
  return (await scrapeSite(website)).email
}
