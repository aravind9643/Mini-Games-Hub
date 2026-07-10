import { Link, useLocation } from 'react-router-dom';

export default function BottomNav({ onCategoriesClick, onSearchClick, favoritesActive }) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="bottom-nav" aria-label="Primary">
      <Link to="/" className={`bottom-nav-item ${isHome ? 'active' : ''}`}>
        <i className="fa-solid fa-house" aria-hidden="true" />
        <span>Home</span>
      </Link>
      <button type="button" className="bottom-nav-item" onClick={onCategoriesClick}>
        <i className="fa-solid fa-grip" aria-hidden="true" />
        <span>Categories</span>
      </button>
      <Link to="/?sort=favorites" className={`bottom-nav-item ${favoritesActive ? 'active' : ''}`}>
        <i className="fa-solid fa-star" aria-hidden="true" />
        <span>Favorites</span>
      </Link>
      <button type="button" className="bottom-nav-item" onClick={onSearchClick}>
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <span>Search</span>
      </button>
    </nav>
  );
}
