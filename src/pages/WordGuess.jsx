import { useState, useEffect, useCallback } from 'react';
import GameHeader from '../components/GameHeader';

const WORDS = [
  'REACT', 'SMART', 'PIXEL', 'GLASS', 'CODES', 'LIGHT', 'BOARD', 
  'MOUSE', 'SOUND', 'PULSE', 'CLONE', 'GAMES', 'STYLE', 'WORLD', 
  'APPLE', 'BEACH', 'CLOUD', 'DREAM', 'EARTH', 'FLAME', 'GRAPE', 
  'HOUSE', 'NIGHT', 'OCEAN', 'PAPER', 'RIVER', 'SNAKE', 'WATER'
];

export default function WordGuess() {
  const [solution, setSolution] = useState('');
  const [guesses, setGuesses] = useState(Array(6).fill(''));
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [streak, setStreak] = useState(() => {
    return parseInt(localStorage.getItem('games-wordguess-streak') || '0', 10);
  });
  const [gameState, setGameState] = useState('lobby'); // 'lobby' or 'playing'

  // Pick a random solution word
  const initGame = useCallback(() => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setSolution(word);
    setGuesses(Array(6).fill(''));
    setCurrentGuess('');
    setCurrentRow(0);
    setGameOver(false);
    setWon(false);
    setGameState('playing');
  }, []);

  const handleKeyPress = useCallback((key) => {
    if (gameOver) return;

    const char = key.toUpperCase();

    if (char === 'ENTER') {
      if (currentGuess.length !== 5) return;
      
      const newGuesses = [...guesses];
      newGuesses[currentRow] = currentGuess;
      setGuesses(newGuesses);

      if (currentGuess === solution) {
        setWon(true);
        setGameOver(true);
        setStreak(prev => {
          const next = prev + 1;
          localStorage.setItem('games-wordguess-streak', next.toString());
          return next;
        });
      } else if (currentRow === 5) {
        setGameOver(true);
        setStreak(0);
        localStorage.setItem('games-wordguess-streak', '0');
      } else {
        setCurrentRow(prev => prev + 1);
        setCurrentGuess('');
      }
    } else if (char === 'BACKSPACE' || char === 'BACK') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(char)) {
      if (currentGuess.length < 5) {
        setCurrentGuess(prev => prev + char);
      }
    }
  }, [currentGuess, currentRow, guesses, solution, gameOver]);

  // Hook physical keyboard
  useEffect(() => {
    const handlePhysicalKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACKSPACE');
      } else {
        handleKeyPress(e.key);
      }
    };
    window.addEventListener('keydown', handlePhysicalKeyDown);
    return () => window.removeEventListener('keydown', handlePhysicalKeyDown);
  }, [handleKeyPress]);

  // Get letter status colors for rows
  const getLetterStatus = (letter, index, guessWord) => {
    if (!solution) return '';
    if (solution[index] === letter) return 'correct';
    if (solution.includes(letter)) {
      // Handle duplicates correctly
      const solutionLetterCount = solution.split(letter).length - 1;
      const guessLetterCountBefore = guessWord.slice(0, index + 1).split(letter).length - 1;
      if (guessLetterCountBefore <= solutionLetterCount) {
        return 'present';
      }
    }
    return 'absent';
  };

  // Get letter status colors for keycap helper
  const getKeyboardKeyStatus = (letter) => {
    let status = '';
    for (let r = 0; r < currentRow; r++) {
      const g = guesses[r];
      for (let i = 0; i < 5; i++) {
        if (g[i] === letter) {
          if (solution[i] === letter) return 'correct';
          if (solution.includes(letter)) status = 'present';
          else if (status !== 'present') status = 'absent';
        }
      }
    }
    return status;
  };

  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
  ];

  if (gameState === 'lobby') {
    return (
      <div className="game-container">
        <div className="game-header">
          <div className="game-title-area">
            <h2>Word Guess</h2>
            <div className="game-meta-tags">
              <span className="meta-tag category">Word</span>
              <span className="meta-tag difficulty">Medium</span>
            </div>
          </div>
        </div>

        <div className="lobby-stack">
          {/* Rules */}
          <div className="info-panel">
            <h3>How to Play</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Guess the hidden 5-letter word in 6 tries. The color of the tiles will change to show how close your guess was to the word:
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              🟩 Green: Letter is in the correct spot.<br />
              🟨 Amber: Letter is in the word but wrong spot.<br />
              ⬜ Dark: Letter is not in the word.
            </p>
          </div>

          {/* Scores */}
          <div className="info-panel" style={{ gap: '1rem', textAlign: 'center' }}>
            <h3 style={{ textAlign: 'left' }}>Performance</h3>
            <div className="snake-stat-box">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current Streak</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-green)' }}>{streak} 🔥</div>
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
      <GameHeader
        onMenu={() => setGameState('lobby')}
        stats={[
          { label: 'Streak', value: <>{streak} 🔥</>, color: 'var(--accent-green)' }
        ]}
        actions={
          <button className="btn btn-secondary" onClick={initGame} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            <i className="fa-solid fa-rotate-right" /> Restart
          </button>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem auto 0', maxWidth: '360px', width: '100%', position: 'relative' }}>
        
        {/* Wordle Grid */}
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(6, 1fr)', gap: '6px', width: '100%', maxWidth: '280px', marginBottom: '1.5rem', position: 'relative' }}>
          {guesses.map((guessWord, rIdx) => {
            const isCurrent = rIdx === currentRow;
            const isSubmitted = rIdx < currentRow;

            return (
              <div key={rIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                {Array(5).fill(null).map((_, cIdx) => {
                  let letter = '';
                  if (isSubmitted) {
                    letter = guessWord[cIdx];
                  } else if (isCurrent) {
                    letter = currentGuess[cIdx] || '';
                  }

                  const status = isSubmitted ? getLetterStatus(letter, cIdx, guessWord) : '';
                  let cellStyle = {
                    aspectRatio: '1',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    display: 'grid',
                    placeContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease'
                  };

                  if (status === 'correct') {
                    cellStyle.background = 'rgba(16, 185, 129, 0.2)';
                    cellStyle.borderColor = 'var(--accent-green)';
                    cellStyle.color = 'var(--accent-green)';
                  } else if (status === 'present') {
                    cellStyle.background = 'rgba(245, 158, 11, 0.2)';
                    cellStyle.borderColor = 'var(--accent-amber)';
                    cellStyle.color = 'var(--accent-amber)';
                  } else if (status === 'absent') {
                    cellStyle.background = 'rgba(255, 255, 255, 0.03)';
                    cellStyle.borderColor = 'rgba(255, 255, 255, 0.1)';
                    cellStyle.color = 'var(--text-secondary)';
                  } else if (letter) {
                    cellStyle.borderColor = 'var(--accent-cyan)';
                  }

                  return (
                    <div key={cIdx} style={cellStyle}>
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Win/Loss overlay */}
          {gameOver && (
            <div className="game-overlay" style={{ borderRadius: 'var(--radius-lg)' }}>
              {won ? (
                <>
                  <i className="fa-solid fa-trophy" style={{ fontSize: '3rem', color: 'var(--accent-green)' }} />
                  <h2 style={{ color: 'var(--accent-green)' }}>Victory!</h2>
                  <p>Streak: {streak} 🔥</p>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-face-frown" style={{ fontSize: '3rem', color: 'var(--accent-red)' }} />
                  <h2 style={{ color: 'var(--accent-red)' }}>Game Over</h2>
                  <p style={{ textAlign: 'center' }}>Solution: <strong>{solution}</strong></p>
                </>
              )}
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

        {/* Virtual Keyboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', padding: '0 0.5rem' }}>
          {keyboardRows.map((row, rIdx) => (
            <div key={rIdx} style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
              {row.map(key => {
                const status = getKeyboardKeyStatus(key);
                const isAction = key === 'ENTER' || key === 'BACK';
                
                let keyStyle = {
                  flex: isAction ? '1.5' : '1',
                  minWidth: isAction ? '45px' : '26px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: isAction ? '0.7rem' : '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'grid',
                  placeContent: 'center',
                  transition: 'all 0.15s ease',
                  userSelect: 'none'
                };

                if (status === 'correct') {
                  keyStyle.background = 'var(--accent-green)';
                  keyStyle.borderColor = 'var(--accent-green)';
                  keyStyle.color = '#fff';
                } else if (status === 'present') {
                  keyStyle.background = 'var(--accent-amber)';
                  keyStyle.borderColor = 'var(--accent-amber)';
                  keyStyle.color = '#fff';
                } else if (status === 'absent') {
                  keyStyle.background = 'rgba(255, 255, 255, 0.04)';
                  keyStyle.borderColor = 'rgba(255, 255, 255, 0.05)';
                  keyStyle.color = 'var(--text-secondary)';
                }

                return (
                  <button 
                    key={key} 
                    style={keyStyle}
                    onClick={() => handleKeyPress(key)}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
