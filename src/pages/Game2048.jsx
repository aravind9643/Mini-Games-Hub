import { useState, useEffect, useRef, useCallback } from 'react';

export default function Game2048() {
  const [board, setBoard] = useState(() => createEmptyBoard());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('games-2048-highscore') || '0', 10);
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [continuePlaying, setContinuePlaying] = useState(false);
  const [mergedCells, setMergedCells] = useState([]);
  const [spawnedCell, setSpawnedCell] = useState(null);
  const [moveCount, setMoveCount] = useState(0);
  const [moveDirection, setMoveDirection] = useState(null);

  // Swipe gesture detection refs
  const touchStart = useRef({ x: 0, y: 0 });

  function createEmptyBoard() {
    return Array(4).fill(null).map(() => Array(4).fill(0));
  }

  // Check if board has changed
  const boardsAreEqual = (boardA, boardB) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (boardA[r][c] !== boardB[r][c]) return false;
      }
    }
    return true;
  };

  // Check if any moves are available
  const canMove = useCallback((currentBoard) => {
    // Check for empty spaces
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) return true;
      }
    }
    // Check for adjacent merges (horizontal)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        if (currentBoard[r][c] === currentBoard[r][c + 1]) return true;
      }
    }
    // Check for adjacent merges (vertical)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === currentBoard[r + 1][c]) return true;
      }
    }
    return false;
  }, []);

  // Place a random tile (2 or 4) on an empty spot
  const addRandomTile = useCallback((currentBoard) => {
    const emptySpots = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) {
          emptySpots.push({ r, c });
        }
      }
    }
    if (emptySpots.length === 0) return { board: currentBoard, coord: null };

    const { r, c } = emptySpots[Math.floor(Math.random() * emptySpots.length)];
    const newBoard = currentBoard.map(row => [...row]);
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    return { board: newBoard, coord: { r, c } };
  }, []);

  // Initialize Game with two tiles
  const initGame = useCallback(() => {
    let newBoard = createEmptyBoard();
    const firstTile = addRandomTile(newBoard);
    const secondTile = addRandomTile(firstTile.board);
    setBoard(secondTile.board);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setContinuePlaying(false);
    setMergedCells([]);
    setSpawnedCell(secondTile.coord ? `${secondTile.coord.r}-${secondTile.coord.c}` : null);
    setMoveCount(0);
    setMoveDirection(null);
  }, [addRandomTile]);

  // Run on mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Core Merging logic for single row (Left slide)
  const slideAndMergeRowLeft = (row, scoreIncrementRef) => {
    // 1. Remove zeros
    let filtered = row.filter(val => val !== 0);
    
    // 2. Merge values
    let merged = [];
    let mergedIndices = [];
    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const sum = filtered[i] * 2;
        merged.push(sum);
        scoreIncrementRef.current += sum;
        mergedIndices.push(merged.length - 1);
        i += 2;
      } else {
        merged.push(filtered[i]);
        i++;
      }
    }
    
    // 3. Pad with zeros
    while (merged.length < 4) {
      merged.push(0);
    }
    return { row: merged, mergedIndices };
  };

  // Perform board slide
  const performMove = useCallback((directionStr) => {
    if (gameOver || (won && !continuePlaying)) return;

    let scoreIncrement = { current: 0 };
    let tempBoard = board.map(row => [...row]);
    let newBoard = createEmptyBoard();
    let localMerged = [];

    if (directionStr === 'left') {
      for (let r = 0; r < 4; r++) {
        const { row, mergedIndices } = slideAndMergeRowLeft(tempBoard[r], scoreIncrement);
        newBoard[r] = row;
        mergedIndices.forEach(c => {
          localMerged.push(`${r}-${c}`);
        });
      }
    } else if (directionStr === 'right') {
      for (let r = 0; r < 4; r++) {
        const reversed = [...tempBoard[r]].reverse();
        const { row, mergedIndices } = slideAndMergeRowLeft(reversed, scoreIncrement);
        newBoard[r] = [...row].reverse();
        mergedIndices.forEach(c => {
          localMerged.push(`${r}-${3 - c}`);
        });
      }
    } else if (directionStr === 'up') {
      // Transpose
      for (let c = 0; c < 4; c++) {
        const col = [tempBoard[0][c], tempBoard[1][c], tempBoard[2][c], tempBoard[3][c]];
        const { row, mergedIndices } = slideAndMergeRowLeft(col, scoreIncrement);
        for (let r = 0; r < 4; r++) {
          newBoard[r][c] = row[r];
        }
        mergedIndices.forEach(r => {
          localMerged.push(`${r}-${c}`);
        });
      }
    } else if (directionStr === 'down') {
      // Transpose & Reverse
      for (let c = 0; c < 4; c++) {
        const col = [tempBoard[0][c], tempBoard[1][c], tempBoard[2][c], tempBoard[3][c]].reverse();
        const { row, mergedIndices } = slideAndMergeRowLeft(col, scoreIncrement);
        const unreversed = [...row].reverse();
        for (let r = 0; r < 4; r++) {
          newBoard[r][c] = unreversed[r];
        }
        mergedIndices.forEach(r => {
          localMerged.push(`${3 - r}-${c}`);
        });
      }
    }

    // Only process if board actually changed
    if (!boardsAreEqual(board, newBoard)) {
      const { board: nextBoard, coord } = addRandomTile(newBoard);
      setBoard(nextBoard);
      setMergedCells(localMerged);
      setSpawnedCell(coord ? `${coord.r}-${coord.c}` : null);
      setMoveCount(prev => prev + 1);
      setMoveDirection(directionStr);
      
      const newScore = score + scoreIncrement.current;
      setScore(newScore);
      
      // Update highscore
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('games-2048-highscore', newScore.toString());
      }

      // Check if won
      if (!won && !continuePlaying) {
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (nextBoard[r][c] === 2048) {
              setWon(true);
            }
          }
        }
      }

      // Check if Game Over
      if (!canMove(nextBoard)) {
        setGameOver(true);
      }
    }
  }, [board, score, highScore, won, continuePlaying, gameOver, addRandomTile, canMove]);

  // Keyboard hooks
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          performMove('up');
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          performMove('down');
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          performMove('left');
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          performMove('right');
          e.preventDefault();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performMove]);

  // Touch handlers for swipes on grid container
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e) => {
    if (e.changedTouches.length !== 1) return;
    const diffX = e.changedTouches[0].clientX - touchStart.current.x;
    const diffY = e.changedTouches[0].clientY - touchStart.current.y;

    // Minimum swipe threshold (50px)
    const threshold = 50;
    if (Math.abs(diffX) < threshold && Math.abs(diffY) < threshold) return;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX > 0) {
        performMove('right');
      } else {
        performMove('left');
      }
    } else {
      // Vertical swipe
      if (diffY > 0) {
        performMove('down');
      } else {
        performMove('up');
      }
    }
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-title-area">
          <h2>2048 Puzzle</h2>
          <div className="game-meta-tags">
            <span className="meta-tag category">Puzzle</span>
            <span className="meta-tag difficulty">Medium</span>
          </div>
        </div>
        <div className="game-controls-area">
          <button className="btn btn-primary" onClick={initGame}>
            Restart Game
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', margin: '2rem 0' }}>
        {/* Stats & Controls Info */}
        <div style={{
          flex: '1 1 300px', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '1.25rem',
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
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>High Score</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)' }}>{highScore}</div>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Instructions:</h4>
            <p>⌨️ Use **Arrow Keys** or **WASD** to slide blocks.</p>
            <p>📱 On mobile, **Swipe** inside the grid in any direction.</p>
            <p>🔄 Merge matching numbers to reach the **2048 tile**!</p>
          </div>

          {/* Direction Buttons for backup/accessibility */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ width: '45px', height: '45px', display: 'grid', placeContent: 'center' }} onClick={() => performMove('up')} aria-label="Slide Up">
              <i className="fa-solid fa-arrow-up" />
            </button>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" style={{ width: '45px', height: '45px', display: 'grid', placeContent: 'center' }} onClick={() => performMove('left')} aria-label="Slide Left">
                <i className="fa-solid fa-arrow-left" />
              </button>
              <div style={{ width: '45px' }}></div>
              <button className="btn btn-secondary" style={{ width: '45px', height: '45px', display: 'grid', placeContent: 'center' }} onClick={() => performMove('right')} aria-label="Slide Right">
                <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
            <button className="btn btn-secondary" style={{ width: '45px', height: '45px', display: 'grid', placeContent: 'center' }} onClick={() => performMove('down')} aria-label="Slide Down">
              <i className="fa-solid fa-arrow-down" />
            </button>
          </div>
        </div>

        {/* 2048 Board */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div 
            className="game2048-container"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="game2048-grid" style={{ position: 'relative' }}>
              {board.flatMap((row, r) =>
                row.map((cell, c) => {
                  const key = `${r}-${c}`;
                  const isMerged = mergedCells.includes(key);
                  const isSpawned = spawnedCell === key;
                  const tileClass = `game2048-cell ${cell ? `tile-${cell} val-${cell} ${moveDirection ? `slide-${moveDirection}` : ''}` : ''} ${isMerged ? 'tile-merged' : ''} ${isSpawned ? 'tile-spawned' : ''}`;
                  return (
                    <div key={`${key}-${moveCount}`} className={tileClass}>
                      {cell > 0 ? cell : ''}
                    </div>
                  );
                })
              )}

              {/* Game Over Overlay */}
              {gameOver && (
                <div className="snake-overlay">
                  <h3>Game Over!</h3>
                  <p>Final Score: {score}</p>
                  <button className="btn btn-primary" onClick={initGame}>
                    Try Again
                  </button>
                </div>
              )}

              {/* Game Won Overlay */}
              {won && !continuePlaying && (
                <div className="snake-overlay">
                  <h3 style={{ color: 'var(--accent-green)', textShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}>You Reached 2048!</h3>
                  <p>Incredible achievement! Keep pushing your boundaries.</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" onClick={() => setContinuePlaying(true)}>
                      Continue Playing
                    </button>
                    <button className="btn btn-secondary" onClick={initGame}>
                      Restart
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
