import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainMenu from './screens/MainMenu';
import GameBoard from './screens/GameBoard';
import VictoryScreen from './screens/VictoryScreen';
import RulesScreen from './screens/RulesScreen';
import OptionsScreen from './screens/OptionsScreen';
import CombatPrototype from './screens/CombatPrototype';
import { AudioProvider } from './contexts/AudioContext';

const App: React.FC = () => {
  return (
    <AudioProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/game" element={<GameBoard />} />
          <Route path="/duelo-v1" element={<CombatPrototype />} />
          <Route path="/victory" element={<VictoryScreen />} />
          <Route path="/rules" element={<RulesScreen />} />
          <Route path="/options" element={<OptionsScreen />} />
        </Routes>
      </HashRouter>
    </AudioProvider>
  );
};

export default App;
