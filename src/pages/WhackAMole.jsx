import { useState, useEffect, useRef, useCallback } from 'react';

const GAME_DURATION = 30; // seconds
const INITIAL_POP_TIME = 950; // ms

export default function WhackAMole() {
  const [activeMole, setActiveMole] = useState(null); // index 0-8
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameState, setGameState] = useState('lobby'); // 'lobby' or 'playing'
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('games-whackamole-highscore') || '0', 10);
  });

  const timerRef = useRef(null);
  const moleTimerRef = useRef(null);
  const gameEndTimeRef = useRef(0);

  // Pick a random grid index that is different from current
  const getRandomHole = useCallback((currentHole) => {
    let nextHole;
    do {
      nextHole = Math.floor(Math.random() * 9);
    } while (nextHole === currentHole);
    return nextHole;
  }, []);

  // Tick the mole position
  const molePopLoop = useCallback(() => {
    if (Date.now() >= gameEndTimeRef.current) return;

    setActiveMole(prev => {
      const nextHole = getRandomHole(prev);
      
      // Calculate speed scaling based on current score
      const popTime = Math.max(450, INITIAL_POP_TIME - score * 20);
      
      if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
      moleTimerRef.current = setTimeout(molePopLoop, popTime);
      
      return nextHole;
    });
  }, [getRandomHole, score]);

  // Start the game
  const initGame = () => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameOver(false);
    setGameStarted(true);
    setActiveMole(Math.floor(Math.random() * 9));
    
    gameEndTimeRef.current = Date.now() + GAME_DURATION * 1000;

    // Game Timer Countdown
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((gameEndTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setGameOver(true);
        setActiveMole(null);
      }
    }, 200);

    // Mole spawn tick
    if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    const popTime = INITIAL_POP_TIME;
    moleTimerRef.current = setTimeout(molePopLoop, popTime);
    setGameState('playing');
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    };
  }, []);

  // Click mole handler
  const handleHoleClick = (index) => {
    if (!gameStarted || gameOver) return;

    if (index === activeMole) {
      // Hit!
      const nextScore = score + 1;
      setScore(nextScore);
      if (nextScore > highScore) {
        setHighScore(nextScore);
        localStorage.setItem('games-whackamole-highscore', nextScore.toString());
      }
      
      // Instantly trigger new mole
      if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
      molePopLoop();
    } else {
      // Miss penalty
      setScore(prev => Math.max(0, prev - 1));
    }
  };

  if (gameState === 'lobby') {
    return (
      <div className="game-container">
        <div className="game-header">
          <div className="game-title-area">
            <h2>Whack-A-Mole</h2>
            <div className="game-meta-tags">
              <span className="meta-tag category">Arcade</span>
              <span className="meta-tag difficulty">Easy</span>
            </div>
          </div>
        </div>

        <div className="lobby-stack">
          {/* Rules */}
          <div className="info-panel">
            <h3>How to Play</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Tap the Mole (🐹) as soon as it pops out of a hole. Whacking a mole increases score and accelerates game speed. Be careful: hitting an empty hole will subtract 1 point! Hit as many as you can within 30 seconds.
            </p>
          </div>

          {/* Scores */}
          <div className="info-panel" style={{ gap: '1rem', textAlign: 'center' }}>
            <h3 style={{ textAlign: 'left' }}>Performance</h3>
            <div className="snake-stat-box">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Best Score</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-green)' }}>{highScore} hits</div>
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
        <button 
          className="btn btn-secondary" 
          onClick={() => { 
            if (timerRef.current) clearInterval(timerRef.current);
            if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
            setGameStarted(false); 
            setGameState('lobby'); 
          }} 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
        >
          <i className="fa-solid fa-arrow-left" /> Menu
        </button>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Hits: <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{score}</span>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Time: <span style={{ fontWeight: 800, color: 'var(--accent-pink)' }}>{timeLeft}s</span>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={initGame} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <i className="fa-solid fa-rotate-right" /> Restart
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem auto 0', maxWidth: '360px', width: '100%', position: 'relative' }}>
        
        {/* 3x3 Mole Holes Grid */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '320px',
          aspectRatio: '1',
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: '12px',
          padding: '12px',
          overflow: 'hidden'
        }}>
          {Array(9).fill(null).map((_, idx) => {
            const isMole = idx === activeMole;
            
            let holeStyle = {
              aspectRatio: '1',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '3px solid var(--border-color)',
              cursor: !gameStarted || gameOver ? 'not-allowed' : 'pointer',
              display: 'grid',
              placeContent: 'center',
              fontSize: '2.5rem',
              userSelect: 'none',
              transition: 'all 0.1s ease-in-out',
              position: 'relative',
              overflow: 'hidden'
            };

            if (isMole) {
              holeStyle.borderColor = 'var(--accent-amber)';
              holeStyle.background = 'rgba(245, 158, 11, 0.05)';
              holeStyle.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4), inset 0 0 10px rgba(245, 158, 11, 0.2)';
            }

            return (
              <div 
                key={idx} 
                style={holeStyle}
                onClick={() => handleHoleClick(idx)}
              >
                <span style={{
                  transform: isMole ? 'translateY(0)' : 'translateY(50px)',
                  opacity: isMole ? 1 : 0,
                  transition: 'all 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}>
                  🐹
                </span>
              </div>
            );
          })}

          {/* Overlays */}
          {gameOver && (
            <div className="snake-overlay" style={{ borderRadius: 'var(--radius-lg)' }}>
              <i className="fa-solid fa-hourglass-end" style={{ fontSize: '3rem', color: 'var(--accent-red)' }} />
              <h2 style={{ color: 'var(--accent-red)' }}>Time's Up!</h2>
              <p>Final Score: <strong>{score} hits</strong></p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn btn-primary" onClick={initGame}>
                  Play Again
                </button>
                <button className="btn btn-secondary" onClick={() => { setGameStarted(false); setGameState('lobby'); }}>
                  Lobby
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
