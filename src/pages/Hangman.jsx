import { useState, useEffect, useCallback } from 'react';

const WORDS = [
  'DEVELOPER', 'INTERFACE', 'CODEBASE', 'GRADIENT', 'RESPONSIVE', 
  'WORKSPACE', 'SYNTAX', 'ELEMENT', 'CALLBACK', 'SHADOW', 
  'CREATIVE', 'GRIDCELL', 'VARIABLE', 'FUNCTION', 'DATABASE', 
  'TEMPLATE', 'SECURITY', 'GRAPHICS', 'COMPILER', 'INTERACTIVE'
];

export default function Hangman() {
  const [solution, setSolution] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [errorCount, setErrorCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [streak, setStreak] = useState(() => {
    return parseInt(localStorage.getItem('games-hangman-streak') || '0', 10);
  });

  const initGame = useCallback(() => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setSolution(word);
    setGuessedLetters([]);
    setErrorCount(0);
    setGameOver(false);
    setWon(false);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleGuess = useCallback((letter) => {
    if (guessedLetters.includes(letter) || gameOver) return;

    const nextGuessed = [...guessedLetters, letter];
    setGuessedLetters(nextGuessed);

    if (!solution.includes(letter)) {
      const nextErrors = errorCount + 1;
      setErrorCount(nextErrors);
      if (nextErrors >= 6) {
        setGameOver(true);
        setStreak(0);
        localStorage.setItem('games-hangman-streak', '0');
      }
    } else {
      // Check if all letters of solution are in nextGuessed
      const isWon = solution.split('').every(char => nextGuessed.includes(char));
      if (isWon) {
        setWon(true);
        setGameOver(true);
        setStreak(prev => {
          const next = prev + 1;
          localStorage.setItem('games-hangman-streak', next.toString());
          return next;
        });
      }
    }
  }, [guessedLetters, solution, errorCount, gameOver]);

  // Connect physical keyboard letters
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const char = e.key.toUpperCase();
      if (/^[A-Z]$/.test(char)) {
        handleGuess(char);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGuess]);

  // SVG Drawing segments for Hangman stand & figure
  const renderHangmanSVG = () => {
    const strokeColor = errorCount >= 5 ? 'var(--accent-red)' : 'var(--text-primary)';
    
    return (
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 160 200" 
        style={{
          display: 'block', maxWidth: '160px', margin: '0 auto',
          filter: errorCount > 0 ? 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.1))' : 'none'
        }}
      >
        {/* Gallows Frame (Always visible) */}
        <line x1="10" y1="185" x2="130" y2="185" stroke="var(--border-color)" strokeWidth="4" strokeLinecap="round" />
        <line x1="30" y1="185" x2="30" y2="20" stroke="var(--border-color)" strokeWidth="4" strokeLinecap="round" />
        <line x1="30" y1="20" x2="100" y2="20" stroke="var(--border-color)" strokeWidth="4" strokeLinecap="round" />
        <line x1="100" y1="20" x2="100" y2="45" stroke="var(--border-color)" strokeWidth="2" strokeLinecap="round" />

        {/* Head */}
        {errorCount >= 1 && (
          <circle cx="100" cy="60" r="14" fill="none" stroke={strokeColor} strokeWidth="3" />
        )}
        
        {/* Torso */}
        {errorCount >= 2 && (
          <line x1="100" y1="74" x2="100" y2="125" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Left Arm */}
        {errorCount >= 3 && (
          <line x1="100" y1="90" x2="75" y2="105" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Right Arm */}
        {errorCount >= 4 && (
          <line x1="100" y1="90" x2="125" y2="105" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Left Leg */}
        {errorCount >= 5 && (
          <line x1="100" y1="125" x2="80" y2="165" stroke="var(--accent-red)" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Right Leg */}
        {errorCount >= 6 && (
          <line x1="100" y1="125" x2="120" y2="165" stroke="var(--accent-red)" strokeWidth="3" strokeLinecap="round" />
        )}
      </svg>
    );
  };

  const keyboardKeys = 'QWERTYUIOPASDFGHJKLZXCVBNM'.split('');

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-title-area">
          <h2>SVG Hangman</h2>
          <div className="game-meta-tags">
            <span className="meta-tag category">Word</span>
            <span className="meta-tag difficulty">Medium</span>
          </div>
        </div>
        <div className="game-controls-area">
          <button className="btn btn-primary" onClick={initGame}>
            {gameOver ? 'Play Again' : 'Restart'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', margin: '2rem 0' }}>
        {/* Game Stats & Streak */}
        <div style={{
          flex: '1 1 250px', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.25rem',
          background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Streak Info</h3>
          
          <div className="snake-stat-box" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current Streak</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{streak} 🔥</div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>How to play:</h4>
            <p>1. Type letters using your keyboard or the on-screen keyboard.</p>
            <p>2. Try to fill in the blanks of the secret developer word.</p>
            <p>3. If you make 6 wrong guesses, the hangman is complete!</p>
          </div>
        </div>

        {/* Gallows and Keyboard */}
        <div style={{ flex: '1 1 300px', maxWidth: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
          {/* Hangman Gallows Screen */}
          <div style={{
            width: '100%',
            height: '220px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            position: 'relative'
          }}>
            {renderHangmanSVG()}

            {/* Win/Loss Game Over Screen Overlay */}
            {gameOver && (
              <div className="snake-overlay" style={{ borderRadius: 'var(--radius-lg)' }}>
                {won ? (
                  <>
                    <i className="fa-solid fa-face-smile-wink" style={{ fontSize: '3rem', color: 'var(--accent-green)' }} />
                    <h2 style={{ color: 'var(--accent-green)' }}>You Survived!</h2>
                    <p>Streak increases to {streak}!</p>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-skull-crossbones" style={{ fontSize: '3rem', color: 'var(--accent-red)' }} />
                    <h2 style={{ color: 'var(--accent-red)' }}>Game Over</h2>
                    <p>The secret word was: <strong>{solution}</strong></p>
                  </>
                )}
                <button className="btn btn-primary" onClick={initGame} style={{ marginTop: '0.5rem' }}>
                  Play Again
                </button>
              </div>
            )}
          </div>

          {/* Solution Word Blank Blanks */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            margin: '0.5rem 0',
            width: '100%'
          }}>
            {solution.split('').map((char, idx) => {
              const revealed = guessedLetters.includes(char) || gameOver;
              
              return (
                <div 
                  key={idx}
                  style={{
                    width: '26px',
                    height: '35px',
                    borderBottom: revealed ? 'none' : '3px solid var(--text-secondary)',
                    display: 'grid',
                    placeContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: revealed && !guessedLetters.includes(char) ? 'var(--accent-red)' : 'var(--text-primary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {revealed ? char : ''}
                </div>
              );
            })}
          </div>

          {/* Keyboard Letters selection */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '6px',
            width: '100%',
            padding: '0 0.5rem'
          }}>
            {keyboardKeys.map(key => {
              const isGuessed = guessedLetters.includes(key);
              const isCorrect = isGuessed && solution.includes(key);
              const isIncorrect = isGuessed && !solution.includes(key);

              let keyStyle = {
                width: '32px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'grid',
                placeContent: 'center',
                transition: 'all 0.12s ease',
                userSelect: 'none'
              };

              if (isCorrect) {
                keyStyle.background = 'var(--accent-green)';
                keyStyle.borderColor = 'var(--accent-green)';
                keyStyle.color = '#fff';
                keyStyle.cursor = 'not-allowed';
              } else if (isIncorrect) {
                keyStyle.background = 'rgba(255, 255, 255, 0.03)';
                keyStyle.borderColor = 'rgba(255, 255, 255, 0.05)';
                keyStyle.color = 'var(--text-secondary)';
                keyStyle.cursor = 'not-allowed';
              }

              return (
                <button 
                  key={key} 
                  style={keyStyle}
                  onClick={() => handleGuess(key)}
                  disabled={isGuessed}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
