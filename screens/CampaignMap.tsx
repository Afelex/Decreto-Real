import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CAMPAIGN_MISSIONS, bestStars, isMissionUnlocked,
  loadCampaignProgress, type CampaignMission,
} from '../campaign/campaign.ts';
import './campaign.css';

const readStorage = (): Storage | null => {
  try { return typeof window !== 'undefined' ? window.localStorage : null; }
  catch { return null; }
};

function StarRow({ count }: { count: number }) {
  return <span className="dc-stars" aria-label={`${count} de 3 estrellas`} role="img">
    {[0, 1, 2].map(index => <span key={index} className={index < count ? 'earned' : ''} aria-hidden="true">★</span>)}
  </span>;
}

/** Only the chapter map and local stars live here. Combat remains in the existing DuelBoard. */
const CampaignMap: React.FC = () => {
  const navigate = useNavigate();
  const [progress] = React.useState(() => loadCampaignProgress(readStorage()));
  const [selected, setSelected] = React.useState<CampaignMission | null>(null);
  const startRef = React.useRef<HTMLButtonElement>(null);
  const totalStars = CAMPAIGN_MISSIONS.reduce((sum, mission) => sum + bestStars(progress, mission.id), 0);
  const completed = CAMPAIGN_MISSIONS.filter(mission => bestStars(progress, mission.id) > 0).length;

  React.useEffect(() => {
    if (!selected) return;
    startRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected]);

  return <main className="dc-page">
    <header className="dc-header">
      <button type="button" onClick={() => navigate('/')} aria-label="Volver al menú">‹ Volver</button>
      <div><small>DECRETO REAL · MODO HISTORIA</small><h1>Camino a la Corona</h1></div>
    </header>
    <section className="dc-progress" aria-label="Progreso de la campaña">
      <div><strong>Capítulo I</strong><span>Del pregón al palacio</span></div>
      <div className="dc-progress-numbers"><b>{completed}/{CAMPAIGN_MISSIONS.length}</b><small>misiones</small></div>
      <div className="dc-progress-numbers"><b>★ {totalStars}/{CAMPAIGN_MISSIONS.length * 3}</b><small>estrellas</small></div>
    </section>
    <p className="dc-intro">Gana un duelo para abrir el siguiente camino. Repite las misiones para conseguir las tres estrellas.</p>
    <ol className="dc-trail" aria-label="Misiones del primer capítulo">
      {CAMPAIGN_MISSIONS.map((mission, index) => {
        const unlocked = isMissionUnlocked(progress, mission.id);
        const stars = bestStars(progress, mission.id);
        return <li key={mission.id} className={`dc-node ${index % 2 ? 'right' : 'left'} ${unlocked ? 'open' : 'locked'}`}>
          <button
            type="button" disabled={!unlocked}
            aria-label={`Misión ${index + 1}: ${mission.title}. ${unlocked ? `${stars} de 3 estrellas` : 'Bloqueada'}`}
            onClick={() => setSelected(mission)}
            className="dc-node-button"
          >{unlocked ? index + 1 : <span aria-hidden="true">♙</span>}</button>
          <div className="dc-node-info">
            <b>{mission.title}</b>
            {unlocked ? <StarRow count={stars}/> : <small>Completa la misión anterior</small>}
          </div>
        </li>;
      })}
    </ol>
    <p className="dc-footnote">Las estrellas y los desbloqueos se guardan únicamente en este navegador. No hay compras, energía ni multijugador.</p>
    {selected && <div className="dc-overlay" role="presentation" onClick={() => setSelected(null)}>
      <section className="dc-dialog" role="dialog" aria-modal="true" aria-labelledby="dc-mission-title" onClick={event => event.stopPropagation()}>
        <small>MISIÓN {selected.id} · IA {selected.difficulty}</small>
        <h2 id="dc-mission-title">{selected.title}</h2>
        <p>{selected.description}</p>
        <div className="dc-star-goals">
          <div><span>★</span><strong>Gana el duelo</strong></div>
          <div><span>★</span><strong>Conserva {selected.healthGoal} de vida o más</strong></div>
          <div><span>★</span><strong>Gana antes o durante el turno {selected.turnGoal}</strong></div>
        </div>
        <p className="dc-note">El duelo usa las cartas y reglas actuales. Si cambias la dificultad en combate, esta misión concederá como máximo una estrella.</p>
        <button className="dc-primary" ref={startRef} onClick={() => navigate(`/campania/mision/${selected.id}`)}>Comenzar duelo</button>
        <button className="dc-secondary" onClick={() => setSelected(null)}>Volver al mapa</button>
      </section>
    </div>}
  </main>;
};

export default CampaignMap;
