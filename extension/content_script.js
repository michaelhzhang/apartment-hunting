// content_script.js — Runs on StreetEasy rental listing pages.
// Extracts apartment data and responds to popup data requests.

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

function getMeta(name) {
  const el =
    document.querySelector(`meta[property="${name}"]`) ||
    document.querySelector(`meta[name="${name}"]`);
  return el ? el.getAttribute('content') || '' : '';
}

function getJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent);
      // Handle single object or @graph array
      const items = Array.isArray(data['@graph']) ? data['@graph'] : [data];
      for (const item of items) {
        const type = item['@type'];
        if (
          type === 'Apartment' ||
          type === 'RealEstateListing' ||
          type === 'Residence' ||
          type === 'Product' ||
          type === 'Place'
        ) {
          return item;
        }
      }
    } catch (_) {}
  }
  return null;
}

function formatAddress(addrObj) {
  if (typeof addrObj === 'string') return addrObj.trim();
  const parts = [
    addrObj.streetAddress,
    addrObj.addressLocality,
    addrObj.addressRegion,
    addrObj.postalCode,
  ].filter(Boolean);
  return parts.join(', ');
}

function trySelectors(selectors, transform = (el) => el.textContent.trim()) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const val = transform(el);
      if (val) return val;
    }
  }
  return '';
}

function allTextOf(selectors) {
  const texts = [];
  for (const sel of selectors) {
    document.querySelectorAll(sel).forEach((el) => {
      const t = el.textContent.trim();
      if (t) texts.push(t.toLowerCase());
    });
  }
  return texts;
}

// ---------------------------------------------------------------------------
// StreetEasy-specific extractor
// ---------------------------------------------------------------------------

function extractStreetEasy() {
  const result = {
    source: 'streeteasy',
    url: window.location.href,
    address: '',
    neighborhood: '',
    price: '',
    squareFootage: '',
    unit: '',
    hasWasherDryer: false,
    hasLaundryInBuilding: false,
    hasElevator: false,
    hasDoorman: false,
    hasDishwasher: false,
    hasGym: false,
    nearbyTrains: '',
    availableNow: false,
    availableDate: '',   // YYYY-MM-DD or ''
  };

  // --- Unit number from URL path: /building/building-name/UNIT ---
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts.length >= 3) {
    result.unit = pathParts[2].toUpperCase();
  }

  // --- JSON-LD (StreetEasy uses @type: Apartment) ---
  const ld = getJsonLd();
  if (ld) {
    // Address is a plain string in StreetEasy's schema
    if (ld.address) result.address = formatAddress(ld.address);
    if (ld.name && !result.address) result.address = ld.name.trim();

    // Amenities: StreetEasy uses amenityFeature [{name, value}] array
    if (Array.isArray(ld.amenityFeature)) {
      const has = (name) => ld.amenityFeature.some((f) => f.name === name && f.value);
      result.hasDoorman          = has('doorman') || has('concierge') || has('full_time');
      result.hasElevator         = has('elevator');
      result.hasGym              = has('gym');
      // "laundry" in amenityFeature = laundry in building (not in-unit)
      result.hasLaundryInBuilding = has('laundry');
    }

    // W/D in unit, dishwasher, trains, and neighborhood come from the description
    if (ld.description) {
      const desc = ld.description;

      result.hasWasherDryer = /washer|dryer|\bw\/d\b/i.test(desc);
      result.hasDishwasher  = /dishwasher/i.test(desc);

      // Trains: look for "Subway access: F, M, B, D, and 6 lines"
      const subwayMatch = desc.match(/subway(?:\s+access)?:?\s*([^\n.]+)/i);
      if (subwayMatch) {
        const NYC_LINES = /\b([1-7]|[ACEBDFMNQRWJLZGS]|SIR)\b/g;
        const lines = [...new Set(subwayMatch[1].toUpperCase().match(NYC_LINES) || [])];
        if (lines.length) result.nearbyTrains = lines.join(', ');
      }
    }
  }

  // --- OpenGraph meta fallbacks ---
  if (!result.address)      result.address      = getMeta('og:street-address');
  if (!result.neighborhood) result.neighborhood = getMeta('og:locality');

  // --- DOM fallback for address ---
  if (!result.address) {
    result.address = trySelectors(['h1.building-title', '[class*="buildingTitle"]', 'h1']);
  }

  // --- DOM fallback for neighborhood ---
  // StreetEasy uses MUI breadcrumbs with aria-label="breadcrumb".
  // The building name is plain text (not an <a>), so the last <a> is the neighborhood.
  if (!result.neighborhood) {
    const crumbs = [...document.querySelectorAll('nav[aria-label="breadcrumb"] a')];
    if (crumbs.length >= 1) {
      result.neighborhood = crumbs[crumbs.length - 1].textContent.trim();
    }
  }

  // --- DOM fallback for price ---
  // StreetEasy: <h4 class="...PriceInfo_price...">$5,900</h4>
  if (!result.price) {
    const priceEl = document.querySelector('[class*="PriceInfo_price"]');
    if (priceEl) {
      const m = priceEl.textContent.match(/\$([\d,]+)/);
      if (m) result.price = m[1].replace(/,/g, '');
    }
  }

  // --- DOM fallback for square footage ---
  if (!result.squareFootage) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const sqftRe = /([\d,]+)\s*(?:ft²|sq\.?\s*ft\.?|square\s*f(?:eet|t))/i;
    let node;
    while ((node = walker.nextNode())) {
      const m = node.textContent.match(sqftRe);
      if (m) { result.squareFootage = m[1].replace(/,/g, ''); break; }
    }
  }

  // --- DOM fallback for availability ---
  // StreetEasy: <div data-testid="rentalListingSpec-available">
  //               <p>Available</p>
  //               <p>Available now</p>  ← or a date like "March 1, 2026"
  //             </div>
  if (!result.availableNow && !result.availableDate) {
    const container = document.querySelector('[data-testid="rentalListingSpec-available"]');
    if (container) {
      const valueEl = container.querySelector('p:last-of-type') || container.lastElementChild;
      const raw = valueEl?.textContent.trim() || '';
      if (/now|immed/i.test(raw)) {
        result.availableNow = true;
      } else if (raw) {
        const parsed = new Date(raw.replace(/available\s*/i, '').trim());
        if (!isNaN(parsed.getTime())) {
          result.availableDate = parsed.toISOString().slice(0, 10);
        }
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Message listener — popup requests data via sendMessage
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_LISTING_DATA') {
    try {
      sendResponse({ data: extractStreetEasy() });
    } catch (err) {
      sendResponse({ data: null, error: err.message });
    }
  }
  return true; // keep channel open for async
});
