// Data access for the dashboard.
// ---------------------------------------------------------------------------
// All calls go to the shared Lucrator Platform (google/Platform.gs), scoped to
// THIS client by CLIENT_ID + CLIENT_TOKEN. When not configured (IS_LIVE false),
// every call works against an in-memory copy of MOCK_DATA so the UI is clickable.

import { APPS_SCRIPT_URL, CLIENT_ID, CLIENT_TOKEN, IS_LIVE, MOCK_DATA } from './config.js'

// Mutable mock store — seeded from MOCK_DATA, mutated by add/update offline.
let mock = {
  leads: MOCK_DATA.leads.map((r) => ({ ...r })),
  bookings: MOCK_DATA.bookings.map((r) => ({ ...r })),
  sales: MOCK_DATA.sales.map((r) => ({ ...r })),
}

const nextRow = (rows) => (rows.reduce((m, r) => Math.max(m, r.row || 1), 1) || 1) + 1
const mockId = (prefix) => `${prefix}-${new Date().toISOString().slice(2, 19).replace(/[-:T]/g, '')}`
const today = () => new Date().toISOString().slice(0, 10)

// Every request carries the client's token + id so the Platform routes to (and
// authorizes) only this client's sheet.
function withAuth(params) {
  return { token: CLIENT_TOKEN, clientId: CLIENT_ID, ...params }
}

async function get(params) {
  const url = new URL(APPS_SCRIPT_URL)
  Object.entries(withAuth(params)).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Request failed')
  return data
}

// POST as text/plain (skips the CORS preflight Apps Script can't answer). We also
// mirror fields onto the query string: Apps Script answers a POST with a 302 that
// fetch follows as a GET, which can drop the body — so the mirror keeps it safe.
async function post(body) {
  const payload = withAuth(body)
  const url = new URL(APPS_SCRIPT_URL)
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v)
  })
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Request failed')
  return data
}

export async function listData() {
  if (!IS_LIVE) {
    await delay()
    return { leads: clone(mock.leads), bookings: clone(mock.bookings), sales: clone(mock.sales) }
  }
  const data = await get({ action: 'list' })
  return { leads: data.leads || [], bookings: data.bookings || [], sales: data.sales || [] }
}

export async function addLead(input) {
  const payload = {
    action: 'addLead',
    name: input.name,
    contact: input.contact,
    interest: input.interest || '',
    notes: input.notes || '',
    source: input.source || 'Manual',
    status: input.status || 'New',
  }
  if (!IS_LIVE) {
    await delay()
    const rec = {
      row: nextRow(mock.leads),
      'Lead ID': mockId('L'),
      Name: payload.name,
      Contact: payload.contact,
      Source: payload.source,
      Interest: payload.interest,
      Notes: payload.notes,
      Date: today(),
      Status: payload.status,
      Owner: '',
    }
    mock.leads.push(rec)
    return rec
  }
  const data = await post(payload)
  return data.row
}

export async function updateLeadStatus(input) {
  const payload = { action: 'updateLead', id: input.id, status: input.status }
  if (!IS_LIVE) {
    await delay()
    const r = mock.leads.find((x) => x['Lead ID'] === input.id)
    if (r) r.Status = input.status
    return r
  }
  return (await post(payload)).row
}

export async function updateBookingStatus(input) {
  const payload = { action: 'updateBooking', id: input.id, status: input.status }
  if (!IS_LIVE) {
    await delay()
    const r = mock.bookings.find((x) => x['Booking ID'] === input.id)
    if (r) r.Status = input.status
    return r
  }
  return (await post(payload)).row
}

export async function deleteLead(input) {
  const payload = { action: 'deleteLead', id: input.id }
  if (!IS_LIVE) {
    await delay()
    mock.leads = mock.leads.filter((r) => r['Lead ID'] !== input.id)
    return { deleted: true }
  }
  return (await post(payload)).result || { deleted: true }
}

// Used by the public lead form. Never throws into the visitor's face.
export async function submitLead(values) {
  const contact = [values.email, values.phone].filter(Boolean).join(' · ')
  const notes = [values.business && `Business: ${values.business}`, values.industry && `Industry: ${values.industry}`, values.message]
    .filter(Boolean)
    .join(' — ')
  const payload = { action: 'addLead', name: values.name, contact, interest: values.help || '', notes, source: 'Lead form', status: 'New' }
  if (!IS_LIVE) {
    // eslint-disable-next-line no-console
    console.log('New lead (backend not configured):', { ...values })
    return { ok: true, offline: true }
  }
  await post(payload)
  return { ok: true }
}

function clone(rows) {
  return rows.map((r) => ({ ...r }))
}
function delay(ms = 280) {
  return new Promise((r) => setTimeout(r, ms))
}
