import { useState, useEffect, useRef, useCallback } from 'react';

// Frequencies for Simon Says colors
const FREQUENCIES = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
const PAD_COLORS = [
  'var(--accent-green)', // Green (0)
  'var(--accent-pink)',  // Pink (1)
  'var(--accent-amber)', // Amber (2)
  'var(--accent-cyan)'   // Cyan (3)
];

export default function SimonSays() {
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [activePad, setActivePad] = useState(null);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('games-simonsays-highscore') || '0', 10);
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameState, setGameState] = useState('lobby'); // 'lobby' or 'playing'

  const audioCtx = useRef(null);

  // Initialize Audio Context on demand (user gesture required)
  const initAudio = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  // Play tone
  const playSound = (index) => {
    initAudio();
    if (!audioCtx.current) return;

    try {
      const osc = audioCtx.current.createOscillator();
      const gainNode = audioCtx.current.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(FREQUENCIES[index], audioCtx.current.currentTime);
      
      gainNode.gain.setValueAtTime(0.15, audioCtx.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.current.currentTime + 0.35);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.current.destination);

      osc.start();
      osc.stop(audioCtx.current.currentTime + 0.4);
    } catch (e) {
      console.warn("AudioContext failed to play sound", e);
    }
  };

  // Start sequence play animation
  const playSequence = useCallback(async (currentSeq) => {
    setIsPlayingSequence(true);
    // Pause briefly before playing
    await new Promise(resolve => setTimeout(resolve, 600));

    for (let i = 0; i < currentSeq.length; i++) {
      const padIdx = currentSeq[i];
      setActivePad(padIdx);
      playSound(padIdx);
      await new Promise(resolve => setTimeout(resolve, 350));
      setActivePad(null);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    setIsPlayingSequence(false);
  }, []);

  // Initialize Game
  const initGame = () => {
    initAudio();
    const firstPad = Math.floor(Math.random() * 4);
    const newSeq = [firstPad];
    setSequence(newSeq);
    setUserSequence([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    playSequence(newSeq);
    setGameState('playing');
  };

  // Handle pad click
  const handlePadClick = (index) => {
    if (!gameStarted || gameOver || isPlayingSequence) return;

    // Flash pad
    setActivePad(index);
    playSound(index);
    setTimeout(() => setActivePad(null), 250);

    const nextUserSeq = [...userSequence, index];
    setUserSequence(nextUserSeq);

    // Verify move
    const currentStep = nextUserSeq.length - 1;
    if (nextUserSeq[currentStep] !== sequence[currentStep]) {
      // Mistake! Game Over
      setGameOver(true);
      return;
    }

    // Finished sequence! Proceed to next level
    if (nextUserSeq.length === sequence.length) {
      const nextScore = score + 1;
      setScore(nextScore);
      if (nextScore > highScore) {
        setHighScore(nextScore);
        localStorage.setItem('games-simonsays-highscore', nextScore.toString());
      }
      
      const nextPad = Math.floor(Math.random() * 4);
      const nextSeq = [...sequence, nextPad];
      setSequence(nextSeq);
      setUserSequence([]);
      playSequence(nextSeq);
    }
  };

  if (gameState === 'lobby') {
    return (
      <div className="game-container">
        <div className="game-header">
          <div className="game-title-area">
            <h2>Simon Says</h2>
            <div className="game-meta-tags">
              <span className="meta-tag category">Arcade</span>
              <span className="meta-tag difficulty">Easy</span>
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
              The game flashes a sequence of colored pads and sounds. Wait until the playback finishes completely, then tap or click the colors in the exact sequence you observed.
            </p>
          </div>

          {/* Scores */}
          <div style={{
            background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', textAlign: 'left' }}>Performance</h3>
            <div className="snake-stat-box">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Best Level</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-green)' }}>{highScore} 🔴</div>
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
        <button className="btn btn-secondary" onClick={() => { setGameStarted(false); setGameState('lobby'); }} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <i className="fa-solid fa-arrow-left" /> Menu
        </button>
        
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
          Level: {score}
        </div>

        <button className="btn btn-secondary" onClick={initGame} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <i className="fa-solid fa-rotate-right" /> Restart
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem auto 0', maxWidth: '360px', width: '100%', position: 'relative' }}>
        
        {/* Status Indicator */}
        {!gameOver && (
          <div className="tictactoe-status" style={{ marginBottom: '1.5rem', width: '100%', textAlign: 'center' }}>
            {isPlayingSequence ? (
              <span style={{ color: 'var(--accent-pink)' }}>📺 Watch the Sequence...</span>
            ) : (
              <span style={{ color: 'var(--accent-green)' }}>🎮 Your Turn! {sequence.length - userSequence.length} left</span>
            )}
          </div>
        )}

        {/* Board Circular Controller */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '300px',
          aspectRatio: '1',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '8px solid var(--border-color)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: '8px',
          padding: '8px',
          overflow: 'hidden'
        }}>
          {/* Top-Left: Green */}
          <button 
            onClick={() => handlePadClick(0)}
            style={{
              background: activePad === 0 ? 'var(--accent-green)' : 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderTopLeftRadius: '100%',
              cursor: !gameStarted || gameOver || isPlayingSequence ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activePad === 0 ? '0 0 25px var(--accent-green)' : 'none',
              transform: activePad === 0 ? 'scale(0.98)' : 'none'
            }}
            aria-label="Green Pad"
          />

          {/* Top-Right: Pink */}
          <button 
            onClick={() => handlePadClick(1)}
            style={{
              background: activePad === 1 ? 'var(--accent-pink)' : 'rgba(217, 70, 239, 0.08)',
              border: '1px solid rgba(217, 70, 239, 0.2)',
              borderTopRightRadius: '100%',
              cursor: !gameStarted || gameOver || isPlayingSequence ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activePad === 1 ? '0 0 25px var(--accent-pink)' : 'none',
              transform: activePad === 1 ? 'scale(0.98)' : 'none'
            }}
            aria-label="Pink Pad"
          />

          {/* Bottom-Left: Amber */}
          <button 
            onClick={() => handlePadClick(2)}
            style={{
              background: activePad === 2 ? 'var(--accent-amber)' : 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderBottomLeftRadius: '100%',
              cursor: !gameStarted || gameOver || isPlayingSequence ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activePad === 2 ? '0 0 25px var(--accent-amber)' : 'none',
              transform: activePad === 2 ? 'scale(0.98)' : 'none'
            }}
            aria-label="Amber Pad"
          />

          {/* Bottom-Right: Cyan */}
          <button 
            onClick={() => handlePadClick(3)}
            style={{
              background: activePad === 3 ? 'var(--accent-cyan)' : 'rgba(14, 165, 233, 0.08)',
              border: '1px solid rgba(14, 165, 233, 0.2)',
              borderBottomRightRadius: '100%',
              cursor: !gameStarted || gameOver || isPlayingSequence ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: activePad === 3 ? '0 0 25px var(--accent-cyan)' : 'none',
              transform: activePad === 3 ? 'scale(0.98)' : 'none'
            }}
            aria-label="Cyan Pad"
          />

          {/* Center Display Badge */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
            border: '8px solid var(--border-color)',
            display: 'grid',
            placeContent: 'center',
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            {score}
          </div>

          {/* Game Over Overlay */}
          {gameOver && (
            <div className="snake-overlay" style={{ borderRadius: '50%', padding: '2.5rem 1rem' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2.2rem', color: 'var(--accent-red)' }}></i>
              <h3 style={{ fontSize: '1.1rem', margin: '0.4rem 0' }}>Wrong Color</h3>
              <p style={{ fontSize: '0.8rem', textAlign: 'center' }}>Reached Level: {score}</p>
              <div style={{ display: 'flex', gap: '0.4rem', width: '100%', marginTop: '0.5rem' }}>
                <button className="btn btn-primary" onClick={initGame} style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}>
                  Retry
                </button>
                <button className="btn btn-secondary" onClick={() => { setGameStarted(false); setGameState('lobby'); }} style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}>
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
