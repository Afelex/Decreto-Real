import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCombat, type CombatState } from '../game/combatEngine.ts';
import { DuelBoard } from './DuelBoard';
import {
  CAMPAIGN_MISSIONS, awardMissionStars, bestStars, calculateMissionStars,
  getCampaignMission, isMissionUnlocked, loadCampaignProgress, saveCampaignProgress,
} from '../campaign/campaign.ts';
import { chapterForStage } from '../campaign/story.ts';
import './campaign.css';

type MissionOutcome = {
  won: boolean; earned: number; best: number; saved: boolean;
  changedDifficulty: boolean; turns: number; health: number;
};

const getStorage = (): Storage | null => {
  try { return typeof window !== 'undefined' ? window.localStorage : null; }
  catch { return null; }
};

/** Story presentation wraps the existing game engine and never grants new abilities. */
const CampaignMission: React.FC = () => {
  const navigate = useNavigate();
  const { missionId } = useParams<{ missionId: string }>();
  const mission = getCampaignMission(missionId);
  const chapter = chapterForStage(missionId ?? '');
  const [attempt, setAttempt] = React.useState(0);
  const [view, setView] = React.useState<'briefing' | 'duel'>('briefing');
  const [outcome, setOutcome] = React.useState<MissionOutcome | null>(null);
  const storage = React.useMemo(getStorage, []);
  const initial = React.useMemo(
    () => createCombat(mission?.seed ?? 1, mission?.difficulty ?? 'Aprendiz'),
    [mission?.seed, mission?.difficulty, attempt],
  );
  const unlocked = !!mission && isMissionUnlocked(loadCampaignProgress(storage), mission.id);
  const index = mission ? CAMPAIGN_MISSIONS.findIndex(item => item.id === mission.id) : -1;
  const next = CAMPAIGN_MISSIONS[index + 1];
  const accent = { '--dc-accent': chapter?.color ?? '#bfa374' } as React.CSSProperties;

  React.useEffect(() => {
    setOutcome(null);
    setAttempt(0);
    setView('briefing');
  }, [missionId]);

  const retry = () => { setAttempt(value => value + 1); setOutcome(null); setView('duel'); };

  const onStateChange = (state: CombatState) => {
    if (!mission || state.phase !== 'finished' || outcome || view !== 'duel') return;
    const won = state.winner === 'player';
    const changedDifficulty = state.journal.some(entry =>
      entry.action.type === 'difficulty' && entry.action.value !== mission.difficulty,
    );
    const earned = won ? (changedDifficulty ? 1 : calculateMissionStars(mission, state)) : 0;
    const oldProgress = loadCampaignProgress(storage);
    const newProgress = won ? awardMissionStars(oldProgress, mission.id, earned) : oldProgress;
    const saved = won ? saveCampaignProgress(storage, newProgress) : true;
    setOutcome({
      won, earned, best: bestStars(newProgress, mission.id), saved, changedDifficulty,
      turns: state.turn, health: state.playerHp,
    });
  };

  if (!mission || !unlocked) return <main className="dc-page dc-center">
    <h1>Misión no disponible</h1>
    <p>Completa las misiones anteriores para desbloquear este camino.</p>
    <button className="dc-primary" onClick={() => navigate('/campania')}>Volver al mapa</button>
  </main>;

  if (outcome) return <main className="dc-page dc-center" style={accent}>
    <section className="dc-result-card dc-story-result" aria-label="Resultado y crónica de la misión">
      <small>DECRETO REAL I · MISIÓN {mission.id}/38</small>
      <span className="dc-story-emblem" aria-hidden="true">{outcome.won ? '✦' : '✧'}</span>
      <h1>{outcome.won ? mission.kind === 'boss' ? '¡General derrotado!' : mission.kind === 'final' ? '¡La Falsa Luz cae!' : '¡Misión superada!' : 'Misión fallida'}</h1>
      <h2>{mission.title}</h2>
      <p className="dc-scene-narration">{outcome.won ? mission.victoryLine : mission.defeatLine}</p>
      <div className="dc-result-stars" role="img" aria-label={`${outcome.earned} de 3 estrellas`}>
        {[0, 1, 2].map(i => <span key={i} className={i < outcome.earned ? 'earned' : ''}>★</span>)}
      </div>
      <p>{outcome.won ? `Mejor marca: ${outcome.best}/3 estrellas` : 'Consigue una victoria para continuar la historia.'}</p>
      <div className="dc-result-stats"><span>Turno <b>{outcome.turns}</b></span><span>Vida restante <b>{outcome.health}</b></span></div>
      {chapter?.specialCard && mission.kind === 'boss' && outcome.won && <p className="dc-note">Carta del general en la historia: <b>{chapter.specialCard}</b>. Todavía no es una recompensa jugable.</p>}
      {outcome.changedDifficulty && outcome.won && <p className="dc-warning">Cambiaste la dificultad del rival. Esta partida concede una estrella como máximo.</p>}
      {!outcome.saved && <p role="alert" className="dc-warning">No se pudo guardar tu progreso en este navegador.</p>}
      {outcome.won && !next && <button className="dc-primary" onClick={() => navigate('/campania/epilogo')}>Leer epílogo ✦</button>}
      {outcome.won && next && outcome.saved && <button className="dc-primary" onClick={() => { setOutcome(null); setAttempt(0); navigate(`/campania/mision/${next.id}`); }}>Siguiente misión →</button>}
      <button className="dc-secondary" onClick={retry}>Repetir duelo</button>
      <button className="dc-secondary" onClick={() => navigate('/campania')}>Volver al mapa</button>
    </section>
  </main>;

  if (view === 'briefing') return <main className="dc-page dc-story-page" style={accent}>
    <header className="dc-header">
      <button type="button" onClick={() => navigate('/campania')}>‹ Mapa</button>
      <div><small>DECRETO REAL I · HISTORIA</small><h1>{chapter?.title ?? 'Camino de campaña'}</h1></div>
    </header>
    <section className="dc-story-scene" aria-labelledby="dc-scene-title">
      <div className="dc-story-art" aria-hidden="true">
        <div className="dc-story-sun">✥</div>
        <span>{mission.kind === 'boss' || mission.kind === 'final' ? '♛' : '⚔'}</span>
      </div>
      <span className="dc-scene-label">{mission.kind === 'boss' ? 'ENCUENTRO CON GENERAL' : mission.kind === 'subboss' ? 'ENCUENTRO CON SUBJEFE' : mission.kind === 'final' ? 'ENFRENTAMIENTO FINAL' : 'NUEVA MISIÓN'} · {mission.id}/38</span>
      <h2 id="dc-scene-title">{mission.title}</h2>
      <p className="dc-scene-location">⌖ {chapter?.region}</p>
      <p className="dc-scene-narration">{mission.description}</p>
      <div className="dc-story-conversation">
        <small>{mission.opponent === 'Sigma' ? 'SIGMA' : mission.opponent === 'Vile' ? 'VILE' : mission.openingLine.includes(':') ? mission.openingLine.split(':', 1)[0] : 'CRÓNICA'}</small>
        <p>{mission.openingLine.includes(':') ? mission.openingLine.substring(mission.openingLine.indexOf(':') + 1).trim() : mission.openingLine}</p>
      </div>
      <div className="dc-mission-card">
        <div><span>★</span> Gana el duelo</div>
        <div><span>★</span> Conserva al menos {mission.healthGoal} de vida</div>
        <div><span>★</span> Vence hasta el turno {mission.turnGoal}</div>
      </div>
      <p className="dc-note">Rival: {mission.opponent}. Dificultad inicial: {mission.difficulty}. La escena es narrativa; el duelo utiliza el motor y las cartas existentes.</p>
      <button className="dc-primary" onClick={() => setView('duel')}>¡Comenzar duelo! ⚔</button>
      <button className="dc-secondary" onClick={() => navigate('/campania')}>Volver al mapa</button>
    </section>
  </main>;

  return <DuelBoard
    key={`${mission.id}-${attempt}`}
    initial={initial}
    onExit={() => navigate('/campania')}
    onNewGame={retry}
    onStateChange={onStateChange}
    opponentName={mission.opponent}
  />;
};

export default CampaignMission;
