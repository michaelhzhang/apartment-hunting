import { useState, useMemo, useCallback } from 'react';
import Header from './components/Header.jsx';
import FilterBar from './components/FilterBar.jsx';
import ListingTable from './components/ListingTable.jsx';
import ConfigModal from './components/ConfigModal.jsx';
import { useListings } from './hooks/useListings.js';

const STORAGE_KEY = 'apartmentHunter_scriptUrl';

function getStoredUrl() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export default function App() {
  const [scriptUrl, setScriptUrl] = useState(getStoredUrl);
  const [showSettings, setShowSettings] = useState(!getStoredUrl());
  const [filters, setFilters] = useState({
    neighborhood: '',
    status: 'all',
  });

  const { listings, loading, error, refresh, toggleStatus } = useListings(scriptUrl);

  function handleSaveUrl(url) {
    localStorage.setItem(STORAGE_KEY, url);
    setScriptUrl(url);
    setShowSettings(false);
  }

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
        onOpenSettings={() => setShowSettings(true)}
        loading={loading}
      />

      {error && (
        <div className="error-banner">
          {error}
          <button className="btn-dismiss" onClick={() => {}}>dismiss</button>
        </div>
      )}

      {!scriptUrl && !showSettings && (
        <div className="empty-state">
          <p>No Apps Script URL configured.</p>
          <button className="btn btn-primary" onClick={() => setShowSettings(true)}>
            Configure
          </button>
        </div>
      )}

      {scriptUrl && (
        <>
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
        </>
      )}

      {showSettings && (
        <ConfigModal
          currentUrl={scriptUrl}
          onSave={handleSaveUrl}
          onClose={() => scriptUrl && setShowSettings(false)}
        />
      )}
    </div>
  );
}
