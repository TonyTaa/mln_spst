import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameStateProvider } from './contexts/GameStateContext';
import HomeScreen from './features/home/HomeScreen';
import GamePage from './pages/GamePage';

function App() {
  return (
    <GameStateProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </Router>
    </GameStateProvider>
  );
}

export default App;
