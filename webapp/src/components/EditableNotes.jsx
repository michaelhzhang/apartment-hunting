import { useState, useRef } from 'react';

export default function EditableNotes({ listing, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(listing.Notes || '');
  const inputRef = useRef(null);

  function startEditing() {
    setValue(listing.Notes || '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function save() {
    setEditing(false);
    if (value !== (listing.Notes || '')) {
      onSave(listing.Link, 'Notes', value);
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
        className="notes-input"
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <span className="notes-display" onClick={startEditing} title="Click to edit">
      {listing.Notes || '—'}
    </span>
  );
}
