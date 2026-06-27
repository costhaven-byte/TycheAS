/**
 * Lead saving system — backend (Google Apps Script Web App)
 * --------------------------------------------------------------
 * This script turns the bound Google Sheet into the live database for the
 * dashboard. The dashboard and the public lead form read/write through this Web
 * App, so nobody ever has to open the Sheet by hand.
 *
 * SETUP (one time): see google/SETUP.md in the repo.
 *   1. Open the Sheet → Extensions ▸ Apps Script. Paste this file.
 *   2. Edit API_TOKEN below to a long random string (must match src/admin/config.js).
 *   3. Run `setup` once (creates both tabs + headers).
 *   4. Deploy ▸ New deployment ▸ Web app:
 *        Execute as: Me   |   Who has access: Anyone
 *      Copy the /exec URL into src/admin/config.js (APPS_SCRIPT_URL).
 *
 * Re-deploy (Manage deployments ▸ edit ▸ Version: New) after editing this file.
 *
 * NOTE: the headers in SHEETS below MUST match COLS in src/admin/config.js. If
 * you change a column, change it in both places, then re-run setup() and redeploy.
 */

// Must match API_TOKEN in src/admin/config.js.
var API_TOKEN = 'CHANGE_ME_to_a_long_random_string';

var SHEETS = {
  potential: {
    name: 'Potential deals',
    headers: [
      'Client Name',
      'Client ID',
      'Industry',
      'Interest in Package',
      'Need (prototype)',
      'Receive/Due Date',
      'Status',
      'Assigned To',
    ],
  },
  closed: {
    name: 'Closed deals',
    headers: [
      'Client Name',
      'Client ID',
      'Industry',
      'Package Bought',
      'Duration',
      'Closer',
      'Activation Date',
      'End Date',
    ],
  },
};

/** Run once from the editor to create/repair both tabs and their header rows. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(function (key) {
    var def = SHEETS[key];
    var sheet = ss.getSheetByName(def.name) || ss.insertSheet(def.name);
    sheet
      .getRange(1, 1, 1, def.headers.length)
      .setValues([def.headers])
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  });
  // Drop the default "Sheet1" if it's empty and unused.
  var first = ss.getSheetByName('Sheet1');
  if (first && first.getLastRow() === 0 && ss.getSheets().length > 1) {
    ss.deleteSheet(first);
  }
  return 'Setup complete: "' + SHEETS.potential.name + '" + "' + SHEETS.closed.name + '" ready.';
}

// ---- HTTP entrypoints -------------------------------------------------------

function doGet(e) {
  return handle(e, (e && e.parameter) || {});
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    body = {};
  }
  // Apps Script answers a POST with a 302 that fetch follows as a GET, which can
  // drop the request body — so the client also mirrors every field onto the
  // query string. Fill in anything missing from e.parameter (body wins when set).
  var params = (e && e.parameter) || {};
  for (var k in params) {
    if (body[k] === undefined || body[k] === '') body[k] = params[k];
  }
  return handle(e, body);
}

function handle(e, params) {
  try {
    if (String(params.token || '') !== String(API_TOKEN)) {
      return json({ ok: false, error: 'Unauthorized' });
    }
    switch (params.action) {
      case 'list':
        return json({ ok: true, potential: readTab('potential'), closed: readTab('closed') });
      case 'addProspect':
      case 'addLead':
        return json({ ok: true, row: addProspect(params) });
      case 'moveToClosed':
        return json({ ok: true, row: moveToClosed(params) });
      case 'updateDeal':
        return json({ ok: true, row: updateDeal(params) });
      case 'deleteDeal':
        return json({ ok: true, result: deleteDeal(params) });
      default:
        return json({ ok: false, error: 'Unknown action: ' + params.action });
    }
  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

// ---- Actions ----------------------------------------------------------------

/** Read a tab into an array of objects keyed by header. Includes a 1-based `row`. */
function readTab(key) {
  var sheet = sheetFor(key);
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var out = [];
  for (var r = 1; r < values.length; r++) {
    var rowVals = values[r];
    if (rowVals.join('') === '') continue; // skip blank rows
    var obj = { row: r + 1 };
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = formatCell(rowVals[c]);
    }
    out.push(obj);
  }
  return out;
}

/** Append a prospect to "Potential deals". Auto-generates a Client ID if missing. */
function addProspect(p) {
  var sheet = sheetFor('potential');
  var id = p.clientId || generateId('P');
  var row = [
    p.clientName || '',
    id,
    p.industry || '',
    p.interestPackage || p.help || '',
    p.need || p.message || '',
    p.dueDate || '',
    p.status || 'Open',
    p.assignedTo || '',
  ];
  sheet.appendRow(row);
  return zip(SHEETS.potential.headers, row);
}

/**
 * Update a prospect in place by Client ID: sets its Status and (optionally) the
 * "Assigned To" owner. Used to cancel a deal or mark it In Progress by someone.
 */
function updateDeal(p) {
  var pot = sheetFor('potential');
  var data = pot.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('Client ID');
  var statusCol = headers.indexOf('Status');
  var assigneeCol = headers.indexOf('Assigned To');
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(p.clientId)) {
      if (p.status) pot.getRange(r + 1, statusCol + 1).setValue(p.status);
      if (assigneeCol !== -1 && p.assignedTo !== undefined) {
        pot.getRange(r + 1, assigneeCol + 1).setValue(p.assignedTo || '');
      }
      return { row: r + 1, status: p.status, assignedTo: p.assignedTo || '' };
    }
  }
  throw new Error('Deal not found: ' + p.clientId);
}

/**
 * Move a prospect to "Closed deals": append a closed-deal row with the
 * package/duration/closer/dates provided, then REMOVE the prospect from
 * "Potential deals" so it no longer shows on the Prospects page. The full
 * record lives on in the Closed tab, so nothing is lost.
 */
function moveToClosed(p) {
  var closed = sheetFor('closed');
  var row = [
    p.clientName || '',
    p.clientId || generateId('C'),
    p.industry || '',
    p.packageBought || '',
    p.duration || '',
    p.closer || '',
    p.activationDate || '',
    p.endDate || '',
  ];
  closed.appendRow(row);
  // Drop it from Potential now that it's closed.
  if (p.clientId) removeProspectRow(p.clientId);
  return zip(SHEETS.closed.headers, row);
}

/**
 * Permanently delete a prospect row from "Potential deals" by Client ID.
 * Used to clear out canceled deals the team no longer wants in the database.
 */
function deleteDeal(p) {
  if (!p.clientId) throw new Error('Missing clientId');
  if (!removeProspectRow(p.clientId)) {
    throw new Error('Deal not found: ' + p.clientId);
  }
  return { deleted: true, clientId: p.clientId };
}

/** Find a prospect by Client ID and delete its row. Returns true if removed. */
function removeProspectRow(clientId) {
  var pot = sheetFor('potential');
  var data = pot.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('Client ID');
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idCol]) === String(clientId)) {
      pot.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}

// ---- Helpers ----------------------------------------------------------------

function sheetFor(key) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEETS[key].name);
  if (!sheet) {
    setup();
    sheet = ss.getSheetByName(SHEETS[key].name);
  }
  return sheet;
}

function generateId(prefix) {
  var now = new Date();
  var stamp = Utilities.formatDate(now, 'GMT', 'yyMMdd-HHmmss');
  return prefix + '-' + stamp;
}

function formatCell(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return v === null || v === undefined ? '' : v;
}

function zip(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) obj[headers[i]] = row[i];
  return obj;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
