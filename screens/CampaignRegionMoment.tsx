import React from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { bestStars, isMissionUnlocked, loadCampaignProgress } from '../campaign/campaign.ts';
import { STORY_CHAPTERS, stagesForChapter } from '../campaign/story.ts';
import { regionVisual } from '../campaign/regionVisuals.ts';
import { GENERAL_MYSTICS, mysticPower, mysticPowerText } from '../game/mysticCards.ts';
import { hasZhinchiLegacy } from '../campaign/mysticDeck.ts';
import {
  hasSeenRegionMoment, isGeneralRegion, rememberRegionMoment,
  REGION_ENTRANCES_KEY, REGION_LIBERATIONS_KEY, REGION_MOMENTS,
} from '../campaign/regionJourney.ts';
import { CENTER_REVEAL_KEY } from './CampaignAfterVictory';
import { GeneralPortrait } from './GeneralPortrait';
import './campaign-region-moments.css';

const storage = (): Storage | null => {
  try { return window.localStorage; } catch { return null; }
};

type RegionMomentMode = 'entrada' | 'liberada';

/** Non-blocking, replayable story scenes. Every region has its own visual and text. */
const CampaignRegionMoment: React.FC<{ mode: RegionMomentMode }> = ({ mode }) => {
  const navigate = useNavigate();
  const { chapterId } = useParams<{ chapterId?: string }>();
  const [search] = useSearchParams();
  const [progress] = React.useState(() => loadCampaignProgress(storage()));
  const validId = isGeneralRegion(chapterId) ? chapterId : null;
  const chapter = STORY_CHAPTERS.find(item => item.id === validId);
  const missions = validId ? stagesForChapter(validId) : [];
  const isLiberation = mode === 'liberada';
  const allWon = missions.length === 4 && missions.every(mission => bestStars(progress, mission.id) > 0);
  const regionUnlocked = missions.length === 4 && isMissionUnlocked(progress, missions[0].id);
  const seen = validId ? hasSeenRegionMoment(storage(), isLiberation ? REGION_LIBERATIONS_KEY : REGION_ENTRANCES_KEY, validId) : false;
  const firstVisitReplay = search.get('repetir') === '1';
  const moment = validId ? REGION_MOMENTS[validId] : null;
  const visual = regionVisual(validId ?? undefined);
  const mystic = validId ? GENERAL_MYSTICS[Number(validId) - 1] : undefined;
  const reward = mystic ? mysticPowerText(mysticPower(mystic.id, 1)) : '';
  const regionCompleted = validId
    ? stagesForChapter(validId).filter(mission => bestStars(progress, mission.id) > 0).length
    : 0;
  const liberatedCount = Array.from({ length: 8 }, (_, i) =>
    stagesForChapter(String(i + 1)).every(mission => bestStars(progress, mission.id) > 0))
    .filter(Boolean).length;
  let centerAlreadyRevealed = false;
  try { centerAlreadyRevealed = storage()?.getItem(CENTER_REVEAL_KEY) === '1'; }
  catch { /* restricted storage */ }
  const hasAllGenerals = isMissionUnlocked(progress, '35');
  const finalRevealNeeded = hasAllGenerals && !centerAlreadyRevealed;

  const leave = (destination: string) => {
    if (validId) rememberRegionMoment(storage(), isLiberation ? REGION_LIBERATIONS_KEY : REGION_ENTRANCES_KEY, validId);
    navigate(destination);
  };
  const continueJourney = () => {
    if (isLiberation) {
      leave(finalRevealNeeded ? '/campania/revelacion' : '/campania/generales');
    } else {
      leave(`/campania/region/${validId}`);
    }
  };

  if (!validId || !chapter || !moment || !regionUnlocked || (isLiberation && !allWon)) {
    return <Navigate to="/campania/generales" replace />;
  }
  if (seen && !firstVisitReplay) {
    return <Navigate to={isLiberation ? (finalRevealNeeded ? '/campania/revelacion' : '/campania/generales') : `/campania/region/${validId}`} replace />;
  }

  return <main className={`dcmoment-screen ${isLiberation ? 'dcmoment-liberation' : 'dcmoment-entrance'}`}
    aria-label={isLiberation ? `Victoria en ${chapter.title}` : `Presentación de ${chapter.title}`}
    style={{ '--dcmoment-accent': chapter.color, '--dcmoment-dark': visual.horizon } as React.CSSProperties}>
    <div className="dcmoment-shell">
      <header className="dcmoment-header">
        <small>{isLiberation ? `REGIÓN ${validId} DE 8 · CONQUISTADA` : `REGIÓN ${validId} DE 8 · NUEVO TERRITORIO`}</small>
        <h1>{isLiberation ? 'Región liberada' : chapter.title}</h1>
      </header>

      <section className="dcmoment-landscape" aria-label={visual.landmark}>
        <img src={`${import.meta.env.BASE_URL}campania/regiones/region-${validId}.svg`}
          alt={`Paisaje de ${chapter.region}: ${visual.landmark}`} draggable={false}/>
        <div className="dcmoment-landscape-tint" aria-hidden="true"/>
        <div className="dcmoment-portrait" aria-hidden="true"><GeneralPortrait chapterId={validId}/></div>
        <div className="dcmoment-landscape-tag">
          <small>{isLiberation ? 'GENERAL DERROTADO' : 'GENERAL DE ESTE TERRITORIO'}</small>
          <strong>{chapter.general}</strong>
          <span>{visual.symbol} {visual.landmark}</span>
        </div>
      </section>

      {isLiberation ? <section className="dcmoment-reward" aria-label="Recompensa de la región">
        <div className="dcmoment-medal" aria-hidden="true">✦</div>
        <div className="dcmoment-reward-copy">
          <small>CARTA MÍSTICA CONSEGUIDA · 4 DE 4 MISIONES</small>
          <h2>{chapter.specialCard}</h2>
          <p>{reward}</p>
          <strong>{hasZhinchiLegacy(progress) ? 'Poder disponible en el editor de baraja' : 'Carta sellada: podrá activarse después del legado de Zhinchi'}</strong>
        </div>
      </section> : <section className="dcmoment-missions" aria-label="Las cuatro misiones de esta región">
        <div className="dcmoment-missions-title">
          <strong>Tu recorrido: cuatro misiones</strong>
          <small>{regionCompleted} / 4 completadas</small>
        </div>
        <ol>{missions.map((mission, index) => {
          const won = bestStars(progress, mission.id) > 0;
          return <li key={mission.id} className={won ? 'won' : ''}>
            <span className="dcmoment-stage-number">{won ? '★' : index + 1}</span>
            <span className="dcmoment-stage-copy">
              <strong>{mission.title}</strong>
              <small>{mission.description}</small>
            </span>
            <span className="dcmoment-stage-type">{index === 3 ? 'GENERAL' : 'MISIÓN'}</span>
          </li>;
        })}</ol>
      </section>}

      <section className="dcmoment-dialogue" aria-label={isLiberation ? 'Reflexión de Xervias' : 'Conversación de Xervias y Zhinchi'}>
        {isLiberation
          ? <p><strong>Xervias:</strong> {moment.liberated} {liberatedCount === 8 ? 'Los ocho generales han caído. ¿Qué ocurrirá ahora en el centro del mapa?' : 'Seguiré adelante: todavía hay otras regiones que necesitan ayuda.'}</p>
          : <>
            <p><strong>Xervias:</strong> {moment.xervias}</p>
            <p><strong>Zhinchi:</strong> {moment.zhinchi}</p>
          </>}
      </section>

      <footer className="dcmoment-actions">
        <button type="button" className="dcmoment-secondary"
          onClick={() => isLiberation ? leave('/') : navigate('/campania/generales')}>
          {isLiberation ? 'Volver al Menú' : 'Otras regiones'}
        </button>
        <button type="button" className="dcmoment-primary" onClick={continueJourney}>
          {isLiberation ? finalRevealNeeded ? 'Descubrir el escenario central ›' : 'Elegir otra región ›' : 'Ver las cuatro misiones ›'}
        </button>
      </footer>
    </div>
  </main>;
};

export default CampaignRegionMoment;
