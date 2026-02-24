export function formatPrice(price) {
  if (!price) return '—';
  const num = typeof price === 'string' ? parseInt(price.replace(/[^0-9]/g, ''), 10) : price;
  if (isNaN(num)) return price;
  return `$${num.toLocaleString()}`;
}

export function formatSqFt(sqft) {
  if (!sqft) return '—';
  const num = typeof sqft === 'string' ? parseInt(sqft.replace(/[^0-9]/g, ''), 10) : sqft;
  if (isNaN(num)) return sqft;
  return `${num.toLocaleString()} ft²`;
}

export function formatCommute(minutes) {
  if (!minutes) return '—';
  return `${minutes} min`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return dateStr;
}

export function getAmenityBadges(listing) {
  const amenities = [];
  if (listing['W/D in Unit'] === 'Yes') amenities.push('W/D');
  if (listing['Laundry in Building'] === 'Yes') amenities.push('Laundry');
  if (listing['Elevator'] === 'Yes') amenities.push('Elevator');
  if (listing['Doorman'] === 'Yes') amenities.push('Doorman');
  if (listing['Dishwasher'] === 'Yes') amenities.push('DW');
  if (listing['Gym'] === 'Yes') amenities.push('Gym');
  return amenities;
}
