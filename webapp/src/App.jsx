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
    sort: 'date-desc',
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
      case 'undecided': return interested !== 'Yes' && interested !== 'No';
      default: return true;
    }
  }, [filters.status]);

  const filteredListings = useMemo(() => {
    let result = listings.filter(l => {
      if (filters.neighborhood && l.Neighborhood !== filters.neighborhood) return false;
      if (!matchesStatus(l)) return false;
      return true;
    });

    const parseNum = (str) => {
      if (!str) return Infinity;
      const n = parseInt(String(str).replace(/[^0-9]/g, ''), 10);
      return isNaN(n) ? Infinity : n;
    };

    result.sort((a, b) => {
      switch (filters.sort) {
        case 'date-asc': return 0; // sheet order is date-asc
        case 'price-asc': return parseNum(a['Price ($/mo)']) - parseNum(b['Price ($/mo)']);
        case 'price-desc': return parseNum(b['Price ($/mo)']) - parseNum(a['Price ($/mo)']);
        case 'transit-asc': return parseNum(a['Transit (min)']) - parseNum(b['Transit (min)']);
        case 'walking-asc': return parseNum(a['Walking (min)']) - parseNum(b['Walking (min)']);
        case 'date-desc':
        default:
          return 0; // reverse sheet order
      }
    });

    // Sheet rows come in date-asc order, so reverse for date-desc
    if (filters.sort === 'date-desc') {
      result = result.reverse();
    }

    return result;
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
