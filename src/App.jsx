import { lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';

const Home = lazy(() => import('./pages/Home'));
const TicTacToe = lazy(() => import('./pages/TicTacToe'));
const Snake = lazy(() => import('./pages/Snake'));
const Game2048 = lazy(() => import('./pages/Game2048'));
const MemoryMatch = lazy(() => import('./pages/MemoryMatch'));
const Minesweeper = lazy(() => import('./pages/Minesweeper'));
const FlappyBird = lazy(() => import('./pages/FlappyBird'));
const WordGuess = lazy(() => import('./pages/WordGuess'));
const SimonSays = lazy(() => import('./pages/SimonSays'));
const Sudoku = lazy(() => import('./pages/Sudoku'));
const NeonPong = lazy(() => import('./pages/NeonPong'));
const Tetris = lazy(() => import('./pages/Tetris'));
const WhackAMole = lazy(() => import('./pages/WhackAMole'));
const RPSLS = lazy(() => import('./pages/RPSLS'));
const Hangman = lazy(() => import('./pages/Hangman'));

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tic-tac-toe" element={<TicTacToe />} />
          <Route path="/snake" element={<Snake />} />
          <Route path="/2048" element={<Game2048 />} />
          <Route path="/memory-match" element={<MemoryMatch />} />
          <Route path="/minesweeper" element={<Minesweeper />} />
          <Route path="/flappy-bird" element={<FlappyBird />} />
          <Route path="/word-guess" element={<WordGuess />} />
          <Route path="/simon-says" element={<SimonSays />} />
          <Route path="/sudoku" element={<Sudoku />} />
          <Route path="/neon-pong" element={<NeonPong />} />
          <Route path="/tetris" element={<Tetris />} />
          <Route path="/whack-a-mole" element={<WhackAMole />} />
          <Route path="/rpsls" element={<RPSLS />} />
          <Route path="/hangman" element={<Hangman />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </Router>
  );
}
