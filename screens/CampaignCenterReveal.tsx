import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isMissionUnlocked, loadCampaignProgress } from '../campaign/campaign.ts';
import { CENTER_REVEAL_KEY } from './CampaignAfterVictory';
import './campaign-reveal.css';

const LINES = [
  { speaker: 'Xervias', text: 'Los ocho generales han sido derrotados. Pero los decretos falsos siguen apuntando hacia un mismo lugar.' },
  { speaker: 'Zhinchi', text: 'Mira el centro de nuestro mapa. Es la Casa del Sello, el origen de las órdenes que han dividido el reino.' },
  { speaker: 'Xervias', text: 'Entonces Sigumán nos espera allí. ¿Cómo podemos llegar hasta él?' },
  { speaker: 'Zhinchi', text: 'Selecciona el símbolo del centro del mapa. Se abrirá el último escenario: cuatro misiones antes de enfrentar a Sigumán.' },
] as const;

/** Special one-time reveal after any eighth general, regardless of order. */
const CampaignCenterReveal: React.FC = () => {
  const navigate = useNavigate();
  const [progress] = React.useState(() => {
    try { return loadCampaignProgress(window.localStorage); } catch { return loadCampaignProgress(null); }
  });
  const [lineIndex, setLineIndex] = React.useState(0);
  if (!isMissionUnlocked(progress, '35')) return <Navigate to="/campania/generales" replace />;

  const finish = () => {
    try { window.localStorage.setItem(CENTER_REVEAL_KEY, '1'); } catch { /* storage unavailable */ }
    navigate('/campania/generales');
  };
  const current = LINES[lineIndex];
  const isLast = lineIndex === LINES.length - 1;

  return <main className="dcr-screen" aria-label="Descubrimiento del escenario final">
    <div className="dcr-stage">
      <header><small>EL DESTINO DE LOS OCHO GENERALES</small><h1>El centro ha despertado</h1></header>
      <section className="dcr-map">
        <img src="./campania/salon-generales.webp" alt="Mapa de los ocho generales con el escenario central" draggable={false} />
        <div className="dcr-glow" aria-hidden="true">✦</div>
        <div className="dcr-map-caption">8/8 GENERALES DERROTADOS · ESCENARIO CENTRAL DESBLOQUEADO</div>
      </section>
      <section className="dcr-dialogue" aria-live="polite" aria-atomic="true">
        <div className="dcr-speaker">
          {current.speaker === 'Xervias' ? <img src="./retratos/jugador.webp" alt="" draggable={false} /> : <span aria-hidden="true">✥</span>}
          <strong>{current.speaker}</strong>
          <small>{lineIndex + 1}/{LINES.length}</small>
        </div>
        <p>{current.text}</p>
      </section>
      <footer>
        <button type="button" onClick={() => navigate('/')} className="dcr-back">Volver al Menú</button>
        <button type="button" onClick={isLast ? finish : () => setLineIndex(n => n + 1)} className="dcr-next">
          {isLast ? 'Ver el mapa y elegir el centro ›' : 'Continuar diálogo ›'}
        </button>
      </footer>
    </div>
  </main>;
};

export default CampaignCenterReveal;
