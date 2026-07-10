export const categories = ['All', 'Arcade', 'Puzzle', 'Board', 'Card', 'Word'];

export const categoryColors = {
  Arcade: '#00e5c7',
  Puzzle: '#ff5fa2',
  Board: '#8b7dff',
  Word: '#33e08a',
  Card: '#ffb02e'
};

export const categoryIcons = {
  Arcade: 'fa-solid fa-joystick',
  Puzzle: 'fa-solid fa-puzzle-piece',
  Board: 'fa-solid fa-chess-board',
  Word: 'fa-solid fa-font',
  Card: 'fa-solid fa-heart'
};

export const games = [
  {
    path: '/tic-tac-toe',
    title: 'Tic Tac Toe',
    icon: 'fa-solid fa-border-all',
    category: 'Board',
    difficulty: 'Easy',
    description: 'Play classic Tic-Tac-Toe locally with a friend or challenge an unbeatable Minimax AI agent.',
    color: '#0ea5e9'
  },
  {
    path: '/snake',
    title: 'Retro Snake',
    icon: 'fa-solid fa-arrow-pointer',
    category: 'Arcade',
    difficulty: 'Medium',
    description: 'Guide the glowing snake to consume food tiles and grow, avoiding walls and your own tail.',
    color: '#10b981'
  },
  {
    path: '/2048',
    title: '2048 Puzzle',
    icon: 'fa-solid fa-cubes',
    category: 'Puzzle',
    difficulty: 'Medium',
    description: 'Slide glassmorphic tiles to merge matching numbers and aim for the ultimate 2048 block.',
    color: '#f59e0b'
  },
  {
    path: '/memory-match',
    title: 'Memory Match',
    icon: 'fa-solid fa-clone',
    category: 'Card',
    difficulty: 'Easy',
    description: 'Flip and match pairs of colorful emoji cards in the fewest moves. Tests visual memory skills.',
    color: '#d946ef'
  },
  {
    path: '/minesweeper',
    title: 'Minesweeper',
    icon: 'fa-solid fa-land-mine-on',
    category: 'Puzzle',
    difficulty: 'Hard',
    description: 'Scan the board for hidden mines using number clues. Support for multiple difficulty grids.',
    color: '#ef4444'
  },
  {
    path: '/flappy-bird',
    title: 'Neon Flappy',
    icon: 'fa-solid fa-dove',
    category: 'Arcade',
    difficulty: 'Medium',
    description: 'Fly the glowing bird through pairs of neon pipe columns. Score points as you survive.',
    color: '#f59e0b'
  },
  {
    path: '/word-guess',
    title: 'Word Guess',
    icon: 'fa-solid fa-keyboard',
    category: 'Word',
    difficulty: 'Medium',
    description: 'Guess the hidden 5-letter word in 6 attempts. Features color hints and virtual keys.',
    color: '#10b981'
  },
  {
    path: '/simon-says',
    title: 'Simon Says',
    icon: 'fa-solid fa-circle-nodes',
    category: 'Arcade',
    difficulty: 'Easy',
    description: 'Repeat the expanding sequences of light pulses and retro synth audio tones in order.',
    color: '#d946ef'
  },
  {
    path: '/sudoku',
    title: 'Sudoku',
    icon: 'fa-solid fa-table-cells',
    category: 'Board',
    difficulty: 'Hard',
    description: 'Solve classical 9x9 Sudoku puzzles. Features cell validation checks and notes.',
    color: '#3b82f6'
  },
  {
    path: '/neon-pong',
    title: 'Neon Pong',
    icon: 'fa-solid fa-table-tennis-paddle-ball',
    category: 'Arcade',
    difficulty: 'Medium',
    description: 'Deflect the bouncing neon ball against the computer-controlled paddle to score points.',
    color: '#0ea5e9'
  },
  {
    path: '/tetris',
    title: 'Tetris Classic',
    icon: 'fa-solid fa-cubes-stacked',
    category: 'Puzzle',
    difficulty: 'Hard',
    description: 'Rotate and stack moving Tetromino bricks to clear rows. Speed rises on row clearances.',
    color: '#a855f7'
  },
  {
    path: '/whack-a-mole',
    title: 'Whack-A-Mole',
    icon: 'fa-solid fa-hammer',
    category: 'Arcade',
    difficulty: 'Easy',
    description: 'Hit the glowing moles that pop out of the neon rings in a race against the timer.',
    color: '#f59e0b'
  },
  {
    path: '/rpsls',
    title: 'RPSLS',
    icon: 'fa-solid fa-hand-spock',
    category: 'Board',
    difficulty: 'Easy',
    description: 'Play Rock-Paper-Scissors-Lizard-Spock against the computer based on the classic board layout.',
    color: '#d946ef'
  },
  {
    path: '/hangman',
    title: 'Hangman',
    icon: 'fa-solid fa-skull-crossbones',
    category: 'Word',
    difficulty: 'Medium',
    description: 'Guess letters to reveal the secret word. A stick figure is drawn dynamically with each error.',
    color: '#ef4444'
  }
];

export const gameByPath = new Map(games.map(game => [game.path, game]));
