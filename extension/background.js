// background.js — Manifest V3 service worker
// Logic lives in popup.js; this file is required by MV3.

chrome.runtime.onInstalled.addListener(() => {
  console.log('Apartment Hunter installed.');
});
