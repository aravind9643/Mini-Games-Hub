import { Link, useLocation } from 'react-router-dom';
import { games } from '../../data/games';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} onClick={onClose}>
          <div className="sidebar-logo">
            <i className="fa-solid fa-gamepad"></i>
          </div>
          <span className="sidebar-title">Games Hub</span>
        </Link>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-title">Navigation</div>
        <div className="sidebar-menu">
          <Link 
            to="/" 
            className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="sidebar-link-icon">
              <i className="fa-solid fa-house"></i>
            </span>
            <span>Dashboard</span>
          </Link>
        </div>

        <div className="sidebar-section-title">Mini Games</div>
        <div className="sidebar-menu">
          {games.map(game => (
            <Link 
              key={game.path}
              to={game.path} 
              className={`sidebar-link ${location.pathname === game.path ? 'active' : ''}`}
              style={{ '--tool-color': game.color }}
              onClick={onClose}
            >
              <span className="sidebar-link-icon" style={{ color: location.pathname === game.path ? 'inherit' : game.color }}>
                <i className={game.icon}></i>
              </span>
              <span>{game.title}</span>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
