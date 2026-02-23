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
  'Transit Commute',
  'Walking Commute',
  'W/D in Unit',
  'Elevator',
  'Doorman',
  'Dishwasher',
  'Link',
  'Notes',
];

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

  sheet.appendRow([
    new Date().toLocaleDateString('en-US'),
    data.address       || '',
    data.neighborhood  || '',
    data.price         || '',
    data.squareFootage || '',
    data.transitCommute || '',
    data.walkingCommute || '',
    yesNo(data.hasWasherDryer),
    yesNo(data.hasElevator),
    yesNo(data.hasDoorman),
    yesNo(data.hasDishwasher),
    data.url   || '',
    data.notes || '',
  ]);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
