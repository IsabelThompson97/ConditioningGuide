/**
 * Conditioning Guide — Google Apps Script backend
 *
 * One Google Sheet, many tabs. Each entry type has its own tab. Headers are
 * auto-managed: when the front-end writes a record with a new field, the
 * corresponding column is appended on the fly — so adding a feature client-side
 * never requires touching this script or the sheet by hand.
 *
 * Endpoints
 * ─────────
 *   GET  → returns { ok, vitals, activity, ekg, bloodSugar, symptoms, stageDecisions, doctorNotes, config }
 *   POST → JSON body, action ∈ {save, delete, bulkSave, saveConfig, ping}
 *          POSTs use Content-Type: text/plain to skip the CORS preflight that
 *          Apps Script web apps cannot answer.
 */

/* ─── tab names ─────────────────────────────────────────────────────────── */
const TABS = {
  vitals:         'Vitals',
  activity:       'Activity',
  ekg:            'EKG',
  bloodSugar:     'BloodSugar',
  symptoms:       'Symptoms',
  stageDecisions: 'StageDecisions',
  doctorNotes:    'DoctorNotes'
};
const CONFIG_TAB = 'Config';

/* ─── seed headers ──────────────────────────────────────────────────────────
 * Initial column order for each tab. The doPost handler self-extends when the
 * front-end sends fields not yet present, so this list does NOT need updating
 * every time the app gains a field. It's just the starting layout for a fresh
 * sheet so it reads nicely. */
const SEED_HEADERS = {
  vitals: [
    'id', 'date', 'restingHR', 'weight',
    'dizzy', 'swelling', 'breathing', 'symptomNote',
    'tookMeds', 'createdAt', 'updatedAt'
  ],
  activity: [
    'id', 'date', 'category', 'subtypes',
    'totalMinutes', 'rounds', 'minutesPerRound', 'restBetweenMin',
    'borg', 'talkTestOK', 'recoveryHR', 'feeling',
    'dizzyDuring', 'swellingDuring', 'breathingDuring', 'symptomNoteDuring',
    'note', 'isProgrammed', 'createdAt', 'updatedAt'
  ],
  ekg: [
    'id', 'dateTime', 'rate', 'rhythm',
    'symptomatic', 'note', 'createdAt', 'updatedAt'
  ],
  bloodSugar: [
    'id', 'dateTime', 'value', 'context',
    'note', 'createdAt', 'updatedAt'
  ],
  symptoms: [
    'id', 'dateTime', 'dizzy', 'breathing', 'chest', 'palpitations',
    'swelling', 'nausea', 'note', 'ekgId', 'createdAt', 'updatedAt'
  ],
  stageDecisions: [
    'id', 'weekStartDate', 'stage', 'choice', 'criteriaTicked',
    'note', 'createdAt', 'updatedAt'
  ],
  doctorNotes: [
    'id', 'date', 'body', 'createdAt', 'updatedAt'
  ]
};

/* ─── sheet helpers ─────────────────────────────────────────────────────── */

/** Get (or create) a data tab and ensure it has at least its seed headers. */
function getSheet_(type) {
  const tabName = TABS[type];
  if (!tabName) throw new Error('Unknown type: ' + type);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(tabName);
  if (!sheet) sheet = ss.insertSheet(tabName);
  if (sheet.getLastRow() === 0) {
    const seed = SEED_HEADERS[type];
    sheet.getRange(1, 1, 1, seed.length).setValues([seed]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Get the config k/v tab, ensuring its header row. */
function getConfigSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG_TAB);
  if (!sheet) sheet = ss.insertSheet(CONFIG_TAB);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** Read current headers for a sheet. */
function getHeaders_(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0];
}

/**
 * Make sure every key in `record` has a column. Returns the (possibly extended)
 * header array. This is what lets the app gain new fields without ever
 * touching the script.
 */
function ensureHeadersFor_(sheet, record) {
  let headers = getHeaders_(sheet);
  const missing = Object.keys(record).filter(k => headers.indexOf(k) === -1);
  if (missing.length > 0) {
    const startCol = headers.length + 1;
    sheet.getRange(1, startCol, 1, missing.length).setValues([missing]);
    headers = headers.concat(missing);
  }
  return headers;
}

/** Cell-safe value. JSON-stringify nested structures so they fit in one cell. */
function flatten_(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

/** Inverse of flatten_: parse cells that look like JSON arrays/objects. */
function reviveCell_(v) {
  if (typeof v !== 'string') return v;
  if (v.length < 2) return v;
  const a = v.charAt(0), b = v.charAt(v.length - 1);
  if ((a === '[' && b === ']') || (a === '{' && b === '}')) {
    try { return JSON.parse(v); } catch (e) { return v; }
  }
  return v;
}

/** Upsert a single record into the right tab by `id`. */
function upsert_(type, record) {
  const sheet = getSheet_(type);
  const headers = ensureHeadersFor_(sheet, record);
  const idCol = headers.indexOf('id');
  if (idCol === -1) throw new Error('No id column for ' + type);

  // Scan existing rows for matching id.
  const values = sheet.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol] === record.id) { rowIdx = i + 1; break; }
  }
  const row = headers.map(h => flatten_(record[h]));
  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 1, 1, headers.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

/** Delete a row by id. No-op if not found. */
function deleteById_(type, id) {
  const sheet = getSheet_(type);
  const headers = getHeaders_(sheet);
  const idCol = headers.indexOf('id');
  if (idCol === -1) return;
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
}

/** Read every row from a tab as an array of objects. */
function readAll_(type) {
  const sheet = getSheet_(type);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  const idCol = headers.indexOf('id');
  return values.slice(1)
    .filter(r => idCol === -1 || r[idCol]) // drop blank rows
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = reviveCell_(row[i]); });
      return obj;
    });
}

/** Read the entire config tab into an object. Values are JSON-parsed when possible. */
function readConfig_() {
  const sheet = getConfigSheet_();
  const values = sheet.getDataRange().getValues();
  const cfg = {};
  for (let i = 1; i < values.length; i++) {
    const key = values[i][0];
    if (!key) continue;
    const raw = values[i][1];
    try { cfg[key] = JSON.parse(raw); }
    catch (e) { cfg[key] = raw; }
  }
  return cfg;
}

/** Upsert one config key. Always stringifies non-string values. */
function writeConfig_(key, value) {
  const sheet = getConfigSheet_();
  const values = sheet.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === key) { rowIdx = i + 1; break; }
  }
  const stored = typeof value === 'string' ? value : JSON.stringify(value);
  if (rowIdx > 0) {
    sheet.getRange(rowIdx, 2).setValue(stored);
  } else {
    sheet.appendRow([key, stored]);
  }
}

/* ─── HTTP handlers ─────────────────────────────────────────────────────── */

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** GET → snapshot of everything. */
function doGet(e) {
  try {
    return jsonOut_({
      ok: true,
      vitals:         readAll_('vitals'),
      activity:       readAll_('activity'),
      ekg:            readAll_('ekg'),
      bloodSugar:     readAll_('bloodSugar'),
      symptoms:       readAll_('symptoms'),
      stageDecisions: readAll_('stageDecisions'),
      doctorNotes:    readAll_('doctorNotes'),
      config:         readConfig_()
    });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

/**
 * POST → action-routed writes. Body MUST be JSON-stringified and sent with
 * Content-Type: text/plain (the front-end does this) so we skip CORS preflight.
 *
 * Supported actions:
 *   {action:'ping'}                                  - liveness check
 *   {action:'save',   type, record}                  - upsert one
 *   {action:'bulkSave', type, records:[...]}         - upsert many (same type)
 *   {action:'delete', type, id}                      - remove by id
 *   {action:'saveConfig', key, value}                - upsert one config key
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'ping') {
      return jsonOut_({ ok: true, pong: true });
    }
    if (data.action === 'saveConfig') {
      writeConfig_(data.key, data.value);
      return jsonOut_({ ok: true });
    }
    if (data.action === 'save') {
      upsert_(data.type, data.record);
      return jsonOut_({ ok: true, id: data.record.id });
    }
    if (data.action === 'bulkSave') {
      (data.records || []).forEach(r => upsert_(data.type, r));
      return jsonOut_({ ok: true, count: (data.records || []).length });
    }
    if (data.action === 'delete') {
      deleteById_(data.type, data.id);
      return jsonOut_({ ok: true });
    }
    return jsonOut_({ ok: false, error: 'Unknown action: ' + data.action });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}
