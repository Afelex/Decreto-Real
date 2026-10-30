import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CAMPAIGN_MISSIONS, bestStars, isMissionUnlocked, loadCampaignProgress,
  type CampaignMission, type CampaignProgress,
} from '../campaign/campaign.ts';
import { STORY_CHAPTERS, stagesForChapter } from '../campaign/story.ts';
const mapImage = '/Decreto-Real/virreinato-map.svg';
import './campaign-map-fullscreen.css';

const storage = (): Storage | null => {
  try { return window.localStorage; } catch { return null; }
};

/** Chapter navigation is gated by wins, not by clicks on future regions. */
const chapterOpen = (progress: CampaignProgress, chapterId: string) =>
  stagesForChapter(chapterId).some(stage => isMissionUnlocked(progress, stage.id));

const chapterMissions = (chapterId: string): CampaignMission[] =>
  stagesForChapter(chapterId).map(stage => CAMPAIGN_MISSIONS.find(mission => mission.id === stage.id)!);

const initialSelection = (progress: CampaignProgress, missions: readonly CampaignMission[]) =>
  missions.find(mission => isMissionUnlocked(progress, mission.id) && bestStars(progress, mission.id) === 0)
  ?? [...missions].reverse().find(mission => isMissionUnlocked(progress, mission.id))
  ?? missions[0];

/** Map coordinates are relative percentages and work on any screen size. */
const POSITIONS: Record<number, readonly [number, number][]> = {
  2: [[51, 22], [58, 72]],
  4: [[48, 13], [61, 37], [46, 62], [62, 85]],
};

function MapStars({ count }: { count: number }) {
  return <span className="dcm-stars" role="img" aria-label={`${count} de 3 estrellas`}>
    {[0, 1, 2].map(index => <span key={index} className={index < count ? 'won' : ''} aria-hidden="true">★</span>)}
  </span>;
}

const CampaignMap: React.FC = () => {
  const navigate = useNavigate();
  const [progress] = React.useState(() => loadCampaignProgress(storage()));
  const firstIncomplete = CAMPAIGN_MISSIONS.find(mission => bestStars(progress, mission.id) === 0);
  const initialChapterIndex = firstIncomplete
    ? Math.max(0, STORY_CHAPTERS.findIndex(chapter => stagesForChapter(chapter.id).some(stage => stage.id === firstIncomplete.id)))
    : STORY_CHAPTERS.length - 1;
  const [chapterIndex, setChapterIndex] = React.useState(initialChapterIndex);
  const chapter = STORY_CHAPTERS[chapterIndex];
  const missions = chapterMissions(chapter.id);
  const [selectedId, setSelectedId] = React.useState(() => initialSelection(progress, chapterMissions(STORY_CHAPTERS[initialChapterIndex].id)).id);
  const completed = CAMPAIGN_MISSIONS.filter(mission => bestStars(progress, mission.id) > 0).length;
  const earnedStars = CAMPAIGN_MISSIONS.reduce((sum, mission) => sum + bestStars(progress, mission.id), 0);
  const chapterCompleted = missions.filter(mission => bestStars(progress, mission.id) > 0).length;
  const selected = missions.find(mission => mission.id === selectedId && isMissionUnlocked(progress, mission.id))
    ?? initialSelection(progress, missions);
  const nextChapter = STORY_CHAPTERS[chapterIndex + 1];
  const canGoNext = !!nextChapter && chapterOpen(progress, nextChapter.id);
  const mapPositions = POSITIONS[missions.length] ?? POSITIONS[4];
  const linePoints = mapPositions.map(([x, y]) => `${x},${y}`).join(' ');
  const accent = { '--dcm-accent': chapter.color } as React.CSSProperties;

  const switchChapter = (nextIndex: number) => {
    const target = STORY_CHAPTERS[nextIndex];
    if (!target || !chapterOpen(progress, target.id)) return;
    setChapterIndex(nextIndex);
    setSelectedId(initialSelection(progress, chapterMissions(target.id)).id);
  };

  const startSelected = () => {
    if (selected && isMissionUnlocked(progress, selected.id)) {
      navigate(`/campania/mision/${selected.id}`);
    }
  };

  return <main className="dcm-screen" style={accent} aria-label="Mapa de campaña de Decreto Real">
    <div className="dcm-shell">
      <header className="dcm-header">
        <button type="button" className="dcm-back" onClick={() => navigate('/')} aria-label="Volver al menú">‹</button>
        <div className="dcm-heading">
          <h1>Campaña</h1>
          <span>Virreinato del Perú · El Sello y la Falsa Luz</span>
        </div>
        <button type="button" className="dcm-story" onClick={() => navigate('/campania/historia')} aria-label="Ver la historia">▤<span>Historia</span></button>
      </header>

      <nav className="dcm-chapter-nav" aria-label="Regiones de campaña">
        <button type="button" onClick={() => switchChapter(chapterIndex - 1)} disabled={chapterIndex === 0}
          aria-label="Capítulo anterior">‹</button>
        <div className="dcm-chapter-title" aria-live="polite">
          <small>{chapterIndex === 0 ? 'PRÓLOGO' : chapterIndex === STORY_CHAPTERS.length - 1 ? 'CAPÍTULO FINAL' : `REGIÓN ${chapterIndex} DE 8`}</small>
          <strong>{chapter.title}</strong>
          <span>{chapterCompleted}/{missions.length} retos · ★ {earnedStars}/114</span>
        </div>
        <button type="button" onClick={() => switchChapter(chapterIndex + 1)} disabled={!canGoNext}
          aria-label={canGoNext ? 'Capítulo siguiente' : 'Capítulo siguiente bloqueado'}>›</button>
      </nav>

      <section className="dcm-map" aria-label={`Mapa de retos de ${chapter.title}`}>
        <img src={mapImage} alt="Mapa antiguo ilustrado del Virreinato del Perú" draggable={false} className="dcm-map-art"/>
        <div className="dcm-map-wash" aria-hidden="true" />
        <svg className="dcm-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={linePoints} fill="none" stroke="#674322" strokeWidth="1.65" strokeDasharray="2.3 2.4" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points={linePoints} fill="none" stroke="#f9dea5" strokeWidth=".45" strokeDasharray="2.3 2.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="dcm-map-label" aria-hidden="true">✥ &nbsp; {chapter.region}</span>
        {missions.map((mission, index) => {
          const unlocked = isMissionUnlocked(progress, mission.id);
          const won = bestStars(progress, mission.id);
          const active = selected.id === mission.id && unlocked;
          const [x, y] = mapPositions[index];
          return <button
            key={mission.id}
            type="button"
            className={`dcm-marker ${!unlocked ? 'locked' : won ? 'completed' : 'available'} ${active ? 'selected' : ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            disabled={!unlocked}
            aria-pressed={unlocked ? active : undefined}
            aria-label={`Misión ${Number(mission.id)}: ${mission.title}. ${unlocked ? `${won} de 3 estrellas` : 'Bloqueada'}`}
            onClick={() => { if (unlocked) setSelectedId(mission.id); }}
          >
            <span className="dcm-marker-flag" aria-hidden="true">⚑</span>
            <span className="dcm-marker-face" aria-hidden="true">{unlocked ? won ? '★' : mission.kind === 'boss' || mission.kind === 'final' ? '♛' : Number(mission.id) : '🔒'}</span>
          </button>;
        })}
        <div className="dcm-map-legend">
          <span><i className="available"/> Actual</span>
          <span><i className="completed"/> Superado</span>
          <span><i className="locked"/> Bloqueado</span>
        </div>
      </section>

      <section className="dcm-selected-card" aria-live="polite" aria-label="Reto seleccionado">
        <div className="dcm-selected-copy">
          <span className="dcm-eyebrow">{selected.kind === 'boss' ? '♛ GENERAL' : selected.kind === 'subboss' ? '⚔ SUBJEFE' : selected.kind === 'final' ? '♛ FINAL' : '⚔ MISIÓN'} {Number(selected.id)} DE 38</span>
          <h2>{selected.title}</h2>
          <p>{selected.description}</p>
        </div>
        <div className="dcm-selected-score">
          <MapStars count={bestStars(progress, selected.id)} />
          <small>{selected.difficulty}</small>
        </div>
      </section>

      <footer className="dcm-footer">
        <p className="dcm-lock-note" role="status">🔒 {canGoNext || chapterIndex === STORY_CHAPTERS.length - 1 && completed === CAMPAIGN_MISSIONS.length
          ? 'Puedes repetir cualquier reto superado para mejorar tus estrellas.'
          : 'Derrota el reto actual para desbloquear la siguiente fase.'}</p>
        <button type="button" className="dcm-play" onClick={startSelected} disabled={!isMissionUnlocked(progress, selected.id)}>
          <span aria-hidden="true">⚔</span> Seleccionar reto <span aria-hidden="true">›</span>
        </button>
      </footer>
    </div>
  </main>;
};

export default CampaignMap;
