import { useState, useEffect, useRef, useCallback } from 'react';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 300;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 60;
const BALL_SIZE = 8;
const INITIAL_BALL_SPEED = 3.5;
const WINNING_SCORE = 7;

export default function NeonPong() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState({ player: 0, computer: 0 });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState('lobby'); // 'lobby' or 'playing'

  // Use refs for physical animation properties to avoid effect cycles
  const playerY = useRef((CANVAS_HEIGHT - PADDLE_HEIGHT) / 2);
  const computerY = useRef((CANVAS_HEIGHT - PADDLE_HEIGHT) / 2);
  const ballX = useRef(CANVAS_WIDTH / 2);
  const ballY = useRef(CANVAS_HEIGHT / 2);
  const ballDX = useRef(INITIAL_BALL_SPEED);
  const ballDY = useRef(0);
  const frameId = useRef(null);
  const keysPressed = useRef({});

  // Reset ball position after score
  const resetBall = (direction) => {
    ballX.current = CANVAS_WIDTH / 2;
    ballY.current = CANVAS_HEIGHT / 2;
    ballDX.current = direction * INITIAL_BALL_SPEED;
    ballDY.current = (Math.random() * 2 - 1) * 2; // Random angle
  };

  // Initialize Game
  const initGame = () => {
    playerY.current = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
    computerY.current = (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2;
    resetBall(Math.random() > 0.5 ? 1 : -1);
    setScore({ player: 0, computer: 0 });
    setGameOver(false);
    setWinner('');
    setGameStarted(true);
    setIsPaused(false);
    setGameState('playing');
  };

  // Key handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
      if (['ArrowUp', 'ArrowDown', ' ', 'w', 's', 'W', 'S'].includes(e.key)) {
        e.preventDefault(); // Stop scrolling
      }
    };
    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Frame simulation and game loop
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updatePhysics = () => {
      // 1. Move Player paddle
      const paddleSpeed = 4;
      if (keysPressed.current['ArrowUp'] || keysPressed.current['w'] || keysPressed.current['W']) {
        playerY.current = Math.max(0, playerY.current - paddleSpeed);
      }
      if (keysPressed.current['ArrowDown'] || keysPressed.current['s'] || keysPressed.current['S']) {
        playerY.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, playerY.current + paddleSpeed);
      }

      // 2. Simple Computer AI tracking
      const computerSpeed = 2.8; // Set AI difficulty
      const computerTarget = ballY.current - PADDLE_HEIGHT / 2;
      const diff = computerTarget - computerY.current;
      if (diff > 2) {
        computerY.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, computerY.current + computerSpeed);
      } else if (diff < -2) {
        computerY.current = Math.max(0, computerY.current - computerSpeed);
      }

      // 3. Move Ball
      ballX.current += ballDX.current;
      ballY.current += ballDY.current;

      // 4. Wall collisions (Bounce off top/bottom)
      if (ballY.current - BALL_SIZE <= 0) {
        ballY.current = BALL_SIZE;
        ballDY.current = -ballDY.current;
      } else if (ballY.current + BALL_SIZE >= CANVAS_HEIGHT) {
        ballY.current = CANVAS_HEIGHT - BALL_SIZE;
        ballDY.current = -ballDY.current;
      }

      // 5. Paddle Deflections (Collisions)
      // Left Paddle (Player)
      const withinPlayerX = ballX.current - BALL_SIZE <= PADDLE_WIDTH + 10 && ballX.current + BALL_SIZE >= 10;
      const withinPlayerY = ballY.current >= playerY.current && ballY.current <= playerY.current + PADDLE_HEIGHT;
      if (withinPlayerX && withinPlayerY && ballDX.current < 0) {
        // Bounce, adjust angles based on where it hit the paddle
        const hitPoint = (ballY.current - (playerY.current + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ballDX.current = -ballDX.current * 1.08; // speed up ball
        ballDY.current = hitPoint * 3.5;
        ballX.current = PADDLE_WIDTH + 10 + BALL_SIZE; // snap
      }

      // Right Paddle (Computer)
      const withinComputerX = ballX.current + BALL_SIZE >= CANVAS_WIDTH - PADDLE_WIDTH - 10 && ballX.current - BALL_SIZE <= CANVAS_WIDTH - 10;
      const withinComputerY = ballY.current >= computerY.current && ballY.current <= computerY.current + PADDLE_HEIGHT;
      if (withinComputerX && withinComputerY && ballDX.current > 0) {
        const hitPoint = (ballY.current - (computerY.current + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
        ballDX.current = -ballDX.current * 1.08;
        ballDY.current = hitPoint * 3.5;
        ballX.current = CANVAS_WIDTH - PADDLE_WIDTH - 10 - BALL_SIZE;
      }

      // 6. Point Scoring
      if (ballX.current - BALL_SIZE <= 0) {
        // Computer scores
        setScore(prev => {
          const nextComp = prev.computer + 1;
          if (nextComp >= WINNING_SCORE) {
            setGameOver(true);
            setWinner('Computer');
          } else {
            resetBall(1); // Serve to player
          }
          return { ...prev, computer: nextComp };
        });
      } else if (ballX.current + BALL_SIZE >= CANVAS_WIDTH) {
        // Player scores
        setScore(prev => {
          const nextPlayer = prev.player + 1;
          if (nextPlayer >= WINNING_SCORE) {
            setGameOver(true);
            setWinner('Player');
          } else {
            resetBall(-1); // Serve to computer
          }
          return { ...prev, player: nextPlayer };
        });
      }
    };

    const draw = () => {
      // Clear
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Dash center divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 8]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // Draw paddles with neon shadows
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1;

      // Player paddle (Cyan glow)
      ctx.shadowColor = 'rgba(14, 165, 233, 0.6)';
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(10, playerY.current, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Computer paddle (Pink glow)
      ctx.shadowColor = 'rgba(217, 70, 239, 0.6)';
      ctx.fillStyle = '#d946ef';
      ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH - 10, computerY.current, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Ball (Glow yellow)
      ctx.shadowColor = 'rgba(245, 158, 11, 0.7)';
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(ballX.current, ballY.current, BALL_SIZE, 0, 2 * Math.PI);
      ctx.fill();

      // Reset
      ctx.shadowBlur = 0;
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
  }, [gameStarted, gameOver, isPaused]);

  // Initial render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Initial paddles & ball
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(10, (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillStyle = '#d946ef';
    ctx.fillRect(CANVAS_WIDTH - PADDLE_WIDTH - 10, (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2, PADDLE_WIDTH, PADDLE_HEIGHT);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, BALL_SIZE, 0, 2 * Math.PI);
    ctx.fill();
  }, []);

  // Touch controls for mobile
  const handleTouchMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted || gameOver || isPaused) return;

    const rect = canvas.getBoundingClientRect();
    const touchY = e.touches[0].clientY - rect.top;
    
    // Scale coordinate based on canvas height ratio
    const scaledY = (touchY / rect.height) * CANVAS_HEIGHT;
    
    // Center paddle around touch point
    playerY.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, Math.max(0, scaledY - PADDLE_HEIGHT / 2));
  };

  if (gameState === 'lobby') {
    return (
      <div className="game-container">
        <div className="game-header">
          <div className="game-title-area">
            <h2>Neon Pong</h2>
            <div className="game-meta-tags">
              <span className="meta-tag category">Arcade</span>
              <span className="meta-tag difficulty">Medium</span>
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
              Use W/S or Arrow Keys to move your paddle up and down. On touch screens, drag your finger inside the game board area to slide your paddle. Deflect the ball past the CPU pad to score. First to reach 7 wins!
            </p>
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
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            You: <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{score.player}</span>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            CPU: <span style={{ fontWeight: 800, color: 'var(--accent-pink)' }}>{score.computer}</span>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={initGame} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <i className="fa-solid fa-rotate-right" /> Restart
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem auto 0', maxWidth: '400px', width: '100%', position: 'relative' }}>
        
        {/* Canvas Screen */}
        <div 
          className="snake-canvas-container"
          onTouchMove={handleTouchMove}
          style={{ width: '100%', maxWidth: '400px', aspectRatio: '4/3', overflow: 'hidden', position: 'relative' }}
        >
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={{ display: 'block', width: '100%', height: '100%' }} />

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
              <h3 style={{ color: winner === 'Player' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {winner === 'Player' ? '🏆 You Won!' : '💀 CPU Won!'}
              </h3>
              <p>Final Score: {score.player} - {score.computer}</p>
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
