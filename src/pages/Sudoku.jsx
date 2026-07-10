import { useState, useEffect, useCallback } from 'react';

const BASE_GRID = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

export default function Sudoku() {
  const [initialGrid, setInitialGrid] = useState([]);
  const [solutionGrid, setSolutionGrid] = useState([]);
  const [grid, setGrid] = useState([]);
  const [notes, setNotes] = useState(() => Array(9).fill(null).map(() => Array(9).fill(null).map(() => [])));
  const [selectedCell, setSelectedCell] = useState(null);
  const [noteMode, setNoteMode] = useState(false);
  const [difficulty, setDifficulty] = useState('Easy');
  const [errors, setErrors] = useState([]); // list of 'r-c'
  const [won, setWon] = useState(false);

  // Generate randomized puzzle
  const initGame = useCallback((diff = difficulty) => {
    // 1. Map base grid to a shuffled list of numbers (preserves validity)
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffledNums = [...numbers].sort(() => Math.random() - 0.5);
    const numMap = {};
    numbers.forEach((val, idx) => {
      numMap[val] = shuffledNums[idx];
    });

    let solution = BASE_GRID.map(row => row.map(cell => numMap[cell]));

    // 2. Swaps within 3x3 bands
    const swapRows = (grid, r1, r2) => {
      const temp = grid[r1];
      grid[r1] = grid[r2];
      grid[r2] = temp;
    };
    // Swap rows inside top band (0-2), middle band (3-5), bottom band (6-8)
    const band = Math.floor(Math.random() * 3) * 3;
    if (Math.random() > 0.5) swapRows(solution, band, band + 1);
    if (Math.random() > 0.5) swapRows(solution, band + 1, band + 2);

    // 3. Transpose occasionally
    if (Math.random() > 0.5) {
      solution = solution[0].map((_, c) => solution.map(row => row[c]));
    }

    // 4. Mask cells based on difficulty
    let cellsToMask = 30; // Easy
    if (diff === 'Medium') cellsToMask = 42;
    if (diff === 'Hard') cellsToMask = 52;

    const initial = solution.map(row => [...row]);
    let masked = 0;
    while (masked < cellsToMask) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (initial[r][c] !== 0) {
        initial[r][c] = 0;
        masked++;
      }
    }

    setInitialGrid(initial);
    setSolutionGrid(solution);
    setGrid(initial.map(row => [...row]));
    setNotes(Array(9).fill(null).map(() => Array(9).fill(null).map(() => [])));
    setSelectedCell(null);
    setNoteMode(false);
    setErrors([]);
    setWon(false);
  }, [difficulty]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Insert/delete number handler
  const handleNumberInput = useCallback((num) => {
    if (!selectedCell || won) return;
    const { r, c } = selectedCell;
    if (initialGrid[r][c] !== 0) return; // Cannot edit initial clues

    if (noteMode) {
      if (num === 0) {
        // Clear notes
        const nextNotes = notes.map(row => row.map(cell => [...cell]));
        nextNotes[r][c] = [];
        setNotes(nextNotes);
      } else {
        // Toggle number in notes list
        const nextNotes = notes.map(row => row.map(cell => [...cell]));
        const cellNotes = nextNotes[r][c];
        if (cellNotes.includes(num)) {
          nextNotes[r][c] = cellNotes.filter(n => n !== num);
        } else {
          nextNotes[r][c] = [...cellNotes, num].sort();
        }
        setNotes(nextNotes);
        // Clear normal grid number if adding notes
        const nextGrid = grid.map(row => [...row]);
        nextGrid[r][c] = 0;
        setGrid(nextGrid);
      }
    } else {
      const nextGrid = grid.map(row => [...row]);
      nextGrid[r][c] = num;
      setGrid(nextGrid);

      // Remove notes at this spot
      const nextNotes = notes.map(row => row.map(cell => [...cell]));
      nextNotes[r][c] = [];
      setNotes(nextNotes);

      // Validate move
      validateGrid(nextGrid);
    }
  }, [selectedCell, initialGrid, noteMode, grid, notes, won]);

  // Check board validation
  const validateGrid = (currentGrid) => {
    const errorCoords = [];

    // Check rows, columns, and 3x3 blocks for duplicates
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = currentGrid[r][c];
        if (val === 0) continue;

        // Check Row
        for (let col = 0; col < 9; col++) {
          if (col !== c && currentGrid[r][col] === val) {
            errorCoords.push(`${r}-${c}`);
          }
        }

        // Check Col
        for (let row = 0; row < 9; row++) {
          if (row !== r && currentGrid[row][c] === val) {
            errorCoords.push(`${r}-${c}`);
          }
        }

        // Check 3x3 Block
        const blockRow = Math.floor(r / 3) * 3;
        const blockCol = Math.floor(c / 3) * 3;
        for (let brow = blockRow; brow < blockRow + 3; brow++) {
          for (let bcol = blockCol; bcol < blockCol + 3; bcol++) {
            if ((brow !== r || bcol !== c) && currentGrid[brow][bcol] === val) {
              errorCoords.push(`${r}-${c}`);
            }
          }
        }
      }
    }

    setErrors(errorCoords);

    // Verify win conditions (all filled and no errors)
    const isFilled = currentGrid.every(row => row.every(cell => cell !== 0));
    if (isFilled && errorCoords.length === 0) {
      setWon(true);
    }
  };

  // Connect physical numbers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedCell) return;
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleNumberInput(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, handleNumberInput]);

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="game-title-area">
          <h2>Sudoku Board</h2>
          <div className="game-meta-tags">
            <span className="meta-tag category">Board</span>
            <span className="meta-tag difficulty">{difficulty}</span>
          </div>
        </div>
        <div className="game-controls-area">
          <select 
            className="btn btn-secondary"
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              initGame(e.target.value);
            }}
            style={{ padding: '0.45rem 1rem', cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', outline: 'none' }}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <button className="btn btn-primary" onClick={() => initGame(difficulty)}>
            Restart
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center', margin: '2rem 0' }}>
        {/* Play Details panel */}
        <div style={{
          flex: '1 1 250px', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.25rem',
          background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Game Panel</h3>
          
          <button 
            className={`btn ${noteMode ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setNoteMode(!noteMode)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <i className="fa-solid fa-pencil" /> Note Mode: {noteMode ? 'ON' : 'OFF'}
          </button>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.25rem' }}>How to play:</h4>
            <p>1. Select any grid cell.</p>
            <p>2. Press **Keyboard Numbers (1-9)** or use the keypad to write.</p>
            <p>3. Toggle **Note Mode** to write small pencil numbers.</p>
            <p>4. Red cells highlight incorrect duplicate values.</p>
          </div>
        </div>

        {/* Sudoku Grid and Keypad */}
        <div style={{ flex: '1 1 300px', maxWidth: '440px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
          {/* Sudoku Board Grid */}
          <div style={{
            display: 'grid',
            gridTemplateRows: 'repeat(9, 1fr)',
            width: '100%',
            aspectRatio: '1',
            background: 'var(--bg-primary)',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {grid.map((row, r) => (
              <div key={r} style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', height: '100%' }}>
                {row.map((val, c) => {
                  const isInitial = initialGrid[r]?.[c] !== 0;
                  const isSelected = selectedCell && selectedCell.r === r && selectedCell.c === c;
                  const hasError = errors.includes(`${r}-${c}`);
                  const cellNotes = notes[r]?.[c] || [];

                  // Border widths inside Sudoku blocks
                  const borderRight = (c === 2 || c === 5) ? '2px solid rgba(255, 255, 255, 0.25)' : '1px solid var(--border-color)';
                  const borderBottom = (r === 2 || r === 5) ? '2px solid rgba(255, 255, 255, 0.25)' : '1px solid var(--border-color)';

                  let background = 'rgba(255, 255, 255, 0.01)';
                  if (isSelected) background = 'rgba(59, 130, 246, 0.15)'; // Selected glow
                  else if (hasError) background = 'rgba(239, 68, 68, 0.15)'; // Error red

                  return (
                    <div 
                      key={c}
                      onClick={() => setSelectedCell({ r, c })}
                      style={{
                        background,
                        borderRight,
                        borderBottom,
                        display: 'grid',
                        placeContent: 'center',
                        fontSize: '1.25rem',
                        fontWeight: isInitial ? 800 : 500,
                        color: isInitial 
                          ? 'var(--text-primary)' 
                          : hasError 
                            ? 'var(--accent-red)' 
                            : 'var(--accent-cyan-light)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        position: 'relative',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {val !== 0 ? (
                        val
                      ) : (
                        // Draw pencil notes (3x3 grid inside cell)
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gridTemplateRows: 'repeat(3, 1fr)',
                          width: '100%',
                          height: '100%',
                          padding: '2px',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          fontSize: '0.55rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1
                        }}>
                          {Array(9).fill(null).map((_, n) => {
                            const noteNum = n + 1;
                            return (
                              <div key={n} style={{ display: 'grid', placeContent: 'center' }}>
                                {cellNotes.includes(noteNum) ? noteNum : ''}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Victory Overlay */}
            {won && (
              <div className="snake-overlay" style={{ borderRadius: 'var(--radius-md)' }}>
                <i className="fa-solid fa-medal" style={{ fontSize: '3rem', color: 'var(--accent-amber)' }}></i>
                <h2 style={{ color: 'var(--accent-green)' }}>Board Solved!</h2>
                <p>Congratulations, you completed the puzzle!</p>
                <button className="btn btn-primary" onClick={() => initGame(difficulty)}>
                  Play Again
                </button>
              </div>
            )}
          </div>

          {/* Number Keyboard Pad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', width: '100%' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button 
                key={num}
                className="btn btn-secondary"
                onClick={() => handleNumberInput(num)}
                style={{ height: '45px', fontSize: '1.2rem', fontWeight: 800 }}
              >
                {num}
              </button>
            ))}
            <button 
              className="btn btn-secondary"
              onClick={() => handleNumberInput(0)}
              style={{ height: '45px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-red)' }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
