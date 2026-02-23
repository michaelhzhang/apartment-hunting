// popup.js

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  // Wire up settings gear icon
  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  const settings = await chrome.storage.sync.get(['workAddress', 'mapsApiKey', 'appsScriptUrl']);
  const missingSettings = !settings.workAddress || !settings.mapsApiKey || !settings.appsScriptUrl;

  if (missingSettings) {
    showView('view-no-settings');
    document.getElementById('open-settings-btn').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isRentalListing = tab.url && /streeteasy\.com\/building\/[^/]+\/[^/?]+/.test(tab.url);

  if (!isRentalListing) {
    showView('view-not-listing');
    return;
  }

  showView('apartment-form');
  document.getElementById('url').value = tab.url;

  // Ask content script for extracted data
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_LISTING_DATA' });
    if (response?.data) populateForm(response.data);
  } catch (_) {
    // Content script not ready — form is still manually usable
  }

  document.getElementById('availableNow').addEventListener('change', (e) => {
    document.getElementById('availableDate').disabled = e.target.checked;
  });

  document.getElementById('apartment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveApartment(settings);
  });
});

// ---------------------------------------------------------------------------
// Form helpers
// ---------------------------------------------------------------------------

function populateForm(data) {
  setVal('address',       data.address);
  setVal('unit',          data.unit);
  setVal('neighborhood',  data.neighborhood);
  setVal('price',         data.price);
  setVal('squareFootage', data.squareFootage);
  setVal('nearbyTrains',  data.nearbyTrains);
  setChecked('hasWasherDryer',       data.hasWasherDryer);
  setChecked('hasLaundryInBuilding', data.hasLaundryInBuilding);
  setChecked('hasElevator',          data.hasElevator);
  setChecked('hasDoorman',           data.hasDoorman);
  setChecked('hasDishwasher',        data.hasDishwasher);
  setChecked('hasGym',               data.hasGym);
  if (data.availableNow) {
    setChecked('availableNow', true);
    document.getElementById('availableDate').disabled = true;
  } else if (data.availableDate) {
    setVal('availableDate', data.availableDate);
  }
}

function setVal(id, value) {
  if (value) document.getElementById(id).value = value;
}
function setChecked(id, value) {
  document.getElementById(id).checked = !!value;
}

function showView(id) {
  ['view-not-listing', 'view-no-settings', 'apartment-form'].forEach((v) =>
    document.getElementById(v).classList.add('hidden')
  );
  document.getElementById(id).classList.remove('hidden');
}

function setStatus(message, type) {
  const el = document.getElementById('status');
  el.textContent = message;
  el.className = `status ${type}`;
  el.classList.toggle('hidden', !message);
}

// ---------------------------------------------------------------------------
// Save flow
// ---------------------------------------------------------------------------

async function saveApartment(settings) {
  const btn = document.getElementById('save-btn');

  const address = document.getElementById('address').value.trim();
  if (!address) {
    setStatus('Address is required.', 'error');
    return;
  }

  btn.disabled = true;

  // Step 1: Commute times
  setStatus('Fetching commute times…', 'loading');
  let transitTime = 'N/A';
  let walkingTime = 'N/A';
  try {
    [transitTime, walkingTime] = await Promise.all([
      getCommuteTime(address, settings.workAddress, 'transit', settings.mapsApiKey),
      getCommuteTime(address, settings.workAddress, 'walking', settings.mapsApiKey),
    ]);
    document.getElementById('transit-time').textContent = displayMinutes(transitTime);
    document.getElementById('walking-time').textContent = displayMinutes(walkingTime);
    document.getElementById('commute-preview').classList.remove('hidden');
  } catch (err) {
    setStatus(`Maps API error: ${err.message}`, 'error');
    btn.disabled = false;
    return;
  }

  // Step 2: Build row
  const row = {
    address,
    neighborhood:  document.getElementById('neighborhood').value.trim(),
    price:         document.getElementById('price').value,
    squareFootage: document.getElementById('squareFootage').value,
    url:           document.getElementById('url').value,
    hasWasherDryer: document.getElementById('hasWasherDryer').checked,
    hasElevator:    document.getElementById('hasElevator').checked,
    hasDoorman:     document.getElementById('hasDoorman').checked,
    hasDishwasher:  document.getElementById('hasDishwasher').checked,
    unit:           document.getElementById('unit').value.trim(),
    nearbyTrains:   document.getElementById('nearbyTrains').value.trim(),
    hasLaundryInBuilding: document.getElementById('hasLaundryInBuilding').checked,
    hasGym:         document.getElementById('hasGym').checked,
    notes:          document.getElementById('notes').value.trim(),
    availableNow:   document.getElementById('availableNow').checked,
    availableDate:  document.getElementById('availableDate').value,
    transitCommute: transitTime,
    walkingCommute: walkingTime,
  };

  // Step 3: Save to Sheets via Apps Script
  setStatus('Saving to Google Sheets…', 'loading');
  try {
    await postToAppsScript(settings.appsScriptUrl, row);
    setStatus('Saved! ✓', 'success');
    btn.textContent = 'Saved ✓';
  } catch (err) {
    setStatus(`Failed to save: ${err.message}`, 'error');
    btn.disabled = false;
    btn.textContent = 'Save to Google Sheets';
  }
}

// ---------------------------------------------------------------------------
// Google Routes API (replaces legacy Distance Matrix API)
// ---------------------------------------------------------------------------

// Returns next Monday at 9:00 am as an ISO 8601 string.
// Fixed weekday morning keeps commute estimates consistent.
function nextMondayNineAmISO() {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  const day = d.getDay(); // 0 = Sun … 6 = Sat
  const daysUntil = day === 1 ? 7 : (8 - day) % 7;
  d.setDate(d.getDate() + daysUntil);
  return d.toISOString();
}

// Returns total minutes as a number — stored as-is in the sheet for sorting.
function toMinutes(seconds) {
  return Math.round(seconds / 60);
}

// Human-readable label used only in the popup preview.
function displayMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

async function getCommuteTime(origin, destination, mode, apiKey) {
  // Routes API uses TRANSIT / WALK (not "transit" / "walking")
  const travelMode = mode === 'walking' ? 'WALK' : 'TRANSIT';

  const body = {
    origin:      { address: origin },
    destination: { address: destination },
    travelMode:  travelMode,
  };

  // departure_time required for transit
  if (travelMode === 'TRANSIT') {
    body.departureTime = nextMondayNineAmISO();
  }

  const resp = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'X-Goog-Api-Key':  apiKey,
      'X-Goog-FieldMask': 'routes.duration',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

  const data = await resp.json();
  if (data.error) throw new Error(data.error.message || data.error.status);

  const route = data.routes?.[0];
  if (!route) throw new Error('No route found');

  // duration is returned as e.g. "1234s"
  const seconds = parseInt(route.duration.replace('s', ''), 10);
  return toMinutes(seconds);
}

// ---------------------------------------------------------------------------
// Google Apps Script POST
// ---------------------------------------------------------------------------

async function postToAppsScript(url, data) {
  const resp = await fetch(url, {
    method:   'POST',
    redirect: 'follow',
    headers:  { 'Content-Type': 'text/plain;charset=utf-8' },
    body:     JSON.stringify(data),
  });

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

  const text = await resp.text();

  // An HTML response means Apps Script returned an error page or a sign-in
  // redirect instead of JSON. Surface a clear message.
  if (text.trimStart().startsWith('<')) {
    throw new Error(
      'Apps Script returned an HTML page instead of JSON. ' +
      'Most likely fix: open Deploy → Manage deployments, edit your deployment, ' +
      'and confirm "Who has access" is set to "Anyone" (not "Anyone with Google account"). ' +
      'Then create a new deployment and update the URL in Settings.'
    );
  }

  const result = JSON.parse(text);
  if (!result.success) throw new Error(result.error || 'Unknown error from Apps Script');
}
