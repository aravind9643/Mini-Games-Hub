import { Link, useLocation } from 'react-router-dom';
import { categories, categoryColors, categoryIcons, games } from '../../data/games';

const gamesByCategory = categories
  .filter(cat => cat !== 'All')
  .map(cat => ({ category: cat, items: games.filter(g => g.category === cat) }));

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <div className="sidebar-logo">
            <i className="fa-solid fa-gamepad"></i>
          </div>
          <span className="sidebar-title">Games Hub</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-menu">
          <Link
            to="/"
            className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">
              <i className="fa-solid fa-house"></i>
            </span>
            <span>Dashboard</span>
          </Link>
        </div>

        {gamesByCategory.map(({ category, items }) => (
          <details key={category} className="sidebar-group" open>
            <summary className="sidebar-group-title" style={{ '--cat-color': categoryColors[category] }}>
              <span className="sidebar-group-title-label">
                <span className="sidebar-group-dot" />
                {category}
              </span>
              <i className="fa-solid fa-chevron-down sidebar-group-caret" aria-hidden="true" />
            </summary>
            <div className="sidebar-menu">
              {items.map(game => (
                <Link
                  key={game.path}
                  to={game.path}
                  className={`sidebar-link ${location.pathname === game.path ? 'active' : ''}`}
                  style={{ '--tool-color': game.color }}
                >
                  <span className="sidebar-link-icon" style={{ color: location.pathname === game.path ? 'inherit' : game.color }}>
                    <i className={game.icon}></i>
                  </span>
                  <span>{game.title}</span>
                </Link>
              ))}
            </div>
          </details>
        ))}
      </nav>
    </aside>
  );
}
