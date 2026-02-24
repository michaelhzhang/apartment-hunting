export default function Header({ onRefresh, loading }) {
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
      </div>
    </header>
  );
}
