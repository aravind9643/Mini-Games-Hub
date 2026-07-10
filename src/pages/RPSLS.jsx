import { useState } from 'react';

const CHOICES = [
  { id: 'rock', name: 'Rock', icon: '🪨', color: '#ef4444' }, // Red
  { id: 'paper', name: 'Paper', icon: '📄', color: '#0ea5e9' }, // Cyan
  { id: 'scissors', name: 'Scissors', icon: '✂️', color: '#d946ef' }, // Pink
  { id: 'lizard', name: 'Lizard', icon: '🦎', color: '#10b981' }, // Green
  { id: 'spock', name: 'Spock', icon: '🖖', color: '#f59e0b' } // Amber
];

const RULES = {
  rock: {
    beats: { scissors: 'crushes', lizard: 'crushes' }
  },
  paper: {
    beats: { rock: 'covers', spock: 'disproves' }
  },
  scissors: {
    beats: { paper: 'cuts', lizard: 'decapitates' }
  },
  lizard: {
    beats: { spock: 'poisons', paper: 'eats' }
  },
  spock: {
    beats: { scissors: 'smashes', rock: 'vaporizes' }
  }
};

export default function RPSLS() {
  const [playerChoice, setPlayerChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState(null); // 'win', 'lose', 'tie'
  const [resultMessage, setResultMessage] = useState('');
  const [scores, setScores] = useState({ player: 0, computer: 0 });
  const [history, setHistory] = useState([]);
  const [gameState, setGameState] = useState('lobby'); // 'lobby' or 'playing'

  const makeChoice = (choiceId) => {
    const compChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)].id;
    setPlayerChoice(choiceId);
    setComputerChoice(compChoice);

    if (choiceId === compChoice) {
      setResult('tie');
      setResultMessage("It's a draw! Both chose the same.");
      setHistory(prev => [{ player: choiceId, computer: compChoice, result: 'tie' }, ...prev].slice(0, 8));
      return;
    }

    const playerBeats = RULES[choiceId].beats;
    if (playerBeats[compChoice]) {
      const verb = playerBeats[compChoice];
      setResult('win');
      setResultMessage(`You Win! ${capitalize(choiceId)} ${verb} ${capitalize(compChoice)}.`);
      setScores(prev => ({ ...prev, player: prev.player + 1 }));
      setHistory(prev => [{ player: choiceId, computer: compChoice, result: 'win' }, ...prev].slice(0, 8));
    } else {
      const compBeats = RULES[compChoice].beats;
      const verb = compBeats[choiceId];
      setResult('lose');
      setResultMessage(`You Lose! ${capitalize(compChoice)} ${verb} ${capitalize(choiceId)}.`);
      setScores(prev => ({ ...prev, computer: prev.computer + 1 }));
      setHistory(prev => [{ player: choiceId, computer: compChoice, result: 'lose' }, ...prev].slice(0, 8));
    }
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const resetGame = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    setResultMessage('');
    setScores({ player: 0, computer: 0 });
    setHistory([]);
  };

  const initGame = () => {
    resetGame();
    setGameState('playing');
  };

  const pChoiceObj = CHOICES.find(c => c.id === playerChoice);
  const cChoiceObj = CHOICES.find(c => c.id === computerChoice);

  if (gameState === 'lobby') {
    return (
      <div className="game-container">
        <div className="game-header">
          <div className="game-title-area">
            <h2>RPSLS Battle</h2>
            <div className="game-meta-tags">
              <span className="meta-tag category">Board</span>
              <span className="meta-tag difficulty">Easy</span>
            </div>
          </div>
        </div>

        <div className="lobby-stack">
          {/* Rules */}
          <div className="info-panel">
            <h3>Game Rules</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <p>✂️ **Scissors** cuts Paper & decapitates Lizard</p>
              <p>📄 **Paper** covers Rock & disproves Spock</p>
              <p>🪨 **Rock** crushes Lizard & crushes Scissors</p>
              <p>🦎 **Lizard** poisons Spock & eats Paper</p>
              <p>🖖 **Spock** smashes Scissors & vaporizes Rock</p>
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
        <button className="btn btn-secondary" onClick={() => setGameState('lobby')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <i className="fa-solid fa-arrow-left" /> Menu
        </button>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            You: <span style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{scores.player}</span>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            CPU: <span style={{ fontWeight: 800, color: 'var(--accent-pink)' }}>{scores.computer}</span>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={resetGame} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          <i className="fa-solid fa-rotate-right" /> Reset
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem auto 0', maxWidth: '360px', width: '100%', position: 'relative', gap: '1.5rem' }}>
        
        {/* Battleground Screen */}
        <div style={{
          width: '100%',
          height: '180px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          position: 'relative'
        }}>
          {playerChoice ? (
            <>
              <div style={{ display: 'flex', gap: '3rem', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', animation: 'slide-left-anim 0.2s ease-out' }}>
                  <div style={{ fontSize: '3rem', filter: `drop-shadow(0 0 10px ${pChoiceObj.color})` }}>{pChoiceObj.icon}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>You</span>
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)' }}>VS</span>
                <div style={{ textAlign: 'center', animation: 'slide-right-anim 0.2s ease-out' }}>
                  <div style={{ fontSize: '3rem', filter: `drop-shadow(0 0 10px ${cChoiceObj.color})` }}>{cChoiceObj.icon}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CPU</span>
                </div>
              </div>
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                textAlign: 'center',
                color: result === 'win' ? 'var(--accent-green)' : result === 'lose' ? 'var(--accent-red)' : 'var(--text-secondary)'
              }}>
                {resultMessage}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              <i className="fa-solid fa-hand-fist" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'block' }} />
              <span>Choose your hand gesture to start battle!</span>
            </div>
          )}
        </div>

        {/* Option Selector List */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', width: '100%' }}>
          {CHOICES.map(c => (
            <button
              key={c.id}
              className="rpsls-choice-btn"
              onClick={() => makeChoice(c.id)}
              style={{ '--choice-color': c.color }}
              aria-label={`Choose ${c.name}`}
            >
              <span style={{ fontSize: '1.4rem' }}>{c.icon}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Match history list */}
        {history.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Recent Matches:</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {history.map((h, idx) => {
                const pObj = CHOICES.find(c => c.id === h.player);
                const cObj = CHOICES.find(c => c.id === h.computer);
                const resultColor = h.result === 'win' ? 'var(--accent-green)' : h.result === 'lose' ? 'var(--accent-red)' : 'rgba(255, 255, 255, 0.2)';
                
                return (
                  <div 
                    key={idx}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${resultColor}`,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{pObj.icon}</span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>vs</span>
                    <span>{cObj.icon}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
