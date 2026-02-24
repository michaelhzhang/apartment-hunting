export default function StatusControls({ listing, onToggle }) {
  const link = listing.Link;
  const scheduled = listing['Viewing Scheduled'] === 'Yes';
  const viewed = listing['Viewed'] === 'Yes';

  // Interested is 3-state: '' (undecided) -> 'Yes' -> 'No' -> ''
  const interested = listing['Interested'];

  function cycleInterested() {
    if (interested === 'Yes') {
      onToggle(link, 'Interested', 'No');
    } else if (interested === 'No') {
      onToggle(link, 'Interested', '');
    } else {
      onToggle(link, 'Interested', 'Yes');
    }
  }

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
        className={`status-btn ${interested === 'Yes' ? 'status-interested' : ''} ${interested === 'No' ? 'status-not-interested' : ''}`}
        onClick={cycleInterested}
        title={`Interested: ${interested || 'Undecided'}`}
      >
        {interested === 'Yes' ? 'Interested' : interested === 'No' ? 'Not Interested' : 'Undecided'}
      </button>
    </div>
  );
}
