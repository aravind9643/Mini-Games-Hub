export function StatPill({ label, value, color }) {
  return (
    <div className="stat-pill" style={{ '--stat-color': color }}>
      <span className="stat-pill-label">{label}</span>
      <span className="stat-pill-value">{value}</span>
    </div>
  );
}

export default function GameHeader({ onMenu, stats = [], actions }) {
  return (
    <div className="cartridge-header">
      <button className="btn btn-secondary" onClick={onMenu}>
        <i className="fa-solid fa-arrow-left" /> Menu
      </button>

      <div className="stat-strip">
        {stats.map(stat => (
          <StatPill key={stat.label} {...stat} />
        ))}
      </div>

      {actions}
    </div>
  );
}
