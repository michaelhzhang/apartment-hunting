import ListingCard from './ListingCard.jsx';
import StatusControls from './StatusControls.jsx';
import EditableNotes from './EditableNotes.jsx';
import EditableSqFt from './EditableSqFt.jsx';
import { formatPrice, formatCommute, getAmenityBadges } from '../utils/formatters.js';

export default function ListingTable({ listings, onToggle }) {
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
              <th>Address</th>
              <th>Neighborhood</th>
              <th>Price</th>
              <th>Sq Ft</th>
              <th>Transit</th>
              <th>Walking</th>
              <th>Available</th>
              <th>Amenities</th>
              <th>Trains</th>
              <th>Notes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {listings.map(listing => {
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
        {listings.map(listing => (
          <ListingCard key={listing.Link} listing={listing} onToggle={onToggle} />
        ))}
      </div>
    </>
  );
}
