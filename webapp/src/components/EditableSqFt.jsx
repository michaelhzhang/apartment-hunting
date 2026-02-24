import { useState, useRef } from 'react';
import { formatSqFt } from '../utils/formatters.js';

export default function EditableSqFt({ listing, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(listing['Sq Ft'] || '');
  const inputRef = useRef(null);

  function startEditing() {
    setValue(listing['Sq Ft'] || '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function save() {
    setEditing(false);
    if (value !== (listing['Sq Ft'] || '')) {
      onSave(listing.Link, 'Sq Ft', value);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="notes-input sqft-input"
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        placeholder="e.g. 750"
      />
    );
  }

  return (
    <span className="notes-display" onClick={startEditing} title="Click to edit">
      {listing['Sq Ft'] ? formatSqFt(listing['Sq Ft']) : <span className="notes-placeholder">Add sq ft...</span>}
      <span className="notes-edit-icon">&#9998;</span>
    </span>
  );
}
