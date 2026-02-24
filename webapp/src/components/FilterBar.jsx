export default function FilterBar({
  neighborhoods,
  filters,
  onFilterChange,
}) {
  return (
    <div className="filter-bar">
      <select
        value={filters.neighborhood}
        onChange={e => onFilterChange({ ...filters, neighborhood: e.target.value })}
      >
        <option value="">All Neighborhoods</option>
        {neighborhoods.map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>

      <select
        value={filters.sort}
        onChange={e => onFilterChange({ ...filters, sort: e.target.value })}
      >
        <option value="date-desc">Newest First</option>
        <option value="date-asc">Oldest First</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
        <option value="transit-asc">Transit: Shortest</option>
      </select>

      <select
        value={filters.status}
        onChange={e => onFilterChange({ ...filters, status: e.target.value })}
      >
        <option value="all">All Statuses</option>
        <option value="needs-scheduling">Needs Scheduling</option>
        <option value="needs-viewing">Needs Viewing</option>
        <option value="interested">Interested</option>
        <option value="not-interested">Not Interested</option>
        <option value="undecided">Undecided</option>
      </select>
    </div>
  );
}
