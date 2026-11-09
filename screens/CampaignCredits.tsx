import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CAMPAIGN_MISSIONS, bestStars, loadCampaignProgress } from '../campaign/campaign.ts';
import { getCampaignStorage } from '../campaign/campaignQA.ts';
import { StudioScreenLayers, StudioScreenPanel, StudioScreenProvider, StudioText, useStudioBackground, useStudioTitle } from './studio/StudioScreenKit';
import './campaign-credits.css';

/** Credits layout is intentionally provisional; do not invent individual contributors. */
const CREDITS_TEXT = 'Decreto Real · El Sello y la Revolución Solar. Una aventura de fantasía ambientada en Los Reinos del Perú. Proyecto independiente de creación narrativa, arte y desarrollo.';
const CREDITS_THANKS = 'Gracias por acompañar a Xervias en su viaje. Su historia ha llegado al final.';

const CampaignCreditsScreen: React.FC = () => {
  const navigate = useNavigate();
  const progress = loadCampaignProgress(getCampaignStorage());
  const unlocked = CAMPAIGN_MISSIONS.every(mission => bestStars(progress, mission.id) > 0);
  const sceneKey = 'creditos/principal';
  const heading = useStudioTitle(sceneKey, 'Créditos');
  const art = useStudioBackground(sceneKey, '');
  if (!unlocked) return <main className="dcredits-screen"><h1>Créditos bloqueados</h1><p>Completa la historia para ver los créditos.</p>
    <button type="button" onClick={() => navigate('/campania')}>Regresar a la campaña</button></main>;
  return <main className="dcredits-screen" aria-label="Créditos de Decreto Real"
    style={art ? { backgroundImage: 'url("' + art + '")', backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
    <div className="dcredits-content">
      <small>DECRETO REAL I</small>
      <h1>El Sello y la Revolución Solar</h1>
      <p className="dcredits-finish">FIN DE LA CAMPAÑA</p>
      <div className="dcredits-rule" aria-hidden="true">✦</div>
      {heading !== null && <h2>{heading}</h2>}
      <p><StudioText k={sceneKey + '-texto'} original={CREDITS_TEXT}/></p>
      <p className="dcredits-thanks"><StudioText k={sceneKey + '-gracias'} original={CREDITS_THANKS}/></p>
    </div>
    <footer><button type="button" onClick={() => navigate('/')}>Volver al menú</button></footer>
    <StudioScreenLayers sceneKey={sceneKey}/>
    <StudioScreenPanel label="Créditos" sceneKey={sceneKey} originalTitle="Créditos"
      texts={[{ key: sceneKey + '-texto', label: 'Texto', original: CREDITS_TEXT }, { key: sceneKey + '-gracias', label: 'Agradecimiento', original: CREDITS_THANKS }]}/>
  </main>;
};

/** Créditos con su capa de autoría de Decreto Real Studio (solo QA). */
const CampaignCredits: React.FC = () => <StudioScreenProvider><CampaignCreditsScreen/></StudioScreenProvider>;
export default CampaignCredits;
