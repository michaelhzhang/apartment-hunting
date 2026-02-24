export default function StatusControls({ listing, onToggle }) {
  const link = listing.Link;
  const scheduled = listing['Viewing Scheduled'] === 'Yes';
  const viewed = listing['Viewed'] === 'Yes';
  const interested = listing['Interested'];

  return (
    <div className="status-controls">
      <button
        className={`status-btn ${scheduled ? 'status-scheduled' : ''}`}
        onClick={() => onToggle(link, 'Viewing Scheduled', scheduled ? '' : 'Yes')}
        title="Viewing Scheduled"
      >
        Scheduled
      </button>
      <button
        className={`status-btn ${viewed ? 'status-viewed' : ''}`}
        onClick={() => onToggle(link, 'Viewed', viewed ? '' : 'Yes')}
        title="Viewed"
      >
        Viewed
      </button>
      <button
        className={`status-btn ${interested === 'Yes' ? 'status-interested' : ''}`}
        onClick={() => onToggle(link, 'Interested', interested === 'Yes' ? '' : 'Yes')}
      >
        Interested
      </button>
      <button
        className={`status-btn ${interested === 'No' ? 'status-not-interested' : ''}`}
        onClick={() => onToggle(link, 'Interested', interested === 'No' ? '' : 'No')}
      >
        Not Interested
      </button>
      <button
        className={`status-btn ${interested === 'Unavailable' ? 'status-unavailable' : ''}`}
        onClick={() => onToggle(link, 'Interested', interested === 'Unavailable' ? '' : 'Unavailable')}
      >
        Unavailable
      </button>
    </div>
  );
}
