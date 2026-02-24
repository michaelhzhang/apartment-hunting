import { useState } from 'react';

export default function ConfigModal({ currentUrl, onSave, onClose }) {
  const [url, setUrl] = useState(currentUrl || '');

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (trimmed) {
      onSave(trimmed);
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
