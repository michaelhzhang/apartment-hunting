import StatusControls from './StatusControls.jsx';
import { formatPrice, formatSqFt, formatCommute, getAmenityBadges } from '../utils/formatters.js';

export default function ListingCard({ listing, onToggle }) {
  const amenities = getAmenityBadges(listing);
  const address = [listing.Address, listing.Unit].filter(Boolean).join(' #');

  return (
    <div className="listing-card">
      <div className="listing-main">
        <div className="listing-header">
          <a href={listing.Link} target="_blank" rel="noopener noreferrer" className="listing-address">
            {address || 'Unknown Address'}
          </a>
          <span className="listing-neighborhood">{listing.Neighborhood || '—'}</span>
        </div>
        <div className="listing-details">
          <span className="listing-price">{formatPrice(listing['Price ($/mo)'])}</span>
          <span className="listing-sqft">{formatSqFt(listing['Sq Ft'])}</span>
          <span className="listing-commute" title="Transit commute">
            {formatCommute(listing['Transit (min)'])}
          </span>
          <span className="listing-commute" title="Walking commute">
            {formatCommute(listing['Walking (min)'])}
          </span>
          <span className="listing-available">Avail: {listing['Available From'] || '—'}</span>
        </div>
        {amenities.length > 0 && (
          <div className="listing-amenities">
            {amenities.map(a => (
              <span key={a} className="amenity-badge">{a}</span>
            ))}
          </div>
        )}
        {listing['Nearby Trains'] && (
          <div className="listing-trains">{listing['Nearby Trains']}</div>
        )}
        {listing.Notes && (
          <div className="listing-notes">{listing.Notes}</div>
        )}
      </div>
      <StatusControls listing={listing} onToggle={onToggle} />
    </div>
  );
}
