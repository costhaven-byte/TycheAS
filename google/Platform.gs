/**
 * Lucrator — Client Platform (Google Apps Script Web App)
 * =======================================================
 * ONE script, deployed ONCE, that is the database + provisioning API for ALL
 * clients. Each client gets their own private Google Sheet (Leads / Bookings /
 * Sales tabs); this script creates those sheets on demand and routes every
 * read/write to the right one by `clientId`. You never redeploy per client.
 *
 * This is separate from google/Code.gs (which backs Lucrator's own internal
 * pipeline). This file is the multi-tenant product platform.
 *
 * ── ONE-TIME SETUP (see google/PLATFORM_SETUP.md) ──
 *   1. Create a new Apps Script project (script.google.com → New project),
 *      paste this file.
 *   2. Run `setup` once from the editor. It creates a master "Client Registry"
 *      spreadsheet and generates an ADMIN token. Copy the ADMIN token it logs.
 *   3. Deploy ▸ New deployment ▸ Web app (Execute as: Me, Access: Anyone) →
 *      copy the /exec URL. That URL + the ADMIN token go in the backend .env.
 *
 * ── ADD A CLIENT (no redeploy) ──
 *   POST { token:<ADMIN>, action:'provision', clientName:'Ahmed\'s restaurant' }
 *   → returns { clientId, spreadsheetId, url, token }. Hand the client their
 *     spreadsheet url; put clientId + token into their dashboard's config.
 *
 * ── AUTH ──
 *   ADMIN token: can do anything, for any client (used by the backend/chatbot).
 *   Per-client token: can only read/write its OWN clientId (used by that
 *     client's dashboard, where the token is visible in the browser).
 */

// Script Property keys (set by setup(); never hard-code secrets here).
var PROP_MASTER_ID = 'MASTER_SPREADSHEET_ID';
var PROP_ADMIN_TOKEN = 'ADMIN_TOKEN';

var REGISTRY_TAB = 'Clients';
var REGISTRY_HEADERS = ['Client ID', 'Name', 'Industry', 'Spreadsheet ID', 'Token', 'Created'];

// The tabs every client spreadsheet gets. Generic enough for any local business.
var CLIENT_TABS = {
  leads: {
    name: 'Leads',
    headers: ['Lead ID', 'Name', 'Contact', 'Source', 'Interest', 'Notes', 'Date', 'Status', 'Owner'],
  },
  bookings: {
    name: 'Bookings',
    headers: ['Booking ID', 'Name', 'Contact', 'Service', 'Date', 'Time', 'Status', 'Notes', 'Source', 'Created'],
  },
  sales: {
    name: 'Sales',
    headers: ['Sale ID', 'Name', 'Contact', 'Item', 'Amount', 'Date', 'Notes', 'Created'],
  },
};

// A key/value tab seeded into each client sheet. This is the chatbot's "brain":
// the client edits these cells to change how their bot talks, what it offers, and
// what it answers — no redeploy. The backend reads it via getConfig.
var CONFIG_TAB = { name: 'Config', headers: ['Key', 'Value'] };

function defaultConfig(name, industry) {
  var biz = name || 'the business';
  var ind = industry || 'local service';
  return [
    ['Business name', biz],
    ['About', biz + ' is a ' + ind + ' business. (Edit this to describe what you do.)'],
    ['Services', 'List your services here, comma-separated'],
    ['Booking types', 'Appointment'],
    ['Languages', 'en,ar'],
    ['Tone', 'Friendly, warm, and professional'],
    ['Booking confirmation', "Great — you're booked! We'll see you then."],
    ['FAQ', 'Q: Where are you located? A: (your address)\nQ: What are your hours? A: (your hours)'],
  ];
}

// ── One-time setup ──────────────────────────────────────────────────────────

/** Run ONCE from the editor. Creates the master registry + ADMIN token. */
function setup() {
  var props = PropertiesService.getScriptProperties();

  var masterId = props.getProperty(PROP_MASTER_ID);
  if (!masterId) {
    var ss = SpreadsheetApp.create('Lucrator — Client Registry');
    masterId = ss.getId();
    props.setProperty(PROP_MASTER_ID, masterId);
    var sheet = ss.getSheets()[0];
    sheet.setName(REGISTRY_TAB);
    sheet.getRange(1, 1, 1, REGISTRY_HEADERS.length).setValues([REGISTRY_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  var admin = props.getProperty(PROP_ADMIN_TOKEN);
  if (!admin) {
    admin = 'admin_' + randomToken();
    props.setProperty(PROP_ADMIN_TOKEN, admin);
  }

  var info =
    'Setup complete.\n' +
    'MASTER spreadsheet id: ' + masterId + '\n' +
    'ADMIN token (put in backend .env as CRM_API_TOKEN): ' + admin + '\n' +
    'Master sheet url: ' + SpreadsheetApp.openById(masterId).getUrl();
  Logger.log(info);
  return info;
}

// ── HTTP entrypoints ────────────────────────────────────────────────────────

function doGet(e) {
  return handle((e && e.parameter) || {});
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    body = {};
  }
  // Apps Script answers a POST with a 302 that fetch follows as a GET (dropping
  // the body), so callers also mirror fields onto the query string. Merge them.
  var params = (e && e.parameter) || {};
  for (var k in params) {
    if (body[k] === undefined || body[k] === '') body[k] = params[k];
  }
  return handle(body);
}

function handle(p) {
  try {
    var auth = authorize(p);
    if (!auth.ok) return json({ ok: false, error: auth.error });

    switch (p.action) {
      case 'provision':
        return json({ ok: true, client: provision(p) });
      case 'listClients':
        return json({ ok: true, clients: listClients() });
      case 'list':
        return json({ ok: true, leads: readTab(p.clientId, 'leads'), bookings: readTab(p.clientId, 'bookings'), sales: readTab(p.clientId, 'sales') });
      case 'getConfig':
        return json({ ok: true, config: getConfig(p.clientId) });
      case 'addLead':
        return json({ ok: true, row: addLead(p) });
      case 'addBooking':
        return json({ ok: true, row: addBooking(p) });
      case 'recordSale':
        return json({ ok: true, row: recordSale(p) });
      case 'updateLead':
        return json({ ok: true, row: updateLead(p) });
      case 'updateBooking':
        return json({ ok: true, row: updateBooking(p) });
      case 'deleteLead':
        return json({ ok: true, result: deleteLead(p) });
      default:
        return json({ ok: false, error: 'Unknown action: ' + p.action });
    }
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/**
 * Authorize a request. ADMIN token → anything. Otherwise the token must match
 * the per-client token for p.clientId. `provision`/`listClients` are admin-only.
 */
function authorize(p) {
  var props = PropertiesService.getScriptProperties();
  var admin = props.getProperty(PROP_ADMIN_TOKEN);
  var token = String(p.token || '');
  if (admin && token === admin) return { ok: true, admin: true };

  if (p.action === 'provision' || p.action === 'listClients') {
    return { ok: false, error: 'Admin token required.' };
  }
  if (!p.clientId) return { ok: false, error: 'Missing clientId.' };

  var rec = findClient(p.clientId);
  if (!rec) return { ok: false, error: 'Unknown clientId.' };
  if (token && token === String(rec.token)) return { ok: true, admin: false };
  return { ok: false, error: 'Unauthorized.' };
}

// ── Provisioning ────────────────────────────────────────────────────────────

/** Create a new client spreadsheet + register it. Returns the client record. */
function provision(p) {
  var name = (p.clientName || p.name || '').toString().trim();
  if (!name) throw new Error('clientName is required.');

  var clientId = generateId('C');
  var token = 'cli_' + randomToken();

  var ss = SpreadsheetApp.create('Lucrator — ' + name);
  Object.keys(CLIENT_TABS).forEach(function (key, i) {
    var def = CLIENT_TABS[key];
    var sheet = i === 0 ? ss.getSheets()[0] : ss.insertSheet();
    sheet.setName(def.name);
    sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  });

  // Seed the Config tab (the chatbot's editable brain).
  var cfg = ss.insertSheet();
  cfg.setName(CONFIG_TAB.name);
  cfg.getRange(1, 1, 1, 2).setValues([CONFIG_TAB.headers]).setFontWeight('bold');
  cfg.setFrozenRows(1);
  var rows = defaultConfig(name, p.industry);
  cfg.getRange(2, 1, rows.length, 2).setValues(rows);

  var registry = registrySheet();
  registry.appendRow([clientId, name, p.industry || '', ss.getId(), token, new Date()]);

  return { clientId: clientId, name: name, spreadsheetId: ss.getId(), url: ss.getUrl(), token: token };
}

function listClients() {
  var values = registrySheet().getDataRange().getValues();
  var out = [];
  for (var r = 1; r < values.length; r++) {
    if (values[r].join('') === '') continue;
    out.push({ clientId: values[r][0], name: values[r][1], industry: values[r][2], spreadsheetId: values[r][3] });
  }
  return out; // note: tokens intentionally omitted
}

// ── Per-client data actions ─────────────────────────────────────────────────

function readTab(clientId, key) {
  var sheet = clientSheet(clientId, key);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var out = [];
  for (var r = 1; r < values.length; r++) {
    if (values[r].join('') === '') continue;
    var obj = { row: r + 1 };
    for (var c = 0; c < headers.length; c++) obj[headers[c]] = formatCell(values[r][c]);
    out.push(obj);
  }
  return out;
}

function addLead(p) {
  var row = [
    generateId('L'),
    p.name || '',
    p.contact || '',
    p.source || 'Chatbot',
    p.interest || '',
    p.notes || '',
    p.date || isoDate(new Date()),
    p.status || 'New',
    p.owner || '',
  ];
  clientSheet(p.clientId, 'leads').appendRow(row);
  return zip(CLIENT_TABS.leads.headers, row);
}

function addBooking(p) {
  var row = [
    generateId('B'),
    p.name || '',
    p.contact || '',
    p.service || 'Appointment',
    p.date || '',
    p.time || '',
    p.status || 'Booked',
    p.notes || '',
    p.source || 'Chatbot',
    new Date(),
  ];
  clientSheet(p.clientId, 'bookings').appendRow(row);
  return zip(CLIENT_TABS.bookings.headers, row);
}

function recordSale(p) {
  var row = [
    generateId('S'),
    p.name || '',
    p.contact || '',
    p.item || p.package || '',
    p.amount || '',
    p.date || isoDate(new Date()),
    p.notes || '',
    new Date(),
  ];
  clientSheet(p.clientId, 'sales').appendRow(row);
  return zip(CLIENT_TABS.sales.headers, row);
}

/** Update a Lead row in place by Lead ID: Status and/or Owner. */
function updateLead(p) {
  var sheet = clientSheet(p.clientId, 'leads');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('Lead ID');
  var statusCol = headers.indexOf('Status');
  var ownerCol = headers.indexOf('Owner');
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(p.id)) {
      if (p.status) sheet.getRange(r + 1, statusCol + 1).setValue(p.status);
      if (ownerCol !== -1 && p.owner !== undefined) sheet.getRange(r + 1, ownerCol + 1).setValue(p.owner || '');
      return { row: r + 1, status: p.status, owner: p.owner || '' };
    }
  }
  throw new Error('Lead not found: ' + p.id);
}

function deleteLead(p) {
  var sheet = clientSheet(p.clientId, 'leads');
  var data = sheet.getDataRange().getValues();
  var idCol = data[0].indexOf('Lead ID');
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(p.id)) {
      sheet.deleteRow(r + 1);
      return { deleted: true, id: p.id };
    }
  }
  throw new Error('Lead not found: ' + p.id);
}

/** Update a Booking's Status in place by Booking ID (e.g. mark Done/Cancelled). */
function updateBooking(p) {
  var sheet = clientSheet(p.clientId, 'bookings');
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('Booking ID');
  var statusCol = headers.indexOf('Status');
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(p.id)) {
      if (p.status) sheet.getRange(r + 1, statusCol + 1).setValue(p.status);
      return { row: r + 1, status: p.status };
    }
  }
  throw new Error('Booking not found: ' + p.id);
}

/** Read the client's Config tab into a { key: value } object (the bot's brain). */
function getConfig(clientId) {
  if (!clientId) throw new Error('Missing clientId.');
  var rec = findClient(clientId);
  if (!rec) throw new Error('Unknown clientId: ' + clientId);
  var ss = SpreadsheetApp.openById(rec.spreadsheetId);
  var sheet = ss.getSheetByName(CONFIG_TAB.name);
  var out = { 'Business name': rec.name };
  if (!sheet) return out; // not seeded (older sheet) — fall back to the name
  var values = sheet.getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    var key = String(values[r][0] || '').trim();
    if (key) out[key] = formatCell(values[r][1]);
  }
  return out;
}

// ── Registry + sheet helpers ────────────────────────────────────────────────

function registrySheet() {
  var id = PropertiesService.getScriptProperties().getProperty(PROP_MASTER_ID);
  if (!id) throw new Error('Platform not set up. Run setup() once from the editor.');
  return SpreadsheetApp.openById(id).getSheetByName(REGISTRY_TAB);
}

function findClient(clientId) {
  var values = registrySheet().getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][0]) === String(clientId)) {
      return { clientId: values[r][0], name: values[r][1], industry: values[r][2], spreadsheetId: values[r][3], token: values[r][4] };
    }
  }
  return null;
}

function clientSheet(clientId, key) {
  if (!clientId) throw new Error('Missing clientId.');
  var rec = findClient(clientId);
  if (!rec) throw new Error('Unknown clientId: ' + clientId);
  var def = CLIENT_TABS[key];
  var ss = SpreadsheetApp.openById(rec.spreadsheetId);
  var sheet = ss.getSheetByName(def.name);
  if (!sheet) {
    // Self-heal: a tab was deleted — recreate it with headers.
    sheet = ss.insertSheet(def.name);
    sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ── Small utilities ─────────────────────────────────────────────────────────

function generateId(prefix) {
  return prefix + '-' + Utilities.formatDate(new Date(), 'GMT', 'yyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 1000);
}

function randomToken() {
  return Utilities.getUuid().replace(/-/g, '');
}

function isoDate(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function formatCell(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return v === null || v === undefined ? '' : v;
}

function zip(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) obj[headers[i]] = row[i] instanceof Date ? isoDate(row[i]) : row[i];
  return obj;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
