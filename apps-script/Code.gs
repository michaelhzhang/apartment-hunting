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
  'Unit',
  'Neighborhood',
  'Price ($/mo)',
  'Sq Ft',
  'Available From',
  'Transit (min)',
  'Walking (min)',
  'W/D in Unit',
  'Laundry in Building',
  'Elevator',
  'Doorman',
  'Dishwasher',
  'Gym',
  'Nearby Trains',
  'Link',
  'Notes',
  'Viewing Scheduled',
  'Viewed',
  'Interested',
];

const AVAIL_COL = HEADERS.indexOf('Available From') + 1; // 1-indexed for Sheets API

// Run this once manually from the Apps Script editor (▶ Run) whenever
// HEADERS changes. It overwrites row 1 with the current header list.
function updateHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';

  if (action === 'getListings') {
    return getListings();
  }

  // Default: health check
  return jsonResponse({ ok: true, message: 'Apartment Hunter script is reachable.' });
}

function getListings() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return jsonResponse([]);
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getDisplayValues();

  const listings = data.map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) {
      obj[header] = row[i] || '';
    });
    return obj;
  });

  return jsonResponse(listings);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'append';

    if (action === 'updateStatus') {
      updateStatus(data.link, data.fields);
      return jsonResponse({ success: true });
    }

    // Default: append (backward-compatible with extension)
    appendRow(data);
    return jsonResponse({ success: true });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function updateStatus(link, fields) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    throw new Error('No data rows found');
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const linkCol = headers.indexOf('Link') + 1;

  if (linkCol === 0) {
    throw new Error('Link column not found');
  }

  // Find the row with matching link
  const links = sheet.getRange(2, linkCol, lastRow - 1, 1).getValues();
  var targetRow = -1;
  for (var i = 0; i < links.length; i++) {
    if (links[i][0] === link) {
      targetRow = i + 2; // +2 for header row and 0-index
      break;
    }
  }

  if (targetRow === -1) {
    throw new Error('Listing not found for link: ' + link);
  }

  // Update each specified field
  for (var field in fields) {
    var colIndex = headers.indexOf(field);
    if (colIndex === -1) {
      throw new Error('Column not found: ' + field);
    }
    sheet.getRange(targetRow, colIndex + 1).setValue(fields[field]);
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
    data.unit           || '',
    data.neighborhood   || '',
    data.price          || '',
    data.squareFootage  || '',
    '',                               // Available From — set below
    data.transitCommute || '',
    data.walkingCommute || '',
    yesNo(data.hasWasherDryer),
    yesNo(data.hasLaundryInBuilding),
    yesNo(data.hasElevator),
    yesNo(data.hasDoorman),
    yesNo(data.hasDishwasher),
    yesNo(data.hasGym),
    data.nearbyTrains || '',
    data.url          || '',
    data.notes        || '',
    '',                               // Viewing Scheduled
    '',                               // Viewed
    '',                               // Interested
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
