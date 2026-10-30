import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CAMPAIGN_MISSIONS, bestStars, loadCampaignProgress } from '../campaign/campaign.ts';
import './campaign.css';

const CampaignEpilogue: React.FC = () => {
  const navigate = useNavigate();
  const finished = React.useMemo(() => {
    try { const progress = loadCampaignProgress(window.localStorage); return CAMPAIGN_MISSIONS.every(mission => bestStars(progress, mission.id) > 0); }
    catch { return false; }
  }, []);
  if (!finished) return <main className="dc-page dc-center">
    <h1>El epílogo sigue sellado</h1>
    <p>Supera la misión 38 para conocer el desenlace de la historia.</p>
    <button className="dc-primary" onClick={() => navigate('/campania')}>Regresar al mapa</button>
  </main>;
  return <main className="dc-page dc-story-page">
    <header className="dc-header">
      <button onClick={() => navigate('/campania')}>‹ Mapa</button>
      <div><small>DECRETO REAL I · EPÍLOGO</small><h1>Después de la Falsa Luz</h1></div>
    </header>
    <article className="dc-story-scene">
      <div className="dc-story-art dc-epilogue-art" aria-hidden="true"><div className="dc-story-sun">✧</div><span>✥</span></div>
      <span className="dc-scene-label">FIN DE LA PRIMERA CAMPAÑA</span>
      <h2>El Sello permanece</h2>
      <p className="dc-scene-narration">Vile ha sido derrotado y capturado. La verdad sobre las falsificaciones del Escribano del Alba salió finalmente a la luz. Sigma, que conocía parte del engaño y aun así lo sostuvo, murió durante el derrumbe de la Casa del Sello.</p>
      <p className="dc-scene-narration">La rebelión termina, pero no todo está resuelto. Zero desapareció gravemente herido. El secreto de San Jerónimo sigue sin explicarse, y el destino de tu capitán permanece abierto.</p>
      <blockquote className="dc-story-quote">«No todas las victorias cierran una historia. Algunas revelan la que viene».</blockquote>
      <div className="dc-epilogue-next"><strong>CONTINUARÁ EN DECRETO REAL II</strong><small>La próxima historia permanece por escribir. Por ahora, puedes repetir misiones para conseguir todas las estrellas.</small></div>
      <button className="dc-primary" onClick={() => navigate('/campania')}>Volver a mi recorrido</button>
    </article>
  </main>;
};

export default CampaignEpilogue;
