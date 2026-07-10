import { useState, useEffect, useCallback } from 'react';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]            // Diagonals
];

export default function TicTacToe() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState('computer'); // 'computer' or 'local'
  const [difficulty, setDifficulty] = useState('hard'); // 'easy' or 'hard' (minimax)
  const [scores, setScores] = useState({ x: 0, o: 0, ties: 0 });
  const [winner, setWinner] = useState(null); // 'X', 'O', 'Tie', or null
  const [winningLine, setWinningLine] = useState([]);
  const [isThinking, setIsThinking] = useState(false);

  // Check for winner
  const checkWinner = useCallback((currentBoard) => {
    for (let combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: combo };
      }
    }
    if (currentBoard.every((cell) => cell !== null)) {
      return { winner: 'Tie', line: [] };
    }
    return { winner: null, line: [] };
  }, []);

  // Make a move
  const makeMove = useCallback((index, player) => {
    setBoard((prev) => {
      const next = [...prev];
      next[index] = player;
      return next;
    });
    setIsXNext(player === 'X' ? false : true);
  }, []);

  // Handle cell click
  const handleClick = (index) => {
    if (board[index] || winner || isThinking) return;
    
    // In computer mode, human is always X
    const player = isXNext ? 'X' : 'O';
    makeMove(index, player);
  };

  // Minimax algorithm logic
  const evaluateBoard = useCallback((boardState) => {
    const res = checkWinner(boardState);
    if (res.winner === 'O') return 10;
    if (res.winner === 'X') return -10;
    if (res.winner === 'Tie') return 0;
    return null;
  }, [checkWinner]);

  const minimax = useCallback((boardState, depth, isMax) => {
    const score = evaluateBoard(boardState);
    if (score !== null) return score - depth; // Prefer quicker wins / slower losses

    if (isMax) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (boardState[i] === null) {
          boardState[i] = 'O';
          best = Math.max(best, minimax(boardState, depth + 1, false));
          boardState[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (boardState[i] === null) {
          boardState[i] = 'X';
          best = Math.min(best, minimax(boardState, depth + 1, true));
          boardState[i] = null;
        }
      }
      return best;
    }
  }, [evaluateBoard]);

  // Find best move for Computer (O)
  const getComputerMove = useCallback((currentBoard) => {
    // Easy mode: Random move
    if (difficulty === 'easy') {
      const emptyCells = currentBoard
        .map((cell, idx) => (cell === null ? idx : null))
        .filter((val) => val !== null);
      if (emptyCells.length === 0) return null;
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    // Hard mode: Minimax algorithm
    let bestVal = -Infinity;
    let bestMove = -1;
    const boardCopy = [...currentBoard];

    for (let i = 0; i < 9; i++) {
      if (boardCopy[i] === null) {
        boardCopy[i] = 'O';
        let moveVal = minimax(boardCopy, 0, false);
        boardCopy[i] = null;

        if (moveVal > bestVal) {
          bestVal = moveVal;
          bestMove = i;
        }
      }
    }
    return bestMove;
  }, [difficulty, minimax]);

  // Computer player effect
  useEffect(() => {
    if (gameMode !== 'computer' || isXNext || winner) return;

    setIsThinking(true);
    const timer = setTimeout(() => {
      const move = getComputerMove(board);
      if (move !== null && move !== -1) {
        makeMove(move, 'O');
      }
      setIsThinking(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [gameMode, isXNext, board, winner, getComputerMove, makeMove]);

  // Check state changes for winner
  useEffect(() => {
    const res = checkWinner(board);
    if (res.winner) {
      setWinner(res.winner);
      setWinningLine(res.line);
      
      // Update scoreboards
      setScores((prev) => {
        if (res.winner === 'X') return { ...prev, x: prev.x + 1 };
        if (res.winner === 'O') return { ...prev, o: prev.o + 1 };
        return { ...prev, ties: prev.ties + 1 };
      });
    }
  }, [board, checkWinner]);

  // Reset Game Board
  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine([]);
  };

  // Reset full scores
  const handleResetScores = () => {
    handleReset();
    setScores({ x: 0, o: 0, ties: 0 });
  };

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-title-area">
          <h2>Tic Tac Toe</h2>
          <div className="game-meta-tags">
            <span className="meta-tag category">Board</span>
            <span className="meta-tag difficulty">Easy / Hard</span>
          </div>
        </div>
        <div className="game-controls-area">
          <button className="btn btn-secondary" onClick={handleResetScores}>
            <i className="fa-solid fa-rotate-left"></i> Reset Scores
          </button>
          <button className="btn btn-primary" onClick={handleReset}>
            Restart Game
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', margin: '2rem 0' }}>
        {/* Game Configurations */}
        <div style={{
          flex: '1 1 300px', maxWidth: '350px', display: 'flex', flexDirection: 'column', gap: '1.25rem',
          background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Game Setup</h3>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Game Mode</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`btn ${gameMode === 'computer' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.5rem' }}
                onClick={() => { setGameMode('computer'); handleResetScores(); }}
              >
                vs Computer
              </button>
              <button 
                className={`btn ${gameMode === 'local' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, padding: '0.5rem' }}
                onClick={() => { setGameMode('local'); handleResetScores(); }}
              >
                Local 2 Player
              </button>
            </div>
          </div>

          {gameMode === 'computer' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>AI Difficulty</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className={`btn ${difficulty === 'easy' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.5rem' }}
                  onClick={() => { setDifficulty('easy'); handleReset(); }}
                >
                  Easy
                </button>
                <button 
                  className={`btn ${difficulty === 'hard' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.5rem' }}
                  onClick={() => { setDifficulty('hard'); handleReset(); }}
                >
                  Unbeatable
                </button>
              </div>
            </div>
          )}

          {/* Scoreboard */}
          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Scoreboard</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>Player X</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{scores.x}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-pink)' }}>{gameMode === 'computer' ? 'Computer O' : 'Player O'}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{scores.o}</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ties</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{scores.ties}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Board and Status Panel */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {winner ? (
            <div className={`tictactoe-status winner`}>
              {winner === 'Tie' ? (
                <span>🤝 It's a Draw!</span>
              ) : (
                <span>🎉 Winner: Player {winner}!</span>
              )}
            </div>
          ) : (
            <div className="tictactoe-status">
              {isThinking ? (
                <span>🤖 Computer is thinking...</span>
              ) : (
                <span>🎮 Turn: Player {isXNext ? 'X' : 'O'}</span>
              )}
            </div>
          )}

          <div className="tictactoe-board">
            {board.map((cell, idx) => {
              const isWinningCell = winningLine.includes(idx);
              const cellClass = `tictactoe-cell ${cell ? cell.toLowerCase() : ''} ${isWinningCell ? 'winning-cell' : ''}`;
              return (
                <button
                  key={idx}
                  className={cellClass}
                  onClick={() => handleClick(idx)}
                  disabled={cell !== null || winner !== null || isThinking}
                  aria-label={`Board space ${idx + 1}, ${cell || 'empty'}`}
                >
                  {cell}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
