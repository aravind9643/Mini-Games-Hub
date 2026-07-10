import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { games } from '../../data/games';

export default function Navbar({ onMenuToggle }) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const navigate = useNavigate();

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

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return games.filter(g =>
      g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [query]);

  const handleKeyDown = (e) => {
    if (!showResults || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      setFocusedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      handleSelect(results[focusedIndex].path);
    }
  };

  const handleSelect = (path) => {
    navigate(path);
    setQuery('');
    setShowResults(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <button className="mobile-menu-btn" onClick={onMenuToggle} aria-label="Toggle navigation menu">
          <i className="fa-solid fa-bars"></i>
        </button>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div className="sidebar-logo" style={{ width: '32px', height: '32px', fontSize: '0.95rem' }}>
            <i className="fa-solid fa-gamepad"></i>
          </div>
          <span className="sidebar-title" style={{ fontSize: '1.2rem', marginBottom: 0, marginLeft: 0 }}>Games Hub</span>
        </Link>
      </div>

      <div className="navbar-search" style={{ position: 'relative' }}>
        <span className="search-icon">
          <i className="fa-solid fa-magnifying-glass"></i>
        </span>
        <input
          type="text"
          placeholder="Search games..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          onKeyDown={handleKeyDown}
        />
        {showResults && results.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 8,
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 999,
            boxShadow: 'var(--shadow-lg)'
          }}>
            {results.map((r, idx) => (
              <button 
                key={r.path} 
                onTouchStart={(e) => { e.preventDefault(); handleSelect(r.path); }}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(r.path); }} 
                style={{
                  display: 'block', width: '100%', padding: '0.7rem 1rem', textAlign: 'left',
                  background: idx === focusedIndex ? 'var(--bg-glass-hover)' : 'none', border: 'none', color: 'var(--text-primary)',
                  fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s'
                }}
                onMouseEnter={() => setFocusedIndex(idx)}
              >
                {r.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="navbar-actions">
        <button className="navbar-action-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} style={{ border: 'none', outline: 'none' }}>
          {theme === 'dark' ? <i className="fa-solid fa-sun"></i> : <i className="fa-solid fa-moon"></i>}
        </button>
      </div>
    </nav>
  );
}
