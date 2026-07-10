import { useState, useEffect, useRef, useCallback } from 'react';

// Themes with 8 pairs of icons
const THEMES = {
  emojis: ['🎮', '🎲', '🎯', '🚀', '💎', '🍕', '🎈', '🐱'],
  dev: ['💻', '⚙️', '🛡️', '📡', '🔌', '📦', '💾', '🔋'],
  fruits: ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🍊', '🍉']
};

export default function MemoryMatch() {
  const [theme, setTheme] = useState('emojis');
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]); // Array of flipped card indexes
  const [matched, setMatched] = useState([]); // Array of matched card indexes
  const [moves, setMoves] = useState(0);
  const [bestMoves, setBestMoves] = useState(() => {
    return parseInt(localStorage.getItem('games-memory-bestmoves') || '999', 10);
  });
  
  // Game timer states
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);
  const [gameState, setGameState] = useState('lobby'); // 'lobby' or 'playing'

  // Initialize Board
  const initGame = useCallback(() => {
    // Stop and reset timer
    if (timerRef.current) clearInterval(timerRef.current);
    setSeconds(0);
    setTimerActive(false);

    // Get 8 icons and duplicate to create pairs
    const icons = THEMES[theme];
    const deck = [...icons, ...icons]
      .map((icon, idx) => ({
        id: idx,
        icon,
        isFlipped: false,
        isMatched: false
      }));

    // Shuffle the deck (Fisher-Yates)
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameState('playing');
  }, [theme]);

  // Timer Effect
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  // Handle Card Click
  const handleCardClick = (idx) => {
    // Ignore clicks if card is already flipped, matched, or if 2 cards are currently facing up
    if (flipped.includes(idx) || matched.includes(idx) || flipped.length >= 2) return;

    // Start timer on first move
    if (!timerActive && moves === 0 && flipped.length === 0) {
      setTimerActive(true);
    }

    const nextFlipped = [...flipped, idx];
    setFlipped(nextFlipped);

    // If we have 2 cards flipped, evaluate them
    if (nextFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstIdx, secondIdx] = nextFlipped;

      if (cards[firstIdx].icon === cards[secondIdx].icon) {
        // Matched!
        const nextMatched = [...matched, firstIdx, secondIdx];
        setMatched(nextMatched);
        setFlipped([]);

        // Check for Win
        if (nextMatched.length === cards.length) {
          setTimerActive(false);
          const currentBest = parseInt(localStorage.getItem('games-memory-bestmoves') || '999', 10);
          const currentMoves = moves + 1; // since state updates after this render
          if (currentMoves < currentBest) {
            setBestMoves(currentMoves);
            localStorage.setItem('games-memory-bestmoves', currentMoves.toString());
          }
        }
      } else {
        // Flops back after 800ms
        setTimeout(() => {
          setFlipped([]);
        }, 800);
      }
    }
  };

  // Format time display
  const formatTime = (timeInSecs) => {
    const mins = Math.floor(timeInSecs / 60);
    const secs = timeInSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isGameWon = matched.length === cards.length && cards.length > 0;

  if (gameState === 'lobby') {
    return (
      <div className="game-container">
        <div className="game-header">
          <div className="game-title-area">
            <h2>Memory Match</h2>
            <div className="game-meta-tags">
              <span className="meta-tag category">Card</span>
              <span className="meta-tag difficulty">Easy</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '400px', margin: '2rem auto 0', width: '100%' }}>
          {/* Rules */}
          <div style={{
            background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'
          }}>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>How to Play</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Tap or click cards to flip them over. Find matching pairs of icons across the board in as few moves as possible. Speed matters too!
            </p>
          </div>

          {/* Theme Setup */}
          <div style={{
            background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'
          }}>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Select Theme</h3>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className={`btn ${theme === 'emojis' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                  onClick={() => setTheme('emojis')}
                >
                  Retro Emojis
                </button>
                <button 
                  className={`btn ${theme === 'dev' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                  onClick={() => setTheme('dev')}
                >
                  Dev Gear
                </button>
                <button 
                  className={`btn ${theme === 'fruits' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                  onClick={() => setTheme('fruits')}
                >
                  Fruits
                </button>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div style={{
            background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', textAlign: 'left' }}>Performance</h3>
            <div className="snake-stat-box">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Best Moves</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-green)' }}>
                {bestMoves === 999 ? 'No attempts' : `${bestMoves} moves`}
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={initGame} style={{ padding: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>
            START PLAYING
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Top Navbar */}
      <div className="game-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button className="btn btn-secondary" onClick={() => { setTimerActive(false); setGameState('lobby'); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <i className="fa-solid fa-arrow-left" /> Menu
        </button>
        
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Moves: <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{moves}</span>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Time: <span style={{ fontWeight: 800, color: 'var(--accent-pink)' }}>{formatTime(seconds)}</span>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={initGame} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <i className="fa-solid fa-rotate-right" /> Restart
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem auto 0', maxWidth: '360px', width: '100%', position: 'relative' }}>
        
        {/* Card Grid Board */}
        <div className="memory-board">
          {cards.map((card, idx) => {
            const isFlipped = flipped.includes(idx);
            const isMatched = matched.includes(idx);
            const cardClass = `memory-card ${isFlipped || isMatched ? 'flipped' : ''}`;
            const matchedClass = `memory-card-front ${isMatched ? 'matched' : ''}`;

            return (
              <div 
                key={card.id} 
                className={cardClass} 
                onClick={() => handleCardClick(idx)}
              >
                <div className="memory-card-inner">
                  <div className={matchedClass}>
                    <span style={{ fontSize: '2rem' }}>{card.icon}</span>
                  </div>
                  <div className="memory-card-back">
                    <i className="fa-solid fa-circle-question"></i>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Win Screen Overlay */}
        {isGameWon && (
          <div className="snake-overlay" style={{ borderRadius: 'var(--radius-lg)' }}>
            <i className="fa-solid fa-trophy" style={{ fontSize: '3rem', color: 'var(--accent-amber)', textShadow: '0 0 15px rgba(245, 158, 11, 0.4)' }} />
            <h2 style={{ color: 'var(--text-primary)' }}>Congratulations!</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              Matched in <strong>{moves} moves</strong> and <strong>{formatTime(seconds)}</strong>!
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={initGame} style={{ flex: 1 }}>
                Play Again
              </button>
              <button className="btn btn-secondary" onClick={() => setGameState('lobby')} style={{ flex: 1 }}>
                Lobby
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
