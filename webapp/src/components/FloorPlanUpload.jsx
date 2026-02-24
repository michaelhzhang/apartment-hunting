import { useState, useRef } from 'react';
import { estimateSqFt } from '../api/gemini.js';

export default function FloorPlanUpload({ geminiKey, listing, onSave }) {
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef(null);

  function handleClick() {
    if (!geminiKey) {
      alert('Add a Gemini API key in Settings first.');
      return;
    }
    fileRef.current?.click();
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setState('loading');
    try {
      const base64 = await fileToBase64(file);
      const sqft = await estimateSqFt(geminiKey, base64, file.type);
      setResult(sqft);
      setState('done');
      onSave(listing.Link, 'Sq Ft', String(sqft));
    } catch (err) {
      console.error('Floor plan estimate failed:', err);
      const msg = err.message || 'Unknown error';
      setErrorMsg(msg);
      setState('error');
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  return (
    <span className="floorplan-upload">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      {state === 'idle' && (
        <button className="floorplan-btn" onClick={handleClick} title="Estimate sq ft from floor plan">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>
      )}
      {state === 'loading' && (
        <span className="floorplan-spinner" title="Estimating..."></span>
      )}
      {state === 'done' && (
        <span className="floorplan-result" title="Estimated sq ft">{result}</span>
      )}
      {state === 'error' && (
        <span className="floorplan-error" title={errorMsg} onClick={() => setState('idle')}>
          ! <span className="floorplan-error-msg">{errorMsg}</span>
        </span>
      )}
    </span>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Strip the data:...;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
