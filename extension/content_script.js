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
    hasWasherDryer: false,
    hasElevator: false,
    hasDoorman: false,
    hasDishwasher: false,
  };

  // --- Structured data (most reliable) ---
  const ld = getJsonLd();
  if (ld) {
    if (ld.address) result.address = formatAddress(ld.address);
    if (ld.name && !result.address) result.address = ld.name.trim();
    if (ld.offers?.price) result.price = String(ld.offers.price);
    if (ld.floorSize?.value) result.squareFootage = String(ld.floorSize.value);
    if (ld.containedInPlace?.name) result.neighborhood = ld.containedInPlace.name;
  }

  // --- OpenGraph meta fallbacks ---
  if (!result.address) {
    // og:street-address is a Facebook Place meta property
    result.address = getMeta('og:street-address');
  }
  if (!result.neighborhood) {
    result.neighborhood = getMeta('og:locality');
  }

  // --- DOM fallbacks for address ---
  if (!result.address) {
    result.address = trySelectors([
      'h1.building-title',
      '[class*="buildingTitle"]',
      '[class*="listing-title"]',
      '[class*="ListingTitle"]',
      '[class*="address"]',
      'h1',
    ]);
  }

  // --- DOM fallbacks for neighborhood ---
  if (!result.neighborhood) {
    // Breadcrumbs: second-to-last link is usually neighborhood
    const breadcrumbLinks = [...document.querySelectorAll('[class*="breadcrumb"] a, [class*="Breadcrumb"] a, nav a')];
    if (breadcrumbLinks.length >= 2) {
      result.neighborhood = breadcrumbLinks[breadcrumbLinks.length - 2].textContent.trim();
    }
  }
  if (!result.neighborhood) {
    result.neighborhood = trySelectors([
      '[class*="neighborhood"]',
      '[class*="Neighborhood"]',
      '[data-neighborhood]',
    ]);
  }

  // --- DOM fallbacks for price ---
  if (!result.price) {
    const priceEl = document.querySelector(
      '[class*="price"] [class*="value"], [class*="Price"] [class*="value"], [class*="price"], [class*="Price"]'
    );
    if (priceEl) {
      const m = priceEl.textContent.match(/\$([\d,]+)/);
      if (m) result.price = m[1].replace(/,/g, '');
    }
  }

  // --- DOM fallbacks for square footage ---
  if (!result.squareFootage) {
    // Search all text on page for sqft pattern
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const sqftRe = /([\d,]+)\s*(?:ft²|sq\.?\s*ft\.?|square\s*f(?:eet|t))/i;
    let node;
    while ((node = walker.nextNode())) {
      const m = node.textContent.match(sqftRe);
      if (m) {
        result.squareFootage = m[1].replace(/,/g, '');
        break;
      }
    }
  }

  // --- Amenities ---
  const amenityTexts = allTextOf([
    '[class*="amenity"]',
    '[class*="Amenity"]',
    '[class*="feature"]',
    '[class*="Feature"]',
    '[class*="detail"]',
    '[class*="Detail"]',
    '[class*="building-info"] li',
    '[class*="BuildingInfo"] li',
    'ul li',
  ]);
  const joined = amenityTexts.join(' ');

  result.hasWasherDryer = /washer|dryer|w\/d|laundry\s+in\s+unit/i.test(joined);
  result.hasElevator    = /elevator/i.test(joined);
  result.hasDoorman     = /doorman|door\s*man|concierge/i.test(joined);
  result.hasDishwasher  = /dishwasher/i.test(joined);

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
