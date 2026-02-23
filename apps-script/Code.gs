/**
 * Apartment Hunter — Google Apps Script
 *
 * Deploy this as a Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * The resulting /exec URL goes into the extension's settings.
 */

const HEADERS = [
  'Date Added',
  'Address',
  'Neighborhood',
  'Price ($/mo)',
  'Sq Ft',
  'Available From',
  'Transit Commute',
  'Walking Commute',
  'W/D in Unit',
  'Elevator',
  'Doorman',
  'Dishwasher',
  'Link',
  'Notes',
];

const AVAIL_COL = HEADERS.indexOf('Available From') + 1; // 1-indexed for Sheets API

// Run this once manually from the Apps Script editor (▶ Run) whenever
// HEADERS changes. It overwrites row 1 with the current header list.
function updateHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

// Quick sanity-check: open the /exec URL in a browser tab.
// If the deployment is working you'll see {"ok":true}.
function doGet() {
  return jsonResponse({ ok: true, message: 'Apartment Hunter script is reachable.' });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    appendRow(data);

    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function appendRow(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();

  // Add header row on first use
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  const yesNo = (val) => (val ? 'Yes' : 'No');

  // Append the row with a placeholder for Available From;
  // we'll set the cell separately so we can use a formula if needed.
  sheet.appendRow([
    new Date().toLocaleDateString('en-US'),
    data.address        || '',
    data.neighborhood   || '',
    data.price          || '',
    data.squareFootage  || '',
    '',                          // Available From — set below
    data.transitCommute || '',
    data.walkingCommute || '',
    yesNo(data.hasWasherDryer),
    yesNo(data.hasElevator),
    yesNo(data.hasDoorman),
    yesNo(data.hasDishwasher),
    data.url   || '',
    data.notes || '',
  ]);

  // Set Available From: formula if "now", plain date string otherwise
  const availCell = sheet.getRange(sheet.getLastRow(), AVAIL_COL);
  if (data.availableNow) {
    availCell.setFormula('=TODAY()');
  } else if (data.availableDate) {
    availCell.setValue(data.availableDate);
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
