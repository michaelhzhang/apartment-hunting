export default function Header({ onRefresh, onOpenSettings, loading }) {
  return (
    <header className="header">
      <h1>Apartment Hunter</h1>
      <div className="header-actions">
        <button
          className="btn btn-icon"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh listings"
        >
          {loading ? '...' : 'Refresh'}
        </button>
        <button
          className="btn btn-icon"
          onClick={onOpenSettings}
          title="Settings"
        >
          Settings
        </button>
      </div>
    </header>
  );
}
