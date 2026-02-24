import { useState } from 'react';

export default function ConfigModal({ currentUrl, currentGeminiKey, onSave, onClose }) {
  const [url, setUrl] = useState(currentUrl || '');
  const [geminiKey, setGeminiKey] = useState(currentGeminiKey || '');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) {
      onSave(trimmed, geminiKey.trim());
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Settings</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="script-url">Apps Script URL</label>
          <input
            id="script-url"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            required
          />
          <p className="hint">
            Paste the deployed Apps Script web app URL. This is the same URL used in the Chrome extension settings.
          </p>

          <label htmlFor="gemini-key">Gemini API Key</label>
          <input
            id="gemini-key"
            type="password"
            value={geminiKey}
            onChange={e => setGeminiKey(e.target.value)}
            placeholder="AIza..."
          />
          <p className="hint">
            Optional. Used to estimate square footage from floor plan images via Gemini 2.0 Flash.
          </p>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
