import { useState, useMemo, useCallback } from 'react';
import Header from './components/Header.jsx';
import FilterBar from './components/FilterBar.jsx';
import ListingTable from './components/ListingTable.jsx';
import { useListings } from './hooks/useListings.js';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxy7PynJuRjgMaLmUCxq4rQq4IFSwOAyw6tZTK1yC6ymbNcvDJv-EkIzjVU7Pfl2lYI/exec';

export default function App() {
  const [filters, setFilters] = useState({
    neighborhood: '',
    status: 'all',
  });

  const { listings, loading, error, refresh, toggleStatus } = useListings(SCRIPT_URL);

  // Unique neighborhoods
  const neighborhoods = useMemo(() => {
    const set = new Set(listings.map(l => l.Neighborhood).filter(Boolean));
    return [...set].sort();
  }, [listings]);

  // Filter logic
  const matchesStatus = useCallback((listing) => {
    const scheduled = listing['Viewing Scheduled'] === 'Yes';
    const viewed = listing['Viewed'] === 'Yes';
    const interested = listing['Interested'];

    switch (filters.status) {
      case 'needs-scheduling': return !scheduled && !viewed;
      case 'needs-viewing': return scheduled && !viewed;
      case 'interested': return interested === 'Yes';
      case 'not-interested': return interested === 'No';
      case 'unavailable': return interested === 'Unavailable';
      default: return true;
    }
  }, [filters.status]);

  const filteredListings = useMemo(() => {
    return listings.filter(l => {
      if (filters.neighborhood && l.Neighborhood !== filters.neighborhood) return false;
      if (!matchesStatus(l)) return false;
      return true;
    });
  }, [listings, filters, matchesStatus]);

  return (
    <div className="app">
      <Header
        onRefresh={refresh}
        loading={loading}
      />

      {error && (
        <div className="error-banner">
          {error}
          <button className="btn-dismiss" onClick={() => {}}>dismiss</button>
        </div>
      )}

      <FilterBar
            neighborhoods={neighborhoods}
            filters={filters}
            onFilterChange={setFilters}
          />
          {loading && listings.length === 0 ? (
            <p className="loading-state">Loading listings...</p>
          ) : (
            <ListingTable listings={filteredListings} onToggle={toggleStatus} />
          )}
      <div className="listing-count">
        {filteredListings.length} of {listings.length} listings
      </div>
    </div>
  );
}
