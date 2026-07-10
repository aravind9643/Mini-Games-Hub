import { Link } from 'react-router-dom';
import { categories, categoryColors, games } from '../../data/games';

const gamesByCategory = categories
  .filter(cat => cat !== 'All')
  .map(cat => ({ category: cat, items: games.filter(g => g.category === cat) }));

export default function CategorySheet({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Browse by category">
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-panel glass-panel">
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2>Browse by Category</h2>
          <button type="button" className="search-overlay-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="sheet-body">
          {gamesByCategory.map(({ category, items }) => (
            <div key={category} className="sheet-group">
              <div className="sheet-group-title" style={{ '--cat-color': categoryColors[category] }}>
                <span className="sidebar-group-dot" />
                {category}
              </div>
              <div className="sheet-group-grid">
                {items.map(game => (
                  <Link key={game.path} to={game.path} className="sheet-game-link" style={{ '--tool-color': game.color }} onClick={onClose}>
                    <i className={game.icon} aria-hidden="true" />
                    <span>{game.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
