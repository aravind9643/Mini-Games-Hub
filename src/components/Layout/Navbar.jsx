import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ onSearchClick }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('games-theme') || 'dark';
    if (saved === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    return saved;
  });

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      document.body.classList.add('light-theme');
      localStorage.setItem('games-theme', 'light');
    } else {
      setTheme('dark');
      document.body.classList.remove('light-theme');
      localStorage.setItem('games-theme', 'dark');
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div className="sidebar-logo" style={{ width: '32px', height: '32px', fontSize: '0.95rem' }}>
            <i className="fa-solid fa-gamepad"></i>
          </div>
          <span className="sidebar-title" style={{ fontSize: '1.2rem', marginBottom: 0, marginLeft: 0 }}>Games Hub</span>
        </Link>
      </div>

      <button type="button" className="navbar-search-trigger" onClick={onSearchClick}>
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <span>Search games...</span>
      </button>

      <div className="navbar-actions">
        <button
          className="navbar-action-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ border: 'none', outline: 'none' }}
        >
          {theme === 'dark' ? <i className="fa-solid fa-sun"></i> : <i className="fa-solid fa-moon"></i>}
        </button>
      </div>
    </nav>
  );
}
