import { useState, useEffect, useRef, useCallback } from 'react';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 22; // px

const SHAPES = {
  I: { matrix: [[1, 1, 1, 1]], color: '#0ea5e9', shadow: 'rgba(14, 165, 233, 0.7)' },
  J: { matrix: [[1, 0, 0], [1, 1, 1]], color: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.7)' },
  L: { matrix: [[0, 0, 1], [1, 1, 1]], color: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.7)' },
  O: { matrix: [[1, 1], [1, 1]], color: '#eab308', shadow: 'rgba(234, 179, 8, 0.7)' },
  S: { matrix: [[0, 1, 1], [1, 1, 0]], color: '#10b981', shadow: 'rgba(16, 185, 129, 0.7)' },
  T: { matrix: [[0, 1, 0], [1, 1, 1]], color: '#a855f7', shadow: 'rgba(168, 85, 247, 0.7)' },
  Z: { matrix: [[1, 1, 0], [0, 1, 1]], color: '#ef4444', shadow: 'rgba(239, 68, 68, 0.7)' }
};

const SHAPE_KEYS = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

export default function Tetris() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [nextPiece, setNextPiece] = useState('I');
  const [gameState, setGameState] = useState('lobby'); // 'lobby' or 'playing'
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('games-tetris-highscore') || '0', 10);
  });

  // Mutable game state refs for physics ticks
  const grid = useRef(Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
  const gridColors = useRef(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
  
  const currentPiece = useRef({
    shape: 'I',
    matrix: [],
    x: 0,
    y: 0
  });

  const nextPieceRef = useRef('I');
  const lastTick = useRef(0);
  const frameId = useRef(null);

  // Spawns a random piece
  const spawnPiece = useCallback((shapeKey = null) => {
    const key = shapeKey || nextPieceRef.current;
    
    // Pick next preview piece
    const nextKey = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
    nextPieceRef.current = nextKey;
    setNextPiece(nextKey);

    const piece = SHAPES[key];
    currentPiece.current = {
      shape: key,
      matrix: piece.matrix.map(row => [...row]),
      x: Math.floor((COLS - piece.matrix[0].length) / 2),
      y: 0
    };

    // Check game over on spawn collision
    if (checkCollision(currentPiece.current.x, currentPiece.current.y, currentPiece.current.matrix)) {
      setGameOver(true);
    }
  }, []);

  const initGame = () => {
    grid.current = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    gridColors.current = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
    
    // Set two pieces
    const firstKey = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
    const secondKey = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
    nextPieceRef.current = secondKey;
    setNextPiece(secondKey);

    spawnPiece(firstKey);
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setGameStarted(true);
    setIsPaused(false);
    lastTick.current = Date.now();
    setGameState('playing');
  };

  // Collision checking helper
  const checkCollision = (ax, ay, matrix) => {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const nextX = ax + c;
          const nextY = ay + r;

          // Out of bounds
          if (nextX < 0 || nextX >= COLS || nextY >= ROWS) {
            return true;
          }

          // Collided with stacked cells
          if (nextY >= 0 && grid.current[nextY][nextX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Stack piece into static board
  const mergePiece = () => {
    const { matrix, x, y, shape } = currentPiece.current;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          if (y + r >= 0) {
            grid.current[y + r][x + c] = 1;
            gridColors.current[y + r][x + c] = shape;
          }
        }
      }
    }
  };

  // Clear completed rows
  const clearRows = () => {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      const isFull = grid.current[r].every(cell => cell !== 0);
      if (isFull) {
        // Remove row and pad top
        grid.current.splice(r, 1);
        gridColors.current.splice(r, 1);
        
        grid.current.unshift(Array(COLS).fill(0));
        gridColors.current.unshift(Array(COLS).fill(null));
        cleared++;
        r++; // Check same row index again after shift
      }
    }

    if (cleared > 0) {
      const rowScores = [0, 100, 300, 500, 800];
      const points = rowScores[cleared] * level;
      setScore(prev => {
        const next = prev + points;
        if (next > highScore) {
          setHighScore(next);
          localStorage.setItem('games-tetris-highscore', next.toString());
        }
        return next;
      });

      setLines(prev => {
        const nextLines = prev + cleared;
        const nextLevel = Math.floor(nextLines / 10) + 1;
        setLevel(nextLevel);
        return nextLines;
      });
    }
  };

  // Move controls
  const moveLeft = () => {
    const { x, y, matrix } = currentPiece.current;
    if (!checkCollision(x - 1, y, matrix)) {
      currentPiece.current.x -= 1;
    }
  };

  const moveRight = () => {
    const { x, y, matrix } = currentPiece.current;
    if (!checkCollision(x + 1, y, matrix)) {
      currentPiece.current.x += 1;
    }
  };

  const rotatePiece = () => {
    const { matrix } = currentPiece.current;
    const rotated = matrix[0].map((_, cIdx) => matrix.map(row => row[cIdx]).reverse());
    
    const { x, y } = currentPiece.current;
    if (!checkCollision(x, y, rotated)) {
      currentPiece.current.matrix = rotated;
    } else {
      // Wall kick (try pushing left/right)
      if (!checkCollision(x - 1, y, rotated)) {
        currentPiece.current.x -= 1;
        currentPiece.current.matrix = rotated;
      } else if (!checkCollision(x + 1, y, rotated)) {
        currentPiece.current.x += 1;
        currentPiece.current.matrix = rotated;
      }
    }
  };

  const softDrop = useCallback(() => {
    const { x, y, matrix } = currentPiece.current;
    if (!checkCollision(x, y + 1, matrix)) {
      currentPiece.current.y += 1;
      return true;
    } else {
      mergePiece();
      clearRows();
      spawnPiece();
      return false;
    }
  }, [spawnPiece]);

  const hardDrop = () => {
    while (softDrop()) {
      // Drop until stack
    }
  };

  // Physical keyboard hook
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted || gameOver || isPaused) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          moveLeft();
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          moveRight();
          e.preventDefault();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          rotatePiece();
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          softDrop();
          e.preventDefault();
          break;
        case ' ':
          hardDrop();
          e.preventDefault();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, isPaused, softDrop]);

  // Main rendering loop
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas._dpr || 1, canvas._dpr || 1);

    // Game speed tick interval (speeds up as level increases)
    const tickInterval = Math.max(100, 800 - (level - 1) * 80);

    const draw = () => {
      // Clear
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);

      // Draw Grid Lines (subtle)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * BLOCK_SIZE, 0);
        ctx.lineTo(c * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, r * BLOCK_SIZE);
        ctx.stroke();
      }

      // Draw stack grid blocks
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cellShape = gridColors.current[r][c];
          if (cellShape) {
            const pieceDef = SHAPES[cellShape];
            ctx.fillStyle = pieceDef.color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = pieceDef.shadow;
            ctx.beginPath();
            ctx.roundRect(c * BLOCK_SIZE + 1, r * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2, 3);
            ctx.fill();
          }
        }
      }

      // Draw active falling piece
      const { matrix, x, y, shape } = currentPiece.current;
      const pieceDef = SHAPES[shape];
      ctx.fillStyle = pieceDef.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = pieceDef.shadow;

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0) {
            ctx.beginPath();
            ctx.roundRect((x + c) * BLOCK_SIZE + 1, (y + r) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2, 3);
            ctx.fill();
          }
        }
      }

      ctx.shadowBlur = 0; // Reset
    };

    const loop = () => {
      const now = Date.now();
      const delta = now - lastTick.current;

      if (delta >= tickInterval) {
        softDrop();
        lastTick.current = now;
      }

      draw();
      frameId.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (frameId.current) cancelAnimationFrame(frameId.current);
    };
  }, [gameStarted, gameOver, isPaused, level, softDrop]);

  // Initial canvas draw + DPI-aware backing store sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas._dpr = dpr;
    canvas.width = COLS * BLOCK_SIZE * dpr;
    canvas.height = ROWS * BLOCK_SIZE * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);
  }, []);

  if (gameState === 'lobby') {
    return (
      <div className="game-container">
        <div className="game-header">
          <div className="game-title-area">
            <h2>Tetris Classic</h2>
            <div className="game-meta-tags">
              <span className="meta-tag category">Puzzle</span>
              <span className="meta-tag difficulty">Hard</span>
            </div>
          </div>
        </div>

        <div className="lobby-stack">
          {/* Rules */}
          <div className="info-panel">
            <h3>How to Play</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Use your keyboard Arrow keys or the mobile D-pad controls to move (Left/Right), soft-drop (Down), and rotate (Up/Rotate) falling shapes. Complete solid rows horizontally to clear them and score points!
            </p>
          </div>

          {/* Scores */}
          <div className="info-panel" style={{ gap: '1rem', textAlign: 'center' }}>
            <h3 style={{ textAlign: 'left' }}>Performance</h3>
            <div className="snake-stat-box">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Best Score</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-green)' }}>{highScore} pts</div>
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
            if (frameId.current) cancelAnimationFrame(frameId.current);
            setGameStarted(false); 
            setGameState('lobby'); 
          }} 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
        >
          <i className="fa-solid fa-arrow-left" /> Menu
        </button>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>S:{score}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-green)' }}>L:{lines}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-amber)' }}>Lv:{level}</span>
        </div>

        {gameStarted && !gameOver && (
          <button className="btn btn-secondary" onClick={() => setIsPaused(!isPaused)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            <i className={isPaused ? "fa-solid fa-play" : "fa-solid fa-pause"}></i> {isPaused ? 'Resume' : 'Pause'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1.5rem auto 0', maxWidth: '360px', width: '100%', position: 'relative' }}>
        
        {/* Next Piece Preview */}
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
          padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '240px', justifyContent: 'center', marginBottom: '1rem'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Next:</span>
          <div style={{ width: '40px', height: '24px', display: 'grid', placeContent: 'center', position: 'relative' }}>
            {gameStarted && !gameOver && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {SHAPES[nextPiece].matrix.map((row, r) => (
                  <div key={r} style={{ display: 'flex', gap: '2px' }}>
                    {row.map((cell, c) => (
                      <div 
                        key={c}
                        style={{
                          width: '8px',
                          height: '8px',
                          background: cell !== 0 ? SHAPES[nextPiece].color : 'transparent',
                          borderRadius: '1px',
                          boxShadow: cell !== 0 ? `0 0 4px ${SHAPES[nextPiece].shadow}` : 'none'
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Board Canvas Screen */}
        <div
          className="tetris-canvas-container"
          style={{ '--tetris-aspect': `${COLS * BLOCK_SIZE} / ${ROWS * BLOCK_SIZE}`, position: 'relative', marginBottom: '1.5rem' }}
        >
          <canvas ref={canvasRef} />

          {/* Overlays */}
          {isPaused && gameStarted && (
            <div className="snake-overlay">
              <i className="fa-solid fa-pause" style={{ fontSize: '3rem', color: 'var(--accent-cyan)' }}></i>
              <h2>Game Paused</h2>
              <button className="btn btn-primary" onClick={() => setIsPaused(false)}>
                Resume Game
              </button>
            </div>
          )}

          {gameOver && (
            <div className="snake-overlay">
              <h3 style={{ color: 'var(--accent-red)' }}>Game Over</h3>
              <p>Score: {score}</p>
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

        {/* Mobile controls layout */}
        {gameStarted && !gameOver && !isPaused && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.5rem',
            flexWrap: 'wrap',
            width: '100%',
            maxWidth: '300px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', gap: '0.4rem', width: '100%', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={moveLeft} aria-label="Left" style={{ flex: 1, height: '42px' }}>
                <i className="fa-solid fa-arrow-left" />
              </button>
              <button className="btn btn-secondary" onClick={rotatePiece} aria-label="Rotate" style={{ flex: 1, height: '42px' }}>
                <i className="fa-solid fa-rotate" />
              </button>
              <button className="btn btn-secondary" onClick={moveRight} aria-label="Right" style={{ flex: 1, height: '42px' }}>
                <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', width: '100%', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={softDrop} aria-label="Down" style={{ flex: 1, height: '42px' }}>
                <i className="fa-solid fa-arrow-down" />
              </button>
              <button className="btn btn-secondary" onClick={hardDrop} aria-label="Drop" style={{ flex: 1.5, height: '42px', fontSize: '0.75rem', fontWeight: 800 }}>
                DROP
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
