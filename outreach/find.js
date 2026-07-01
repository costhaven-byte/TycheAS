import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DEFAULT_CITIES, INDUSTRIES, env, parseArgs } from './config.js'
import { searchPlaces, getPlaceDetails } from './lib/places.js'
import { scrapeSite } from './lib/scrapeEmail.js'
import { writeHook } from './lib/personalize.js'
import { writeCsv } from './lib/csv.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LEADS_PATH = path.join(__dirname, 'data', 'leads.csv')

const COLUMNS = [
  'business',
  'city',
  'industry',
  'industryLabel',
  'email',
  'hook',
  'website',
  'phone',
  'rating',
  'reviews',
  'address',
  'evidence',
]

async function main() {
  const args = parseArgs()
  const cities = args.cities ? String(args.cities).split(',').map((s) => s.trim()) : DEFAULT_CITIES
  const industries = args.industries
    ? String(args.industries)
        .split(',')
        .map((s) => s.trim())
        .map((k) => INDUSTRIES.find((i) => i.keyword === k) || { keyword: k, label: k })
    : INDUSTRIES
  const max = Number(args.max || 50) // cap on how many emails we collect
  const perQuery = Number(args['per-query'] || 20)

  if (!env.placesKey) {
    console.error('✗ GOOGLE_PLACES_API_KEY missing. Copy .env.example to .env and fill it in.')
    process.exit(1)
  }

  console.log(`Searching ${industries.length} industries × ${cities.length} cities (target ${max} emails)...\n`)

  const seenEmail = new Set()
  const seenPlace = new Set()
  const leads = []

  outer: for (const city of cities) {
    for (const ind of industries) {
      if (leads.length >= max) break outer
      const query = `${ind.keyword} in ${city}, TX`
      let places = []
      try {
        places = await searchPlaces(query, { maxResults: perQuery })
      } catch (e) {
        console.error(`  ! ${query}: ${e.message}`)
        continue
      }
      process.stdout.write(`${query}: ${places.length} places`)
      let added = 0
      for (const p of places) {
        if (leads.length >= max) break
        if (!p.website || seenPlace.has(p.placeId)) continue
        seenPlace.add(p.placeId)
        const { email, signals } = await scrapeSite(p.website)
        if (!email || seenEmail.has(email)) continue
        seenEmail.add(email)

        const lead = {
          business: p.business,
          city,
          industry: ind.keyword,
          industryLabel: ind.label,
          email,
          website: p.website,
          phone: p.phone,
          rating: p.rating,
          reviews: p.reviews,
          address: p.address,
        }

        // Grounded personalization: pull richer detail, then write one real line.
        const details = await getPlaceDetails(p.placeId)
        lead.hook = await writeHook(lead, details, signals)
        // Store everything the model saw, so each hook is verifiable before sending.
        lead.evidence = [
          details?.summary ? `summary: ${details.summary}` : '',
          ...(details?.reviews || []).map((r, i) => `review${i + 1}: ${r.text.replace(/\s+/g, ' ').slice(0, 120)}`),
          signals ? `site: ${signals.slice(0, 120)}` : '',
        ]
          .filter(Boolean)
          .join(' | ')

        leads.push(lead)
        added++
      }
      const withHook = leads.filter((l) => l.hook).length
      console.log(` → +${added} emails (total ${leads.length}, ${withHook} personalized)`)
    }
  }

  writeCsv(LEADS_PATH, leads, COLUMNS)
  console.log(`\n✓ ${leads.length} leads with emails written to data/leads.csv`)
  console.log('  Review/prune that file, then run:  npm run send -- --dry-run')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
