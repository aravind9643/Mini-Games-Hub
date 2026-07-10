import { useState, useEffect, useRef, useCallback } from 'react';
import GameHeader from '../components/GameHeader';

const CANVAS_SIZE = 400;
const GRAVITY = 0.45;
const FLAP_STRENGTH = -7.5;
const PIPE_SPEED = 2.5;
const PIPE_SPAWN_RATE = 100; // Spawn pipe every N ticks
const GAP_SIZE = 110; // Vertical gap between pipes
const BIRD_RADIUS = 12;
const PIPE_WIDTH = 55;

export default function FlappyBird() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('games-flappy-highscore') || '0', 10);
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState('lobby'); // 'lobby' or 'playing'

  // Use refs to track game loop physics variables without re-triggering effects
  const birdY = useRef(200);
  const birdVelocity = useRef(0);
  const pipes = useRef([]); // Each pipe: { x, topHeight, bottomHeight, passed: false }
  const frameId = useRef(null);
  const spawnCounter = useRef(0);

  // Initialize Game parameters
  const initGame = () => {
    birdY.current = 200;
    birdVelocity.current = 0;
    pipes.current = [];
    spawnCounter.current = 0;
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setIsPaused(false);
    setGameState('playing');
  };

  // Bird jump function
  const flap = useCallback(() => {
    if (!gameStarted) {
      initGame();
      return;
    }
    if (gameOver) {
      initGame();
      return;
    }
    if (isPaused) return;
    
    birdVelocity.current = FLAP_STRENGTH;
  }, [gameStarted, gameOver, isPaused]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        flap();
        e.preventDefault(); // Stop page scrolling
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flap]);

  // Touch/Mouse click jump on canvas area
  const handleCanvasClick = (e) => {
    e.preventDefault();
    flap();
  };

  // Main Physics and Rendering Loop
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

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

    const updatePhysics = () => {
      // 1. Update Bird position
      birdVelocity.current += GRAVITY;
      // Clamp velocity
      birdVelocity.current = Math.min(10, Math.max(-10, birdVelocity.current));
      birdY.current += birdVelocity.current;

      // 2. Collision with ceiling/floor
      if (birdY.current + BIRD_RADIUS >= CANVAS_SIZE || birdY.current - BIRD_RADIUS <= 0) {
        setGameOver(true);
        if (frameId.current) cancelAnimationFrame(frameId.current);
        return;
      }

      // 3. Move Pipes and Check Collisions
      const currentPipes = [...pipes.current];
      
      // Spawn new pipes
      spawnCounter.current += 1;
      if (spawnCounter.current >= PIPE_SPAWN_RATE) {
        spawnCounter.current = 0;
        const minHeight = 40;
        const maxHeight = CANVAS_SIZE - minHeight - GAP_SIZE;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        const bottomHeight = CANVAS_SIZE - topHeight - GAP_SIZE;
        currentPipes.push({
          x: CANVAS_SIZE,
          topHeight,
          bottomHeight,
          passed: false
        });
      }

      let collided = false;
      const updatedPipes = currentPipes
        .map(pipe => {
          const nextX = pipe.x - PIPE_SPEED;

          // Check if bird collided with this pipe
          const birdX = 120; // fixed bird horizontal position
          
          // Check horizontal bounds
          const withinX = birdX + BIRD_RADIUS > nextX && birdX - BIRD_RADIUS < nextX + PIPE_WIDTH;
          
          // Check vertical bounds
          const hitTop = birdY.current - BIRD_RADIUS < pipe.topHeight;
          const hitBottom = birdY.current + BIRD_RADIUS > CANVAS_SIZE - pipe.bottomHeight;
          
          if (withinX && (hitTop || hitBottom)) {
            collided = true;
          }

          // Check if bird passed the pipe to score points
          if (!pipe.passed && nextX + PIPE_WIDTH < birdX) {
            pipe.passed = true;
            setScore(prev => {
              const next = prev + 1;
              if (next > highScore) {
                setHighScore(next);
                localStorage.setItem('games-flappy-highscore', next.toString());
              }
              return next;
            });
          }

          return { ...pipe, x: nextX };
        })
        // Filter out pipes that left the screen
        .filter(pipe => pipe.x + PIPE_WIDTH > 0);

      pipes.current = updatedPipes;

      if (collided) {
        setGameOver(true);
        if (frameId.current) cancelAnimationFrame(frameId.current);
        return;
      }
    };

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw Grid Lines (subtle background)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 20; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 20, 0);
        ctx.lineTo(i * 20, CANVAS_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * 20);
        ctx.lineTo(CANVAS_SIZE, i * 20);
        ctx.stroke();
      }

      // Draw Pipes (Neon purple columns)
      pipes.current.forEach(pipe => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(168, 85, 247, 0.6)'; // purple neon glow
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';

        // Top Pipe
        ctx.beginPath();
        ctx.roundRect(pipe.x, -10, PIPE_WIDTH, pipe.topHeight + 10, 4);
        ctx.fill();
        ctx.stroke();

        // Bottom Pipe
        ctx.beginPath();
        ctx.roundRect(pipe.x, CANVAS_SIZE - pipe.bottomHeight, PIPE_WIDTH, pipe.bottomHeight + 10, 4);
        ctx.fill();
        ctx.stroke();
      });

      // Draw Bird (Glowing yellow outline/circle)
      const birdX = 120;
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.8)'; // amber/yellow neon glow
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(birdX, birdY.current, BIRD_RADIUS, 0, 2 * Math.PI);
      ctx.fill();

      // Reset shadows
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
    };

    const loop = () => {
      updatePhysics();
      draw();
      frameId.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (frameId.current) cancelAnimationFrame(frameId.current);
    };
  }, [gameStarted, gameOver, isPaused, highScore]);

  // Initial draw before start
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas._dpr = dpr;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Initial bird
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(120, 200, BIRD_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  if (gameState === 'lobby') {
    return (
      <div className="game-container">
        <div className="game-header">
          <div className="game-title-area">
            <h2>Neon Flappy</h2>
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
              Press Spacebar, Arrow Up, or W to fly upwards. Tap or Click directly on the game screen to flap. Navigate through the narrow gaps between glowing column obstacles.
            </p>
          </div>

          {/* Scores */}
          <div className="info-panel" style={{ gap: '1rem', textAlign: 'center' }}>
            <h3 style={{ textAlign: 'left' }}>Performance</h3>
            <div className="snake-stat-box">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>High Score</div>
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
      <GameHeader
        onMenu={() => {
          if (frameId.current) cancelAnimationFrame(frameId.current);
          setGameStarted(false);
          setGameState('lobby');
        }}
        stats={[
          { label: 'Score', value: score, color: 'var(--accent-cyan)' }
        ]}
        actions={gameStarted && !gameOver && (
          <button className="btn btn-secondary" onClick={() => setIsPaused(!isPaused)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            <i className={isPaused ? "fa-solid fa-play" : "fa-solid fa-pause"}></i> {isPaused ? 'Resume' : 'Pause'}
          </button>
        )}
      />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem auto 0', maxWidth: '400px', width: '100%', position: 'relative' }}>
        {/* Canvas Screen */}
        <div 
          className="snake-canvas-container"
          onClick={handleCanvasClick}
          style={{ cursor: 'pointer', position: 'relative' }}
        >
          <canvas ref={canvasRef} />

          {/* Overlays */}
          {isPaused && gameStarted && (
            <div className="game-overlay">
              <i className="fa-solid fa-pause" style={{ fontSize: '3rem', color: 'var(--accent-cyan)' }}></i>
              <h2>Game Paused</h2>
              <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); setIsPaused(false); }}>
                Resume Game
              </button>
            </div>
          )}

          {gameOver && (
            <div className="game-overlay">
              <h3 style={{ color: 'var(--accent-red)' }}>Game Over</h3>
              <p>Score: {score}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); initGame(); }}>
                  Play Again
                </button>
                <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); setGameStarted(false); setGameState('lobby'); }}>
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
