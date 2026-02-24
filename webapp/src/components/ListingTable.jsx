import { useState, useMemo } from 'react';
import ListingCard from './ListingCard.jsx';
import StatusControls from './StatusControls.jsx';
import EditableNotes from './EditableNotes.jsx';
import EditableSqFt from './EditableSqFt.jsx';
import { formatPrice, formatCommute, getAmenityBadges } from '../utils/formatters.js';

const COLUMNS = [
  { key: 'address', label: 'Address', sortable: true },
  { key: 'neighborhood', label: 'Neighborhood', sortable: true },
  { key: 'price', label: 'Price', sortable: true },
  { key: 'sqft', label: 'Sq Ft', sortable: true },
  { key: 'transit', label: 'Transit', sortable: true },
  { key: 'walking', label: 'Walking', sortable: true },
  { key: 'available', label: 'Available', sortable: true },
  { key: 'amenities', label: 'Amenities', sortable: false },
  { key: 'trains', label: 'Trains', sortable: false },
  { key: 'notes', label: 'Notes', sortable: false },
  { key: 'status', label: 'Status', sortable: false },
];

function parseNum(str) {
  if (!str) return Infinity;
  const n = parseInt(String(str).replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? Infinity : n;
}

function getSortValue(listing, key) {
  switch (key) {
    case 'address': return [listing.Address, listing.Unit].filter(Boolean).join(' #').toLowerCase();
    case 'neighborhood': return (listing.Neighborhood || '').toLowerCase();
    case 'price': return parseNum(listing['Price ($/mo)']);
    case 'sqft': return parseNum(listing['Sq Ft']);
    case 'transit': return parseNum(listing['Transit (min)']);
    case 'walking': return parseNum(listing['Walking (min)']);
    case 'available': return listing['Available From'] || '';
    default: return '';
  }
}

export default function ListingTable({ listings, onToggle }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  function handleSort(key) {
    if (sortKey === key) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        // Third click: clear sort
        setSortKey(null);
        setSortDir('asc');
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return listings;
    return [...listings].sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      let cmp;
      if (typeof av === 'number' && typeof bv === 'number') {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [listings, sortKey, sortDir]);

  if (listings.length === 0) {
    return <p className="empty-state">No listings found.</p>;
  }

  return (
    <>
      {/* Desktop table */}
      <div className="table-wrapper">
        <table className="listings-table">
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={col.sortable ? 'sortable-th' : ''}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span className="sort-indicator">{sortDir === 'asc' ? ' \u25B2' : ' \u25BC'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(listing => {
              const address = [listing.Address, listing.Unit].filter(Boolean).join(' #');
              const amenities = getAmenityBadges(listing);
              return (
                <tr key={listing.Link}>
                  <td>
                    <a href={listing.Link} target="_blank" rel="noopener noreferrer">
                      {address || 'Unknown'}
                    </a>
                  </td>
                  <td>{listing.Neighborhood || '—'}</td>
                  <td>{formatPrice(listing['Price ($/mo)'])}</td>
                  <td>
                    <EditableSqFt listing={listing} onSave={onToggle} />
                  </td>
                  <td>{formatCommute(listing['Transit (min)'])}</td>
                  <td>{formatCommute(listing['Walking (min)'])}</td>
                  <td>{listing['Available From'] || '—'}</td>
                  <td>
                    <div className="amenity-list">
                      {amenities.map(a => (
                        <span key={a} className="amenity-badge">{a}</span>
                      ))}
                    </div>
                  </td>
                  <td>{listing['Nearby Trains'] || '—'}</td>
                  <td className="notes-cell">
                    <EditableNotes listing={listing} onSave={onToggle} />
                  </td>
                  <td>
                    <StatusControls listing={listing} onToggle={onToggle} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="cards-wrapper">
        {sorted.map(listing => (
          <ListingCard key={listing.Link} listing={listing} onToggle={onToggle} />
        ))}
      </div>
    </>
  );
}
