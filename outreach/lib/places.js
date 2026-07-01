import { env } from '../config.js'

const ENDPOINT = 'https://places.googleapis.com/v1/places:searchText'
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.rating',
  'places.userRatingCount',
  'nextPageToken',
].join(',')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Text Search (New) returns up to 20 results per page; paginate via nextPageToken.
export async function searchPlaces(textQuery, { maxResults = 20 } = {}) {
  if (!env.placesKey) throw new Error('GOOGLE_PLACES_API_KEY is not set in .env')
  const results = []
  let pageToken
  while (results.length < maxResults) {
    const body = { textQuery, regionCode: 'US', maxResultCount: 20 }
    if (pageToken) body.pageToken = pageToken
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.placesKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`Places API ${res.status}: ${detail.slice(0, 300)}`)
    }
    const data = await res.json()
    for (const p of data.places || []) {
      results.push({
        placeId: p.id,
        business: p.displayName?.text || '',
        address: p.formattedAddress || '',
        website: p.websiteUri || '',
        phone: p.nationalPhoneNumber || '',
        rating: p.rating || '',
        reviews: p.userRatingCount || '',
      })
    }
    if (!data.nextPageToken || (data.places || []).length === 0) break
    pageToken = data.nextPageToken
    await sleep(1500) // token needs a moment to become valid
  }
  return results.slice(0, maxResults)
}

const DETAILS_FIELD_MASK = [
  'editorialSummary',
  'primaryTypeDisplayName',
  'businessStatus',
  'reviews',
].join(',')

// Extra, richer signals for personalization — fetched only for leads we keep,
// since review/summary fields are billed at a higher tier.
export async function getPlaceDetails(placeId) {
  if (!placeId) return null
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': env.placesKey,
        'X-Goog-FieldMask': DETAILS_FIELD_MASK,
      },
    })
    if (!res.ok) return null
    const p = await res.json()
    const reviews = (p.reviews || [])
      .map((r) => ({
        text: r.text?.text || r.originalText?.text || '',
        when: r.relativePublishTimeDescription || '',
        rating: r.rating || '',
      }))
      .filter((r) => r.text)
      .slice(0, 3)
    return {
      summary: p.editorialSummary?.text || '',
      type: p.primaryTypeDisplayName?.text || '',
      status: p.businessStatus || '',
      reviews,
    }
  } catch {
    return null
  }
}
