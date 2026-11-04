import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CAMPAIGN_MISSIONS, bestStars, isMissionUnlocked, loadCampaignProgress } from '../campaign/campaign.ts';
import { afterVictoryLines } from '../campaign/afterVictory.ts';
import { hasSeenRegionMoment, REGION_LIBERATIONS_KEY } from '../campaign/regionJourney.ts';
import './campaign-after-victory.css';

export const CENTER_REVEAL_KEY = 'decreto-real.campania.centro-revelado.v1';

const safeStorage = (): Storage | null => {
  try { return window.localStorage; } catch { return null; }
};

/** A chapter-specific conversation after each victory, separate from the duel. */
const CampaignAfterVictory: React.FC = () => {
  const navigate = useNavigate();
  const { missionId } = useParams<{ missionId: string }>();
  const mission = CAMPAIGN_MISSIONS.find(item => item.id === missionId);
  const [progress] = React.useState(() => loadCampaignProgress(safeStorage()));
  const [index, setIndex] = React.useState(0);
  const lines = mission ? afterVictoryLines(mission.id) : [];
  const current = lines[index];
  const won = !!mission && bestStars(progress, mission.id) > 0;
  const centerUnlocked = isMissionUnlocked(progress, '35');
  const following = mission ? CAMPAIGN_MISSIONS.find(item => item.chapterId === mission.chapterId
    && Number(item.id) === Number(mission.id) + 1 && isMissionUnlocked(progress, item.id)) : undefined;
  const returnRoute = mission?.chapterId === 'p'
    ? bestStars(progress, '02') > 0 ? '/campania/generales' : '/campania'
    : mission?.chapterId === 'f' ? '/campania/region/f'
    : '/campania/generales';

  const continueJourney = () => {
    if (!mission) return;
    if (mission.id === '02') { navigate('/campania/generales?intro=1'); return; }
    if (mission.id === '38') { navigate('/campania/epilogo'); return; }
    if (mission.kind === 'boss' && mission.chapterId !== 'p' && mission.chapterId !== 'f') {
      const liberationSeen = hasSeenRegionMoment(safeStorage(), REGION_LIBERATIONS_KEY, mission.chapterId);
      if (!liberationSeen) {
        navigate(`/campania/liberada/${mission.chapterId}`);
        return;
      }
    }
    let centerSeen = false;
    try { centerSeen = safeStorage()?.getItem(CENTER_REVEAL_KEY) === '1'; }
    catch { /* no storage */ }
    if (centerUnlocked && !centerSeen && mission.chapterId !== 'f') {
      navigate('/campania/revelacion');
      return;
    }
    if (following) { navigate('/campania/mision/' + following.id); return; }
    navigate(returnRoute);
  };

  if (!won || !mission || !current) return <main className="dca-screen dca-unavailable">
    <section className="dca-unavailable-card"><h1>Conversación bloqueada</h1>
      <p>Esta conversación se abre al superar su misión.</p>
      <button type="button" onClick={() => navigate('/campania')}>Volver al mapa</button>
    </section>
  </main>;

  const isXervias = current.speaker === 'Xervias';
  const last = index === lines.length - 1;

  return <main className="dca-screen" aria-label={`Diálogo después de la misión ${Number(mission.id)}`}>
    <div className="dca-stage">
      <header className="dca-header">
        <button type="button" onClick={() => navigate(returnRoute)} aria-label="Volver al mapa">‹ Mapa</button>
        <div><small>DECRETO REAL · DESPUÉS DE LA VICTORIA</small>
          <h1>{mission.title}</h1></div>
      </header>
      <div className="dca-scene">
        <img src="./portada/portada-poster.jpg" alt="" draggable={false} />
        <div className="dca-scene-wash" />
        <div className="dca-scene-mark">✥</div>
        <div className="dca-victory-note"><strong>Victoria · misión {Number(mission.id)} de 38</strong>
          <p>{mission.victoryLine}</p></div>
      </div>
      <section className="dca-conversation" aria-live="polite" aria-atomic="true">
        <div className="dca-speaker">
          {isXervias ? <img src="./retratos/jugador.webp" alt="" draggable={false}/>
            : <span aria-hidden="true" className="dca-mentor-badge">✦</span>}
          <div>
            <small>{isXervias ? 'PROTAGONISTA' : 'MENTOR · CAPITÁN'}</small>
            <h2>{current.speaker}</h2>
          </div>
        </div>
        <p>{current.text}</p>
      </section>
      <footer className="dca-actions">
        <div className="dca-progress" aria-label={`Diálogo ${index + 1} de ${lines.length}`}>
          {lines.map((_, number) => <span key={number} className={number === index ? 'active' : ''}/>)}
        </div>
        <button type="button" className="dca-secondary" onClick={() => navigate(returnRoute)}>Volver al mapa</button>
        <button type="button" className="dca-primary"
          onClick={last ? continueJourney : () => setIndex(i => i + 1)}>
          {last ? mission.id === '38' ? 'Ver epílogo ›' : 'Continuar historia ›' : 'Siguiente diálogo ›'}
        </button>
      </footer>
    </div>
  </main>;
};

export default CampaignAfterVictory;
