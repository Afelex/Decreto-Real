import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CAMPAIGN_MISSIONS, bestStars, isMissionUnlocked, loadCampaignProgress,
  type CampaignMission,
} from '../campaign/campaign.ts';
import { STORY_CHAPTERS, chapterForStage, stagesForChapter } from '../campaign/story.ts';
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

/** The chapter map never changes the combat engine. */
const CampaignMap: React.FC = () => {
  const navigate = useNavigate();
  const [progress] = React.useState(() => loadCampaignProgress(readStorage()));
  const nextUnfinished = CAMPAIGN_MISSIONS.find(mission => bestStars(progress, mission.id) === 0);
  const firstChapter = chapterForStage(nextUnfinished?.id ?? '38')?.id ?? 'p';
  const [chapterId, setChapterId] = React.useState(firstChapter);
  const [selected, setSelected] = React.useState<CampaignMission | null>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const lastTrigger = React.useRef<HTMLElement | null>(null);
  const completed = CAMPAIGN_MISSIONS.filter(mission => bestStars(progress, mission.id) > 0).length;
  const totalStars = CAMPAIGN_MISSIONS.reduce((sum, mission) => sum + bestStars(progress, mission.id), 0);
  const chapter = STORY_CHAPTERS.find(item => item.id === chapterId) ?? STORY_CHAPTERS[0];
  const missions = stagesForChapter(chapter.id).map(stage => CAMPAIGN_MISSIONS.find(mission => mission.id === stage.id)!);
  const index = STORY_CHAPTERS.findIndex(item => item.id === chapter.id);
  const activeColor = { '--dc-accent': chapter.color } as React.CSSProperties;

  React.useEffect(() => {
    if (!selected) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setSelected(null); }
      if (event.key === 'Tab') {
        const dialog = document.querySelector<HTMLElement>('.dc-dialog');
        const buttons = [...(dialog?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])];
        if (!buttons.length) return;
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      lastTrigger.current?.focus();
    };
  }, [selected]);

  return <main className="dc-page" style={activeColor}>
    <header className="dc-header">
      <button type="button" onClick={() => navigate('/')} aria-label="Volver al menú">‹ Volver</button>
      <div><small>DECRETO REAL I · MODO HISTORIA</small><h1>El Sello y la Falsa Luz</h1></div>
    </header>

    <section className="dc-progress" aria-label="Progreso de la campaña">
      <div><strong>Tu recorrido</strong><span>{completed === 38 ? 'La campaña ha concluido' : 'El reino aún guarda secretos'}</span></div>
      <div className="dc-progress-numbers"><b>{completed}/{CAMPAIGN_MISSIONS.length}</b><small>misiones</small></div>
      <div className="dc-progress-numbers"><b>★ {totalStars}/{CAMPAIGN_MISSIONS.length * 3}</b><small>estrellas</small></div>
    </section>

    <div className="dc-map-actions">
      <button className="dc-outline" onClick={() => navigate('/campania/historia')}>▣ Ver la historia</button>
      {completed === CAMPAIGN_MISSIONS.length && <button className="dc-outline" onClick={() => navigate('/campania/epilogo')}>✦ Epílogo</button>}
    </div>
    <p className="dc-intro">Avanza por el mapa, vence a los subjefes y generales y descubre quién está detrás de la Falsa Luz. Una victoria abre la siguiente misión; puedes repetirla para obtener tres estrellas.</p>

    <nav className="dc-chapter-strip" aria-label="Capítulos de la campaña">
      {STORY_CHAPTERS.map((item, i) => {
        const stages = stagesForChapter(item.id);
        const opened = stages.some(stage => isMissionUnlocked(progress, stage.id));
        return <button key={item.id} className={`dc-chapter-tab ${item.id === chapter.id ? 'active' : ''}`}
          aria-current={item.id === chapter.id ? 'page' : undefined}
          aria-label={`${item.title}, capítulo ${i + 1} ${opened ? 'disponible' : 'bloqueado'}`}
          onClick={() => setChapterId(item.id)}>
          <span>{i === 0 ? 'PRÓLOGO' : i === 9 ? 'FINAL' : `REGIÓN ${i}`}</span>
          <strong>{item.title}</strong>
          {!opened && <small>◈ Por descubrir</small>}
        </button>;
      })}
    </nav>

    <section className="dc-chapter-hero" aria-label="Historia de esta región">
      <span className="dc-chapter-symbol" aria-hidden="true">✥</span>
      <div><small>{chapter.subtitle}</small><h2>{chapter.title}</h2><p>{chapter.summary}</p>
        <span className="dc-region-label">⌖ {chapter.region}</span>
      </div>
    </section>

    <ol className="dc-trail" aria-label={`Misiones de ${chapter.title}`}>
      {missions.map((mission, i) => {
        const unlocked = isMissionUnlocked(progress, mission.id);
        const stars = bestStars(progress, mission.id);
        return <li key={mission.id} className={`dc-node ${i % 2 ? 'right' : 'left'} ${unlocked ? 'open' : 'locked'} ${mission.kind}`}>
          <button type="button" disabled={!unlocked}
            aria-label={`Misión ${Number(mission.id)}: ${mission.title}. ${unlocked ? `${stars} de 3 estrellas` : 'Bloqueada'}`}
            onClick={event => { lastTrigger.current = event.currentTarget; setSelected(mission); }}
            className="dc-node-button">{unlocked ? (mission.kind === 'boss' || mission.kind === 'final' ? '♛' : Number(mission.id)) : <span aria-hidden="true">♙</span>}</button>
          <div className="dc-node-info">
            <small className="dc-stage-type">{mission.kind === 'final' ? 'ENCUENTRO FINAL' : mission.kind === 'boss' ? 'GENERAL' : mission.kind === 'subboss' ? 'SUBJEFE' : 'MISIÓN' } · {mission.id}/38</small>
            <b>{mission.title}</b>
            {unlocked ? <StarRow count={stars}/> : <small>Completa la misión anterior</small>}
          </div>
        </li>;
      })}
    </ol>
    <div className="dc-chapter-nav">
      <button className="dc-secondary" disabled={index === 0} onClick={() => setChapterId(STORY_CHAPTERS[index - 1].id)}>‹ Anterior</button>
      <button className="dc-primary" disabled={index === STORY_CHAPTERS.length - 1} onClick={() => setChapterId(STORY_CHAPTERS[index + 1].id)}>Siguiente región ›</button>
    </div>
    {chapter.general && <p className="dc-reward-note">Carta especial vinculada al general: <strong>{chapter.specialCard}</strong>. Su uso en combate está reservado para una etapa posterior.</p>}
    <p className="dc-footnote">Las estrellas se guardan en este navegador. El capítulo usa el mismo combate que el duelo libre, con rivales y escenas narrativas de campaña.</p>

    {selected && <div className="dc-overlay" role="presentation" onClick={() => setSelected(null)}>
      <section className="dc-dialog" role="dialog" aria-modal="true" aria-labelledby="dc-mission-title" onClick={event => event.stopPropagation()}>
        <small>MISIÓN {selected.id}/38 · {selected.kind === 'boss' ? 'GENERAL' : selected.kind === 'subboss' ? 'SUBJEFE' : selected.kind === 'final' ? 'FINAL' : 'ENCUENTRO'} · IA {selected.difficulty}</small>
        <h2 id="dc-mission-title">{selected.title}</h2>
        <p>{selected.description}</p>
        <p className="dc-dialogue">«{selected.openingLine.replace(/^[^:]+:\s*[«]?/, '').replace(/[»]$/, '')}»</p>
        <div className="dc-star-goals">
          <div><span>★</span><strong>Gana el duelo</strong></div>
          <div><span>★</span><strong>Conserva {selected.healthGoal} de vida o más</strong></div>
          <div><span>★</span><strong>Gana antes o durante el turno {selected.turnGoal}</strong></div>
        </div>
        <p className="dc-note">Juegas con las reglas y cartas actuales. Cambiar la dificultad durante la misión limita su recompensa a una estrella.</p>
        <button className="dc-primary" onClick={() => navigate(`/campania/mision/${selected.id}`)}>Entrar en la misión</button>
        <button ref={closeRef} className="dc-secondary" onClick={() => setSelected(null)}>Volver al mapa</button>
      </section>
    </div>}
  </main>;
};

export default CampaignMap;
