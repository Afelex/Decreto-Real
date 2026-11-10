import { getCampaignStorage } from '../campaign/campaignQA.ts';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CAMPAIGN_MISSIONS, bestStars, isMissionUnlocked, loadCampaignProgress } from '../campaign/campaign.ts';
import { afterVictoryLines } from '../campaign/afterVictory.ts';
import { hasSeenRegionMoment, REGION_LIBERATIONS_KEY } from '../campaign/regionJourney.ts';
import { campaignMissionBackground } from '../campaign/regionAssets.ts';
import { speakerLineIds, victoryScreenKey } from '../campaign/studio/screenKeys.ts';
import { StudioScreenLayers, StudioScreenPanel, StudioScreenProvider, StudioText, useStudioBackground, useStudioTitle } from './studio/StudioScreenKit';
import { useStudio } from './studio/StudioContext';
import './campaign-after-victory.css';

export const CENTER_REVEAL_KEY = 'decreto-real.campania.centro-revelado.v1';

const safeStorage = getCampaignStorage;

/** A chapter-specific conversation after each victory, separate from the duel. */
const CampaignAfterVictoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { missionId } = useParams<{ missionId: string }>();
  const mission = CAMPAIGN_MISSIONS.find(item => item.id === missionId);
  const [progress] = React.useState(() => loadCampaignProgress(safeStorage()));
  const [index, setIndex] = React.useState(0);
  const lines = mission ? afterVictoryLines(mission.id, progress) : [];
  const current = lines[index];
  const studio = useStudio();
  const lineIds = speakerLineIds(lines.map(line => line.speaker));
  const keyOf = (i: number) => (mission ? victoryScreenKey(mission.id) : 'victoria-x') + '/' + (lineIds[i] ?? 'linea-01');
  const sceneKey = keyOf(index);
  const title = useStudioTitle(sceneKey, mission?.title ?? '');
  const sceneImage = useStudioBackground(sceneKey,
    campaignMissionBackground(mission?.id ?? '') ?? './portada/portada-poster.jpg');
  /** Siguiente línea visible para la audiencia actual (las «solo desarrollador» se saltan). */
  const nextVisible = (from: number) => {
    let next = from + 1;
    while (next < lines.length && !studio.visibleTo(studio.viewScene(keyOf(next))?.devOnly)) next++;
    return next;
  };
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
  const speakerRole = isXervias ? 'SOLDADO' : current.speaker === 'Zhinchi' ? 'CAPITÁN'
    : current.speaker === 'Crónica' ? 'NARRADOR' : 'PERSONAJE';
  const last = nextVisible(index) >= lines.length;

  return <main className="dca-screen" aria-label={`Diálogo después de la misión ${Number(mission.id)}`}>
    <div className="dca-stage">
      <header className="dca-header">
        <button type="button" onClick={() => navigate(returnRoute)} aria-label="Volver al mapa">‹ Mapa</button>
        <div><small>DECRETO REAL · DESPUÉS DE LA VICTORIA</small>
          {title !== null && <h1>{title}</h1>}</div>
      </header>
      <div className="dca-scene">
        <img src={sceneImage} alt="" draggable={false} />
        <div className="dca-scene-wash" />
        <div className="dca-scene-mark">✥</div>
        {<div className="dca-victory-note"><strong>Victoria · misión {Number(mission.id)} de 38</strong>
          <p>{mission.victoryLine}</p></div>}
      </div>
      <section className="dca-conversation" aria-live="polite" aria-atomic="true">
        <div className="dca-speaker">
          {isXervias ? <img src="./retratos/jugador.webp" alt="" draggable={false}/>
            : <span aria-hidden="true" className="dca-mentor-badge">✦</span>}
          <div>
            <small>{speakerRole}</small>
            <h2>{current.speaker}</h2>
          </div>
        </div>
        <p><StudioText k={sceneKey} original={current.text}/></p>
      </section>
      <footer className="dca-actions">
        <div className="dca-progress" aria-label={`Diálogo ${index + 1} de ${lines.length}`}>
          {lines.map((_, number) => <span key={number} className={number === index ? 'active' : ''}/>)}
        </div>
        <button type="button" className="dca-secondary" onClick={() => navigate(returnRoute)}>Volver al mapa</button>
        {last && mission.id === '36' && <button type="button" className="dca-secondary" onClick={() => navigate('/campania/baraja')}>Editar baraja ✦</button>}
        <button type="button" className="dca-primary"
          onClick={last ? continueJourney : () => setIndex(i => nextVisible(i))}>
          {last ? mission.id === '38' ? 'Ver epílogo ›' : 'Continuar historia ›' : 'Siguiente diálogo ›'}
        </button>
      </footer>
    </div>
    <StudioScreenLayers sceneKey={sceneKey}/>
    <StudioScreenPanel label={'Conversación · misión ' + Number(mission.id)} sceneKey={sceneKey}
      originalTitle={mission.title} texts={[{ key: sceneKey, label: current.speaker + ' · línea ' + (index + 1), original: current.text }]}/>
  </main>;
};

/** Conversación tras victoria con su capa de autoría de Decreto Real Studio (solo QA). */
const CampaignAfterVictory: React.FC = () => <StudioScreenProvider><CampaignAfterVictoryScreen/></StudioScreenProvider>;

export default CampaignAfterVictory;
