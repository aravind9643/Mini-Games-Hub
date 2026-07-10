import { Link } from 'react-router-dom';

export default function GameCard({ icon, title, description, path, color, category, difficulty, favorite, onFavorite }) {
  return (
    <article className="tool-card" style={{ '--tool-color': color }}>
      <button 
        type="button" 
        className={`favorite-btn ${favorite ? 'active' : ''}`} 
        aria-label={`${favorite ? 'Remove' : 'Add'} ${title} ${favorite ? 'from' : 'to'} favorites`} 
        aria-pressed={favorite} 
        onClick={() => onFavorite?.(path)}
      >
        <i className={`${favorite ? 'fa-solid' : 'fa-regular'} fa-star`} aria-hidden="true" />
      </button>
      
      <Link 
        to={path} 
        className="tool-card-link" 
        onClick={() => {
          const recent = JSON.parse(localStorage.getItem('games-recent') || '[]').filter(item => item !== path);
          localStorage.setItem('games-recent', JSON.stringify([path, ...recent].slice(0, 5)));
        }}
      >
        <div className="tool-card-icon">
          <i className={icon}></i>
        </div>
        
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
          <span className="tool-card-category" style={{ margin: 0 }}>{category}</span>
          <span className="tool-card-category" style={{ margin: 0, opacity: 0.6 }}>•</span>
          <span className="tool-card-category" style={{ margin: 0, opacity: 0.8, textTransform: 'none' }}>{difficulty}</span>
        </div>
        
        <h3>{title}</h3>
        <p>{description}</p>
        
        <span className="tool-card-arrow">
          <span style={{ fontSize: '0.8rem', fontWeight: 600, marginRight: '0.4rem', textTransform: 'uppercase' }}>Play Now</span>
          <i className="fa-solid fa-arrow-right"></i>
        </span>
      </Link>
    </article>
  );
}
