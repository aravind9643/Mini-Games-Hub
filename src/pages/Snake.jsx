import { useState, useEffect, useRef, useCallback } from 'react';
import GameHeader from '../components/GameHeader';

const GRID_SIZE = 20; // 20x20 cells
const CELL_COUNT = 20;
const CANVAS_SIZE = 400; // 400px square

export default function Snake() {
  const canvasRef = useRef(null);
  const [snake, setSnake] = useState([[10, 10], [10, 11], [10, 12]]); // Head is snake[0]
  const [food, setFood] = useState([5, 5]);
  const [direction, setDirection] = useState([0, -1]); // Starting direction: UP
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('games-snake-highscore') || '0', 10);
  });
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(150); // Speed in milliseconds (lower = faster)
  const [gameState, setGameState] = useState('lobby'); // 'lobby' or 'playing'

  // Ref to track mutable state in game loop without re-triggering effects
  const directionRef = useRef(direction);
  const snakeRef = useRef(snake);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  useEffect(() => {
    snakeRef.current = snake;
  }, [snake]);

  // Generate random food coordinate that is not on the snake body
  const generateFood = useCallback((currentSnake) => {
    let newFood;
    let onSnake = true;
    while (onSnake) {
      newFood = [
        Math.floor(Math.random() * CELL_COUNT),
        Math.floor(Math.random() * CELL_COUNT)
      ];
      onSnake = currentSnake.some(([x, y]) => x === newFood[0] && y === newFood[1]);
    }
    return newFood;
  }, []);

  // Reset Game
  const resetGame = () => {
    const initialSnake = [[10, 10], [10, 11], [10, 12]];
    setSnake(initialSnake);
    const newFood = generateFood(initialSnake);
    setFood(newFood);
    setDirection([0, -1]);
    setScore(0);
    setSpeed(150);
    setGameOver(false);
    setGameStarted(true);
    setIsPaused(false);
    setGameState('playing');
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted || gameOver || isPaused) return;

      const currentDir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir[1] === 0) setDirection([0, -1]);
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir[1] === 0) setDirection([0, 1]);
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir[0] === 0) setDirection([-1, 0]);
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir[0] === 0) setDirection([1, 0]);
          e.preventDefault();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, isPaused]);

  // On-screen direction controller helper (for mobile)
  const handleControlClick = (dx, dy) => {
    if (!gameStarted || gameOver || isPaused) return;
    const currentDir = directionRef.current;
    if (dx !== 0 && currentDir[0] === 0) setDirection([dx, 0]);
    if (dy !== 0 && currentDir[1] === 0) setDirection([0, dy]);
  };

  // Game tick logic
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const gameLoop = setInterval(() => {
      const currentSnake = [...snakeRef.current];
      const currentDir = directionRef.current;
      
      // Calculate new head position
      const head = currentSnake[0];
      const newHead = [head[0] + currentDir[0], head[1] + currentDir[1]];

      // Boundary Collisions
      if (
        newHead[0] < 0 || newHead[0] >= CELL_COUNT ||
        newHead[1] < 0 || newHead[1] >= CELL_COUNT
      ) {
        setGameOver(true);
        return;
      }

      // Self Collisions
      const selfCollide = currentSnake.some(([x, y]) => x === newHead[0] && y === newHead[1]);
      if (selfCollide) {
        setGameOver(true);
        return;
      }

      // Put new head at the beginning
      currentSnake.unshift(newHead);

      // Check if food is eaten
      if (newHead[0] === food[0] && newHead[1] === food[1]) {
        // Grow snake (keep tail), generate new food, increase score
        const nextScore = score + 10;
        setScore(nextScore);
        
        // Update highscore if needed
        if (nextScore > highScore) {
          setHighScore(nextScore);
          localStorage.setItem('games-snake-highscore', nextScore.toString());
        }

        // Increase speed slightly
        setSpeed((prev) => Math.max(50, 150 - Math.floor(nextScore / 50) * 10));
        
        setFood(generateFood(currentSnake));
      } else {
        // Move forward (pop tail)
        currentSnake.pop();
      }

      setSnake(currentSnake);
    }, speed);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, isPaused, food, score, speed, highScore, generateFood]);

  // Render on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas._dpr !== dpr) {
      canvas._dpr = dpr;
      canvas.width = CANVAS_SIZE * dpr;
      canvas.height = CANVAS_SIZE * dpr;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Clear board
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CELL_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID_SIZE, 0);
      ctx.lineTo(i * GRID_SIZE, CANVAS_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * GRID_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * GRID_SIZE);
      ctx.stroke();
    }

    // Draw Food (Pulsing glowing red dot)
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(239, 68, 68, 0.8)';
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    const centerX = food[0] * GRID_SIZE + GRID_SIZE / 2;
    const centerY = food[1] * GRID_SIZE + GRID_SIZE / 2;
    ctx.arc(centerX, centerY, GRID_SIZE / 2 - 2, 0, 2 * Math.PI);
    ctx.fill();

    // Draw Snake (Glowing green)
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
    
    snake.forEach(([x, y], idx) => {
      // Gradient / Fade from head to tail
      const opacity = Math.max(0.4, 1 - idx / snake.length);
      ctx.fillStyle = `rgba(16, 185, 129, ${opacity})`;
      
      // Rounded rectangles for smooth segments
      const pad = 2;
      const size = GRID_SIZE - pad * 2;
      
      // Highlight head differently
      if (idx === 0) {
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = 'rgba(52, 211, 153, 0.8)';
      } else {
        ctx.shadowColor = 'rgba(16, 185, 129, 0.5)';
      }
      
      ctx.fillRect(x * GRID_SIZE + pad, y * GRID_SIZE + pad, size, size);
    });

    // Reset shadow values for next draw
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }, [snake, food]);

  if (gameState === 'lobby') {
    return (
      <div className="game-container">
        <div className="game-header">
          <div className="game-title-area">
            <h2>Retro Snake</h2>
            <div className="game-meta-tags">
              <span className="meta-tag category">Arcade</span>
              <span className="meta-tag difficulty">Medium</span>
            </div>
          </div>
        </div>

        <div className="lobby-stack">
          {/* Rules */}
          <div className="info-panel">
            <h3>How to Play</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Use Arrow Keys or WASD to change the snake direction. Consume glowing food cells to grow and increase your score, but avoid crashing into outer walls or your own tail.
            </p>
          </div>

          {/* Scores */}
          <div className="info-panel" style={{ gap: '1rem', textAlign: 'center' }}>
            <h3 style={{ textAlign: 'left' }}>Performance</h3>
            <div className="snake-stat-box">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>High Score</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-green)' }}>{highScore} 🍎</div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={resetGame} style={{ padding: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>
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
        onMenu={() => { setGameStarted(false); setGameState('lobby'); }}
        stats={[
          { label: 'Score', value: score, color: 'var(--accent-cyan)' }
        ]}
        actions={
          gameStarted && !gameOver && (
            <button className="btn btn-secondary" onClick={() => setIsPaused(!isPaused)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              <i className={isPaused ? "fa-solid fa-play" : "fa-solid fa-pause"}></i> {isPaused ? 'Resume' : 'Pause'}
            </button>
          )
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1.5rem auto 0', maxWidth: '400px', width: '100%', position: 'relative' }}>
        {/* Canvas Screen */}
        <div className="snake-canvas-container" style={{ position: 'relative' }}>
          <canvas ref={canvasRef} />

          {/* Overlays (Paused / Game Over) */}
          {isPaused && gameStarted && (
            <div className="game-overlay">
              <i className="fa-solid fa-pause" style={{ fontSize: '3rem', color: 'var(--accent-cyan)' }}></i>
              <h2>Game Paused</h2>
              <button className="btn btn-primary" onClick={() => setIsPaused(false)}>
                Resume Game
              </button>
            </div>
          )}

          {gameOver && (
            <div className="game-overlay">
              <h3 style={{ color: 'var(--accent-red)' }}>Game Over</h3>
              <p>Score: {score}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn btn-primary" onClick={resetGame}>
                  Play Again
                </button>
                <button className="btn btn-secondary" onClick={() => { setGameStarted(false); setGameState('lobby'); }}>
                  Lobby
                </button>
              </div>
            </div>
          )}
        </div>

        {/* On-Screen Mobile Controller */}
        {gameStarted && !gameOver && !isPaused && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <button 
              className="btn btn-secondary" 
              style={{ width: '52px', height: '48px', display: 'grid', placeContent: 'center' }}
              onClick={() => handleControlClick(0, -1)}
              aria-label="Up"
            >
              <i className="fa-solid fa-caret-up" style={{ fontSize: '1.4rem' }} />
            </button>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-secondary" 
                style={{ width: '52px', height: '48px', display: 'grid', placeContent: 'center' }}
                onClick={() => handleControlClick(-1, 0)}
                aria-label="Left"
              >
                <i className="fa-solid fa-caret-left" style={{ fontSize: '1.4rem' }} />
              </button>
              <div style={{ width: '52px' }}></div>
              <button 
                className="btn btn-secondary" 
                style={{ width: '52px', height: '48px', display: 'grid', placeContent: 'center' }}
                onClick={() => handleControlClick(1, 0)}
                aria-label="Right"
              >
                <i className="fa-solid fa-caret-right" style={{ fontSize: '1.4rem' }} />
              </button>
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ width: '52px', height: '48px', display: 'grid', placeContent: 'center' }}
              onClick={() => handleControlClick(0, 1)}
              aria-label="Down"
            >
              <i className="fa-solid fa-caret-down" style={{ fontSize: '1.4rem' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
