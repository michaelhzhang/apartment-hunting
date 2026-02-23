// options.js

const KEYS = ['workAddress', 'mapsApiKey', 'appsScriptUrl'];

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings into form
  const saved = await chrome.storage.sync.get(KEYS);
  KEYS.forEach((k) => {
    const el = document.getElementById(k);
    if (el && saved[k]) el.value = saved[k];
  });

  document.getElementById('save-btn').addEventListener('click', saveSettings);
});

async function saveSettings() {
  const values = {};
  for (const k of KEYS) {
    const el = document.getElementById(k);
    values[k] = el ? el.value.trim() : '';
  }

  await chrome.storage.sync.set(values);
  showStatus('Settings saved.', 'success');
}

function showStatus(message, type) {
  const el = document.getElementById('status');
  el.textContent = message;
  el.className = `status ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}
