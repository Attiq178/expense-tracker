/**
 * Expense Tracker — Google Apps Script backend
 * ---------------------------------------------
 * Setup:
 * 1. Create a Google Sheet. In row 1 add headers:  Id | Date | Category | Amount | Note
 * 2. Extensions → Apps Script → delete everything, paste this file, Save.
 * 3. Deploy → New deployment → type "Web app"
 *      - Execute as:  Me
 *      - Who has access:  Anyone
 * 4. Copy the Web app URL and paste it into SCRIPT_URL inside expense-tracker.html
 */

const SHEET_NAME = 'Sheet1'; // change if your tab has a different name

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

// ---- READ: returns all expenses as JSON ----
function doGet() {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  const data = [];
  for (let i = 1; i < rows.length; i++) { // skip header row
    const [id, date, category, amount, note] = rows[i];
    if (id === '') continue;
    data.push({
      id: String(id),
      date: date instanceof Date ? Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(date),
      category: String(category),
      amount: Number(amount),
      note: String(note || '')
    });
  }
  return jsonResponse({ ok: true, expenses: data });
}

// ---- WRITE: add or delete an expense ----
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheet = getSheet();

    if (body.action === 'add') {
      const id = String(Date.now());
      sheet.appendRow([id, body.date, body.category, body.amount, body.note || '']);
      return jsonResponse({ ok: true, id: id });
    }

    if (body.action === 'update') {
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === String(body.id)) {
          sheet.getRange(i + 1, 2, 1, 4).setValues([[body.date, body.category, body.amount, body.note || '']]);
          return jsonResponse({ ok: true });
        }
      }
      return jsonResponse({ ok: false, error: 'Not found' });
    }

    if (body.action === 'delete') {
      const values = sheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]) === String(body.id)) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ ok: true });
        }
      }
      return jsonResponse({ ok: false, error: 'Not found' });
    }

    return jsonResponse({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
