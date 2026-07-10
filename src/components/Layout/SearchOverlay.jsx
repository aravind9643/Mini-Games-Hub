import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { games } from '../../data/games';

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (open) {
      setQuery('');
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      handleSelect(results[focusedIndex].path);
    }
  };

  if (!open) return null;

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search games">
      <div className="search-overlay-backdrop" onClick={onClose} />
      <div className="search-overlay-panel glass-panel">
        <div className="search-overlay-input-row">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search games..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="search-overlay-close" onClick={onClose} aria-label="Close search">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {results.length > 0 && (
          <div className="search-overlay-results">
            {results.map((r, idx) => (
              <button
                key={r.path}
                type="button"
                className={`search-overlay-result ${idx === focusedIndex ? 'focused' : ''}`}
                style={{ '--tool-color': r.color }}
                onClick={() => handleSelect(r.path)}
                onMouseEnter={() => setFocusedIndex(idx)}
              >
                <i className={r.icon} aria-hidden="true" />
                <span>{r.title}</span>
                <span className="search-overlay-result-cat">{r.category}</span>
              </button>
            ))}
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <p className="search-overlay-empty">No games match "{query}".</p>
        )}
      </div>
    </div>
  );
}
