import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { InitialLoadingGate } from './screens/InitialLoadingGate';
import { getCampaignStorage, isCampaignQaActive, isCampaignQaAvailable } from './campaign/campaignQA';
import { PROLOGUE_COMPLETE_KEY } from './campaign/prologueArt';
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

/** Cargar cada pantalla sólo cuando se visita: evita incluir DRStudio/campaña en el menú. */
const MainMenu = React.lazy(() => import('./screens/MainMenu'));
const GameBoard = React.lazy(() => import('./screens/GameBoard'));
const VictoryScreen = React.lazy(() => import('./screens/VictoryScreen'));
const RulesScreen = React.lazy(() => import('./screens/RulesScreen'));
const OptionsScreen = React.lazy(() => import('./screens/OptionsScreen'));
const CombatPrototype = React.lazy(() => import('./screens/CombatPrototype'));
const TutorialScreen = React.lazy(() => import('./screens/TutorialScreen'));
const CampaignMap = React.lazy(() => import('./screens/CampaignMap'));
const CampaignMission = React.lazy(() => import('./screens/CampaignMission'));
const CampaignStory = React.lazy(() => import('./screens/CampaignStory'));
const CampaignEpilogue = React.lazy(() => import('./screens/CampaignEpilogue'));
const CampaignDeck = React.lazy(() => import('./screens/CampaignDeck'));
const CampaignBossSelect = React.lazy(() => import('./screens/CampaignBossSelect'));
const CampaignIntro = React.lazy(() => import('./screens/CampaignIntro'));
const CampaignOpening = React.lazy(() => import('./screens/CampaignOpening'));
const CampaignPauseMenu = React.lazy(() => import('./screens/CampaignPauseMenu'));
const CampaignAfterVictory = React.lazy(() => import('./screens/CampaignAfterVictory'));
const CampaignCenterReveal = React.lazy(() => import('./screens/CampaignCenterReveal'));
const CampaignRegionMoment = React.lazy(() => import('./screens/CampaignRegionMoment'));
const CampaignQaNavigator = React.lazy(() => import('./screens/CampaignQaNavigator'));
const StudioScenesCatalog = React.lazy(() => import('./screens/studio/StudioScenesCatalog'));
const ArtGallery = React.lazy(() => import('./screens/ArtGallery'));
const MultiplayerScreen = React.lazy(() => import('./screens/MultiplayerScreen'));
const CampaignCredits = React.lazy(() => import('./screens/CampaignCredits'));

/** Fallback accesible, sin vídeos ni recursos de campaña. */
const RouteLoading: React.FC = () => <main role="status" aria-live="polite"
  style={{ minHeight:'100dvh',display:'grid',placeItems:'center',background:'#101c2d',
    color:'#ead9b0',fontFamily:'Cinzel,Georgia,serif',textAlign:'center',padding:'1rem' }}>
  Cargando Decreto Real…
</main>;

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
        <React.Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/game" element={<GameBoard />} />
          <Route path="/multijugador" element={<MultiplayerScreen />} />
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
        </React.Suspense>
    </React.Fragment>
    {location.pathname.startsWith('/campania') && location.pathname !== '/campania/inicio' && location.pathname !== '/campania/prologo' && !studioSession &&
      <React.Suspense fallback={null}><CampaignPauseMenu /></React.Suspense>}
    {isCampaignQaAvailable() && (location.pathname === '/' || location.pathname.startsWith('/campania')) &&
      <React.Suspense fallback={null}><CampaignQaNavigator /></React.Suspense>}
  </>;
};

const App: React.FC = () => (
  <HashRouter>
    {/* Mount the music player while the first 0–100% resource splash is visible.
        Otherwise playback cannot begin until after the loading screen closes. */}
    <AudioProvider>
      <InitialLoadingGate><CampaignRoutes /></InitialLoadingGate>
    </AudioProvider>
  </HashRouter>
);

export default App;
