import { useState, useEffect, useRef, useCallback } from 'react';

const GAME_DURATION = 30; // seconds
const INITIAL_POP_TIME = 950; // ms

export default function WhackAMole() {
  const [activeMole, setActiveMole] = useState(null); // index 0-8
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
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
        <div className="game-controls-area">
          <button className="btn btn-primary" onClick={initGame}>
            {gameOver ? 'Play Again' : 'Start Game'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', margin: '2rem 0' }}>
        {/* Game Stats */}
        <div style={{
          flex: '1 1 250px', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.25rem',
          background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Game Info</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
            <div className="snake-stat-box">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Score</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{score}</div>
            </div>
            <div className="snake-stat-box">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Time Left</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-pink)' }}>{timeLeft}s</div>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Rules:</h4>
            <p>1. Tap the **Mole (🐹)** as soon as it pops out of a hole.</p>
            <p>2. Whacking a mole increases score and accelerates game speed.</p>
            <p>3. Clicking an empty hole deducts **1 point** from your score!</p>
            <p>4. Hit as many as you can before the **30s timer** runs out.</p>
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: 'auto' }}>
            🏆 High Score: <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{highScore}</span>
          </div>
        </div>

        {/* 3x3 Mole Holes Grid */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
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
            padding: '12px'
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
            {!gameStarted && (
              <div className="snake-overlay" style={{ borderRadius: 'var(--radius-lg)' }}>
                <i className="fa-solid fa-hammer" style={{ fontSize: '3rem', color: 'var(--accent-amber)' }} />
                <h2>Whack-A-Mole</h2>
                <button className="btn btn-primary" onClick={initGame}>
                  Start Game
                </button>
              </div>
            )}

            {gameOver && (
              <div className="snake-overlay" style={{ borderRadius: 'var(--radius-lg)' }}>
                <i className="fa-solid fa-hourglass-end" style={{ fontSize: '3rem', color: 'var(--accent-red)' }} />
                <h2 style={{ color: 'var(--accent-red)' }}>Time's Up!</h2>
                <p>Final Score: <strong>{score} hits</strong></p>
                <button className="btn btn-primary" onClick={initGame}>
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
