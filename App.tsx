import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MainMenu from './screens/MainMenu';
import GameBoard from './screens/GameBoard';
import VictoryScreen from './screens/VictoryScreen';
import RulesScreen from './screens/RulesScreen';
import OptionsScreen from './screens/OptionsScreen';
import CombatPrototype from './screens/CombatPrototype';
import TutorialScreen from './screens/TutorialScreen';
import CampaignMap from './screens/CampaignMap';
import CampaignMission from './screens/CampaignMission';
import CampaignStory from './screens/CampaignStory';
import CampaignEpilogue from './screens/CampaignEpilogue';
import CampaignDeck from './screens/CampaignDeck';
import CampaignBossSelect from './screens/CampaignBossSelect';
import CampaignIntro from './screens/CampaignIntro';
import { AudioProvider } from './contexts/AudioContext';
import './screens/one-screen-ui.css';
import './screens/duel-viewport.css';
import './screens/campaign-progress.css';
import './screens/region-scenes.css';
import './screens/boss-combat-effects.css';
import './screens/table-original-revival.css';
import './screens/royal-table.css';
import './screens/royal-table-v2.css';
import './screens/royal-card-art.css';
import './screens/royal-hud-art.css';
import './screens/royal-battle-status.css';

const App: React.FC = () => {
  return (
    <AudioProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/game" element={<GameBoard />} />
          <Route path="/duelo-v1" element={<CombatPrototype />} />
          <Route path="/campania" element={<CampaignMap />} />
          <Route path="/campania/inicio" element={<CampaignIntro />} />
          <Route path="/campania/region/:chapterId" element={<CampaignMap />} />
          <Route path="/campania/generales" element={<CampaignBossSelect />} />
          <Route path="/campania/historia" element={<CampaignStory />} />
          <Route path="/campania/epilogo" element={<CampaignEpilogue />} />
          <Route path="/campania/baraja" element={<CampaignDeck />} />
          <Route path="/campania/mision/:missionId" element={<CampaignMission />} />
          <Route path="/duelo-v1/tutorial" element={<TutorialScreen />} />
          <Route path="/victory" element={<VictoryScreen />} />
          <Route path="/rules" element={<RulesScreen />} />
          <Route path="/options" element={<OptionsScreen />} />
        </Routes>
      </HashRouter>
    </AudioProvider>
  );
};

export default App;
