import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CAMPAIGN_MISSIONS, bestStars, loadCampaignProgress } from '../campaign/campaign.ts';
import { getCampaignStorage } from '../campaign/campaignQA.ts';
import './campaign-credits.css';

/** Credits layout is intentionally provisional; do not invent individual contributors. */
const CampaignCredits: React.FC = () => {
  const navigate = useNavigate();
  const progress = loadCampaignProgress(getCampaignStorage());
  const unlocked = CAMPAIGN_MISSIONS.every(mission => bestStars(progress, mission.id) > 0);
  if (!unlocked) return <main className="dcredits-screen"><h1>Créditos bloqueados</h1><p>Completa la historia para ver los créditos.</p>
    <button type="button" onClick={() => navigate('/campania')}>Regresar a la campaña</button></main>;
  return <main className="dcredits-screen" aria-label="Créditos de Decreto Real">
    <div className="dcredits-content">
      <small>DECRETO REAL I</small>
      <h1>El Sello y la Revolución Solar</h1>
      <p className="dcredits-finish">FIN DE LA CAMPAÑA</p>
      <div className="dcredits-rule" aria-hidden="true">✦</div>
      <h2>Créditos</h2>
      <p>Esta sección está en preparación y servirá para reconocer a quienes participen en el desarrollo, arte, música, narrativa y pruebas del juego.</p>
      <p className="dcredits-thanks">Gracias por acompañar a Xervias en su viaje.</p>
    </div>
    <footer><button type="button" onClick={() => navigate('/campania/epilogo')}>‹ Volver al epílogo</button>
      <button type="button" onClick={() => navigate('/')}>Menú principal</button></footer>
  </main>;
};
export default CampaignCredits;
