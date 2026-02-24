import { useState, useCallback, useEffect } from 'react';
import { getListings, updateStatus } from '../api/sheets.js';

export function useListings(scriptUrl) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!scriptUrl) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getListings(scriptUrl);
      setListings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [scriptUrl]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleStatus = useCallback(async (link, field, newValue) => {
    // Optimistic update
    setListings(prev =>
      prev.map(l =>
        l.Link === link ? { ...l, [field]: newValue } : l
      )
    );

    try {
      await updateStatus(scriptUrl, link, { [field]: newValue });
    } catch (err) {
      // Roll back on failure
      setListings(prev =>
        prev.map(l =>
          l.Link === link ? { ...l, [field]: l[field] === newValue ? '' : l[field] } : l
        )
      );
      // Re-fetch to get accurate state
      refresh();
      setError(`Failed to update: ${err.message}`);
    }
  }, [scriptUrl, refresh]);

  return { listings, loading, error, refresh, toggleStatus };
}
