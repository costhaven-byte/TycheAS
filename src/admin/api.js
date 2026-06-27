// Data access for the admin dashboard.
// ---------------------------------------------------------------------------
// All calls go to the Apps Script Web App (the Google Sheet is the database).
// When the backend isn't configured yet (IS_LIVE === false), every call works
// against an in-memory copy of MOCK_DATA so the whole UI is clickable offline.

import { APPS_SCRIPT_URL, API_TOKEN, IS_LIVE, MOCK_DATA } from './config.js'

// Mutable mock store — seeded from MOCK_DATA, mutated by add/move in offline mode.
let mock = {
  potential: MOCK_DATA.potential.map((r) => ({ ...r })),
  closed: MOCK_DATA.closed.map((r) => ({ ...r })),
}

const nextRow = (rows) => (rows.reduce((m, r) => Math.max(m, r.row || 1), 1) || 1) + 1
const mockId = (prefix) => `${prefix}-${new Date().toISOString().slice(2, 19).replace(/[-:T]/g, '')}`

// GET with query params (used for `list`). Apps Script handles CORS for GET.
async function get(params) {
  const url = new URL(APPS_SCRIPT_URL)
  url.searchParams.set('token', API_TOKEN)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  const data = await res.json()
  if (!data.ok) throw new Error(data.error || 'Request failed')
  return data
}

// POST as text/plain so the browser skips the CORS preflight (Apps Script can't
// answer OPTIONS). The body is still JSON; doPost parses postData.contents.
// We ALSO mirror every field onto the query string: Apps Script answers a POST
// with a 302 that fetch follows as a GET, which can drop the request body — so
// the body alone is unreliable. doPost merges e.parameter as a fallback, which
// means the token + payload survive the redirect. (Values are short strings.)
async function post(body) {
  const payload = { token: API_TOKEN, ...body }
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

export async function listDeals() {
  if (!IS_LIVE) {
    await delay()
    return { potential: clone(mock.potential), closed: clone(mock.closed) }
  }
  const data = await get({ action: 'list' })
  return { potential: data.potential || [], closed: data.closed || [] }
}

export async function addProspect(input) {
  const payload = {
    action: 'addProspect',
    clientName: input.clientName,
    industry: input.industry,
    interestPackage: input.interestPackage,
    need: input.need,
    dueDate: input.dueDate,
    status: input.status || 'Open',
  }
  if (!IS_LIVE) {
    await delay()
    const rec = {
      row: nextRow(mock.potential),
      'Client Name': payload.clientName,
      'Client ID': mockId('P'),
      Industry: payload.industry,
      'Interest in Package': payload.interestPackage,
      'Need (prototype)': payload.need,
      'Receive/Due Date': payload.dueDate,
      Status: payload.status,
      'Assigned To': '',
    }
    mock.potential.push(rec)
    return rec
  }
  const data = await post(payload)
  return data.row
}

// Update a prospect's status (and optionally its owner) in place. Powers the
// "Cancel" and "Set in progress by…" actions on the Potential tab.
export async function updateDeal(input) {
  const payload = {
    action: 'updateDeal',
    clientId: input.clientId,
    status: input.status,
    assignedTo: input.assignedTo ?? '',
  }
  if (!IS_LIVE) {
    await delay()
    const p = mock.potential.find((r) => r['Client ID'] === input.clientId)
    if (p) {
      p.Status = payload.status
      p['Assigned To'] = payload.assignedTo
    }
    return p
  }
  const data = await post(payload)
  return data.row
}

export async function moveToClosed(input) {
  const payload = {
    action: 'moveToClosed',
    clientId: input.clientId,
    clientName: input.clientName,
    industry: input.industry,
    packageBought: input.packageBought,
    duration: input.duration,
    closer: input.closer,
    activationDate: input.activationDate,
    endDate: input.endDate,
  }
  if (!IS_LIVE) {
    await delay()
    // Remove from Potential — a closed deal no longer belongs on the page.
    mock.potential = mock.potential.filter((r) => r['Client ID'] !== input.clientId)
    const rec = {
      row: nextRow(mock.closed),
      'Client Name': payload.clientName,
      'Client ID': payload.clientId,
      Industry: payload.industry,
      'Package Bought': payload.packageBought,
      Duration: payload.duration,
      Closer: payload.closer,
      'Activation Date': payload.activationDate,
      'End Date': payload.endDate,
    }
    mock.closed.push(rec)
    return rec
  }
  const data = await post(payload)
  return data.row
}

// Permanently delete a prospect from the database by Client ID. Used to clear
// out canceled deals the team no longer wants to keep.
export async function deleteDeal(input) {
  const payload = { action: 'deleteDeal', clientId: input.clientId }
  if (!IS_LIVE) {
    await delay()
    mock.potential = mock.potential.filter((r) => r['Client ID'] !== input.clientId)
    return { deleted: true }
  }
  const data = await post(payload)
  return data.result || { deleted: true }
}

// Used by the public brief form. Never throws into the user's face — the form
// owns its own success UI; we just try to land the lead and log on failure.
export async function submitLead(values) {
  const payload = {
    action: 'addLead',
    clientName: values.name,
    industry: values.industry,
    interestPackage: values.help,
    need: values.message,
    status: 'Open',
  }
  if (!IS_LIVE) {
    // eslint-disable-next-line no-console
    console.log('Lucrator — new lead (backend not configured):', { ...values })
    return { ok: true, offline: true }
  }
  await post(payload)
  return { ok: true }
}

function clone(rows) {
  return rows.map((r) => ({ ...r }))
}
function delay(ms = 320) {
  return new Promise((r) => setTimeout(r, ms))
}
