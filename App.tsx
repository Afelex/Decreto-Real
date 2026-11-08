import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import CampaignOpening from './screens/CampaignOpening';
import CampaignPauseMenu from './screens/CampaignPauseMenu';
import CampaignAfterVictory from './screens/CampaignAfterVictory';
import CampaignCenterReveal from './screens/CampaignCenterReveal';
import CampaignRegionMoment from './screens/CampaignRegionMoment';
import CampaignQaNavigator from './screens/CampaignQaNavigator';
import StudioScenesCatalog from './screens/studio/StudioScenesCatalog';
import ArtGallery from './screens/ArtGallery';
import { getCampaignStorage, isCampaignQaActive, isCampaignQaAvailable } from './campaign/campaignQA';
import { PROLOGUE_COMPLETE_KEY } from './campaign/prologueArt';
import CampaignCredits from './screens/CampaignCredits';
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

/** Keep story beyond the prologue private in public builds; QA can still inspect it. */
const LaterStoryOnlyQa:React.FC<{children:React.ReactNode}> = ({children})=>{
  if(!import.meta.env.PROD || isCampaignQaActive())return <>{children}</>;
  let finished=false;
  try{finished=getCampaignStorage()?.getItem(PROLOGUE_COMPLETE_KEY)==='1';}catch{/* no local storage */}
  return <Navigate to={finished?'/campania/prologo?escena=fin':'/campania/inicio'} replace/>;
};

const CampaignRoutes: React.FC = () => {
  const location = useLocation();
  // Decreto Real Studio navigates between beats by changing only the query:
  // keep the editor mounted (undo history, media and art manifests survive).
  // Decreto Real Studio cambia solo el query al navegar: la pantalla sigue
  // montada (historial, multimedia y manifiestos se conservan).
  const studioSession = new URLSearchParams(location.search).get('studio') === '1';
  return <>
    <React.Fragment key={studioSession ? 'decreto-real-studio:' + location.pathname : location.key}>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/game" element={<GameBoard />} />
          <Route path="/duelo-v1" element={<CombatPrototype />} />
          <Route path="/campania" element={<LaterStoryOnlyQa><CampaignMap /></LaterStoryOnlyQa>} />
          <Route path="/campania/inicio" element={<CampaignIntro />} />
          <Route path="/studio" element={isCampaignQaAvailable()
            ? <Navigate to="/campania/prologo?studio=1&studioStep=1" replace/>
            : <Navigate to="/" replace/>} />
          <Route path="/studio/escenas" element={<StudioScenesCatalog />} />
          <Route path="/artes" element={<ArtGallery />} />
          <Route path="/campania/prologo" element={<CampaignOpening />} />
          <Route path="/campania/region/:chapterId" element={<LaterStoryOnlyQa><CampaignMap /></LaterStoryOnlyQa>} />
          <Route path="/campania/entrada/:chapterId" element={<LaterStoryOnlyQa><CampaignRegionMoment mode="entrada" /></LaterStoryOnlyQa>} />
          <Route path="/campania/liberada/:chapterId" element={<LaterStoryOnlyQa><CampaignRegionMoment mode="liberada" /></LaterStoryOnlyQa>} />
          <Route path="/campania/conversacion/:missionId" element={<LaterStoryOnlyQa><CampaignAfterVictory /></LaterStoryOnlyQa>} />
          <Route path="/campania/revelacion" element={<LaterStoryOnlyQa><CampaignCenterReveal /></LaterStoryOnlyQa>} />
          <Route path="/campania/generales" element={<LaterStoryOnlyQa><CampaignBossSelect /></LaterStoryOnlyQa>} />
          <Route path="/campania/historia" element={<LaterStoryOnlyQa><CampaignStory /></LaterStoryOnlyQa>} />
          <Route path="/campania/epilogo" element={<LaterStoryOnlyQa><CampaignEpilogue /></LaterStoryOnlyQa>} />
          <Route path="/campania/creditos" element={<LaterStoryOnlyQa><CampaignCredits /></LaterStoryOnlyQa>} />
          <Route path="/campania/baraja" element={<LaterStoryOnlyQa><CampaignDeck /></LaterStoryOnlyQa>} />
          <Route path="/campania/mision/:missionId" element={<LaterStoryOnlyQa><CampaignMission /></LaterStoryOnlyQa>} />
          <Route path="/duelo-v1/tutorial" element={<TutorialScreen />} />
          <Route path="/victory" element={<VictoryScreen />} />
          <Route path="/rules" element={<RulesScreen />} />
          <Route path="/options" element={<OptionsScreen />} />
        </Routes>
    </React.Fragment>
    {location.pathname.startsWith('/campania') && location.pathname !== '/campania/inicio' && location.pathname !== '/campania/prologo' && !studioSession && <CampaignPauseMenu />}
    <CampaignQaNavigator />
  </>;
};

const App: React.FC = () => (
  <AudioProvider>
    <HashRouter><CampaignRoutes /></HashRouter>
  </AudioProvider>
);

export default App;
