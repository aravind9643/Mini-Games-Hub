import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import GameCard from '../components/GameCard';
import { categories, categoryColors, games } from '../data/games';

const readList = key => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};

export default function Home() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || 'All');
  const [sort, setSort] = useState(params.get('sort') || 'featured');
  const [favorites, setFavorites] = useState(() => readList('games-favorites'));
  const recent = readList('games-recent');

  useEffect(() => {
    const next = {};
    if (query) next.q = query;
    if (category !== 'All') next.category = category;
    if (sort !== 'featured') next.sort = sort;
    setParams(next, { replace: true });
  }, [query, category, sort, setParams]);

  const visibleGames = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = games.filter(game => (category === 'All' || game.category === category) &&
      (!q || `${game.title} ${game.description} ${game.category}`.toLowerCase().includes(q)));
    if (sort === 'az') result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'favorites') result = result.filter(game => favorites.includes(game.path));
    if (sort === 'recent') result = [...result].sort((a, b) => recent.indexOf(a.path) - recent.indexOf(b.path)).filter(t => recent.includes(t.path));
    return result;
  }, [query, category, sort, favorites, recent]);

  const toggleFavorite = path => {
    const next = favorites.includes(path) ? favorites.filter(item => item !== path) : [...favorites, path];
    setFavorites(next);
    localStorage.setItem('games-favorites', JSON.stringify(next));
  };

  return (
    <>
      <section className="hero">
        <div className="hero-badge">🎮 Instant Play — 100% Free & Ad-Free</div>
        <h1>Sleek Glassmorphic Mini Games</h1>
        <p>A collection of timeless board, arcade, and puzzle games running directly in your web browser. Pick a game and start playing!</p>
      </section>

      <section aria-labelledby="games-heading">
        <div className="catalog-heading">
          <div>
            <h2 id="games-heading">Explore Games</h2>
            <p>{visibleGames.length} of {games.length} games available</p>
          </div>
          <label className="sort-control">
            <span>Sort by</span>
            <select value={sort} onChange={e => setSort(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="az">A–Z</option>
              <option value="favorites">Favorites</option>
              <option value="recent">Recently played</option>
            </select>
          </label>
        </div>

        <label className="catalog-search">
          <span className="sr-only">Filter games</span>
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input 
            value={query} 
            onChange={event => setQuery(event.target.value)} 
            placeholder="Search mini games by name, category..." 
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear filter">
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          )}
        </label>

        <div className="category-chips" role="group" aria-label="Filter by category">
          {categories.map(item => (
            <button
              type="button"
              key={item}
              className={category === item ? 'active' : ''}
              style={{ '--chip-color': categoryColors[item] || 'var(--accent-purple)' }}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        
        {visibleGames.length > 0 ? (
          <div className="tools-grid">
            {visibleGames.map(game => (
              <GameCard 
                key={game.path} 
                {...game} 
                favorite={favorites.includes(game.path)} 
                onFavorite={toggleFavorite} 
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="fa-solid fa-magnifying-glass" />
            <h3>No games found</h3>
            <p>Try searching for something else or clear the filters.</p>
            <button className="btn btn-primary" onClick={() => { setQuery(''); setCategory('All'); setSort('featured'); }}>
              Clear Filters
            </button>
          </div>
        )}
      </section>
    </>
  );
}
