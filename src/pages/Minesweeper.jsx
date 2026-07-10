import { useState, useEffect, useRef, useCallback } from 'react';
import GameHeader from '../components/GameHeader';

const PRESETS = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 } // Keep hard grid size readable on web screen width (16x30 is standard hard)
};

export default function Minesweeper() {
  const [difficulty, setDifficulty] = useState('easy');
  const { rows, cols, mines } = PRESETS[difficulty];

  const [grid, setGrid] = useState([]);
  const [firstClick, setFirstClick] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [flagMode, setFlagMode] = useState(false); // Mobile flagging toggle
  const [flagCount, setFlagCount] = useState(0);
  const [gameState, setGameState] = useState('lobby'); // 'lobby' or 'playing'

  // Timer
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Initialize board empty
  const initBoard = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSeconds(0);
    setTimerActive(false);
    setFirstClick(true);
    setGameOver(false);
    setWon(false);
    setFlagCount(0);

    const initialGrid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          r,
          c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0
        });
      }
      initialGrid.push(row);
    }
    setGrid(initialGrid);
  }, [rows, cols]);

  // Restart when difficulty changes
  useEffect(() => {
    initBoard();
  }, [difficulty, initBoard]);

  // Timer Effect
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  // Get neighbors of cell
  const getNeighbors = useCallback((r, c) => {
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          neighbors.push({ r: nr, c: nc });
        }
      }
    }
    return neighbors;
  }, [rows, cols]);

  // Place mines (avoiding the first-clicked cell)
  const placeMines = (initialGrid, startR, startC) => {
    const gridCopy = initialGrid.map(row => row.map(cell => ({ ...cell })));
    
    // Put list of valid spots
    const validSpots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Exclude start cell and its immediate neighbors to make first click extremely safe
        const isStart = r === startR && c === startC;
        const isNeighbor = Math.abs(r - startR) <= 1 && Math.abs(c - startC) <= 1;
        if (!isStart && !isNeighbor) {
          validSpots.push({ r, c });
        }
      }
    }

    // Shuffle and pick spots
    let minesPlaced = 0;
    while (minesPlaced < mines && validSpots.length > 0) {
      const idx = Math.floor(Math.random() * validSpots.length);
      const { r, c } = validSpots.splice(idx, 1)[0];
      gridCopy[r][c].isMine = true;
      minesPlaced++;
    }

    // Calculate neighboring mines numbers
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (gridCopy[r][c].isMine) continue;
        const neighbors = getNeighbors(r, c);
        const count = neighbors.filter(({ r: nr, c: nc }) => gridCopy[nr][nc].isMine).length;
        gridCopy[r][c].neighborMines = count;
      }
    }

    return gridCopy;
  };

  // Recursive reveal neighbors if 0 mines nearby
  const revealCell = (gridState, r, c) => {
    if (gridState[r][c].isRevealed || gridState[r][c].isFlagged) return;

    gridState[r][c].isRevealed = true;

    if (gridState[r][c].neighborMines === 0 && !gridState[r][c].isMine) {
      const neighbors = getNeighbors(r, c);
      neighbors.forEach(({ r: nr, c: nc }) => {
        revealCell(gridState, nr, nc);
      });
    }
  };

  // Check win condition
  const checkWin = (gridState) => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!gridState[r][c].isMine && !gridState[r][c].isRevealed) {
          return false;
        }
      }
    }
    return true;
  };

  // Perform Left Click Reveal action
  const handleReveal = (r, c) => {
    if (gameOver || won || grid[r][c].isFlagged || grid[r][c].isRevealed) return;

    let gridCopy = grid.map(row => row.map(cell => ({ ...cell })));

    // First click generates mines
    if (firstClick) {
      setFirstClick(false);
      gridCopy = placeMines(gridCopy, r, c);
      setTimerActive(true);
    }

    // Detonate mine
    if (gridCopy[r][c].isMine) {
      // Game Over
      setGameOver(true);
      setTimerActive(false);
      // Reveal all mines
      for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
        for (let colIdx = 0; colIdx < cols; colIdx++) {
          if (gridCopy[rowIdx][colIdx].isMine) {
            gridCopy[rowIdx][colIdx].isRevealed = true;
          }
        }
      }
      setGrid(gridCopy);
      return;
    }

    revealCell(gridCopy, r, c);

    if (checkWin(gridCopy)) {
      setWon(true);
      setTimerActive(false);
      // Automatically flag remaining mines
      for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
        for (let colIdx = 0; colIdx < cols; colIdx++) {
          if (gridCopy[rowIdx][colIdx].isMine) {
            gridCopy[rowIdx][colIdx].isFlagged = true;
          }
        }
      }
      setFlagCount(mines);
    }

    setGrid(gridCopy);
  };

  // Toggle Flag
  const handleFlag = (e, r, c) => {
    if (e) e.preventDefault(); // Stop default context menus on right-click
    if (gameOver || won || grid[r][c].isRevealed) return;

    const gridCopy = grid.map(row => row.map(cell => ({ ...cell })));
    const currentlyFlagged = gridCopy[r][c].isFlagged;
    
    gridCopy[r][c].isFlagged = !currentlyFlagged;
    setFlagCount(prev => prev + (currentlyFlagged ? -1 : 1));
    setGrid(gridCopy);
  };

  // Master click handler that adapts to Flag Mode toggle (useful on mobile)
  const handleCellClick = (r, c) => {
    if (flagMode) {
      handleFlag(null, r, c);
    } else {
      handleReveal(r, c);
    }
  };

  // Long-press to flag on touch devices (mirrors desktop right-click)
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  const startLongPress = (r, c) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      handleFlag(null, r, c);
      if (navigator.vibrate) navigator.vibrate(15);
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleCellClickGuarded = (r, c) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    handleCellClick(r, c);
  };

  const formatTime = (timeInSecs) => {
    const mins = Math.floor(timeInSecs / 60);
    const secs = timeInSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameState === 'lobby') {
    return (
      <div className="game-container">
        <div className="game-header">
          <div className="game-title-area">
            <h2>Minesweeper</h2>
            <div className="game-meta-tags">
              <span className="meta-tag category">Puzzle</span>
              <span className="meta-tag difficulty">Adaptive</span>
            </div>
          </div>
        </div>

        <div className="lobby-stack">
          {/* Rules */}
          <div className="info-panel">
            <h3>How to Play</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Uncover all safety blocks without triggering any hidden mines. Numbers on revealed blocks show how many mines are adjacent. Plant flags on suspected mine locations!
            </p>
          </div>

          {/* Difficulty Selection */}
          <div className="info-panel" style={{ gap: '0.75rem' }}>
            <h3>Difficulty Preset</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {Object.keys(PRESETS).map(key => (
                <button 
                  key={key}
                  className={`btn ${difficulty === key ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.5rem', textTransform: 'capitalize', fontSize: '0.8rem' }}
                  onClick={() => setDifficulty(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={() => { initBoard(); setGameState('playing'); }} 
            style={{ padding: '1rem', fontSize: '1.1rem', fontWeight: 700 }}
          >
            START PLAYING
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Top Navbar */}
      <GameHeader
        onMenu={() => { setTimerActive(false); setGameState('lobby'); }}
        stats={[
          { label: '💣', value: Math.max(0, mines - flagCount), color: 'var(--accent-red)' },
          { label: '⏱️', value: formatTime(seconds), color: 'var(--accent-pink)' }
        ]}
        actions={
          <button className="btn btn-secondary" onClick={initBoard} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            <i className="fa-solid fa-rotate-right" /> Restart
          </button>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1.5rem auto 0', width: '100%' }}>
        {/* Flag Mode for Mobile (places warning flags on touch tap) */}
        <button 
          className={`btn ${flagMode ? 'btn-primary' : 'btn-secondary'}`}
          style={{ width: '100%', maxWidth: '280px', padding: '0.4rem 1rem', gap: '0.5rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}
          onClick={() => setFlagMode(!flagMode)}
        >
          <i className="fa-solid fa-flag"></i> {flagMode ? 'Mode: Place Flags' : 'Mode: Reveal Tiles'}
        </button>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-1.1rem', marginBottom: '1rem', textAlign: 'center' }}>
          Tip: long-press or right-click a tile to flag it directly.
        </p>

        {/* Minesweeper Grid Board */}
        <div className="minesweeper-wrapper" style={{ overflow: 'auto', maxWidth: '100%' }}>
          <div className="minesweeper-board-outer" style={{ position: 'relative' }}>
            <div
              className="minesweeper-grid"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, '--ms-cols': cols }}
            >
              {grid.map((row) =>
                row.map((cell) => {
                  let cellContent = '';
                  let cellClass = 'minesweeper-cell';

                  if (cell.isRevealed) {
                    if (cell.isMine) {
                      cellClass += ' mine';
                      cellContent = '💣';
                    } else {
                      cellClass += ' revealed';
                      if (cell.neighborMines > 0) {
                        cellClass += ` count-${cell.neighborMines}`;
                        cellContent = cell.neighborMines.toString();
                      }
                    }
                  } else if (cell.isFlagged) {
                    cellClass += ' flagged';
                    cellContent = '🚩';
                  }

                  return (
                    <button
                      key={`${cell.r}-${cell.c}`}
                      className={cellClass}
                      onClick={() => handleCellClickGuarded(cell.r, cell.c)}
                      onContextMenu={(e) => handleFlag(e, cell.r, cell.c)}
                      onTouchStart={() => startLongPress(cell.r, cell.c)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      onTouchCancel={cancelLongPress}
                      aria-label={`Cell at row ${cell.r + 1}, column ${cell.c + 1}${cell.isFlagged ? ', flagged' : ''}${cell.isRevealed ? ', revealed' : ''}`}
                    >
                      {cellContent}
                    </button>
                  );
                })
              )}
            </div>

            {/* Game Over Overlay */}
            {gameOver && (
              <div className="game-overlay" style={{ borderRadius: 'var(--radius-lg)' }}>
                <i className="fa-solid fa-burst" style={{ fontSize: '3rem', color: 'var(--accent-red)', textShadow: '0 0 15px rgba(239, 68, 68, 0.4)' }} />
                <h2 style={{ color: 'var(--accent-red)' }}>Game Over</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Hit a mine after {formatTime(seconds)}.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={initBoard} style={{ flex: 1 }}>
                    Try Again
                  </button>
                  <button className="btn btn-secondary" onClick={() => setGameState('lobby')} style={{ flex: 1 }}>
                    Lobby
                  </button>
                </div>
              </div>
            )}

            {/* Game Won Overlay */}
            {won && (
              <div className="game-overlay" style={{ borderRadius: 'var(--radius-lg)' }}>
                <i className="fa-solid fa-medal" style={{ fontSize: '3rem', color: 'var(--accent-green)', textShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }} />
                <h2 style={{ color: 'var(--accent-green)' }}>Victory Achieved!</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Successfully cleared in <strong>{formatTime(seconds)}</strong>!
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%', marginTop: '1rem' }}>
                  <button className="btn btn-primary" onClick={initBoard} style={{ flex: 1 }}>
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
      </div>
    </div>
  );
}
