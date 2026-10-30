import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCombat, type CombatState } from '../game/combatEngine.ts';
import { DuelBoard } from './DuelBoard';
import {
  CAMPAIGN_MISSIONS, awardMissionStars, bestStars, calculateMissionStars,
  getCampaignMission, isMissionUnlocked, loadCampaignProgress, saveCampaignProgress,
} from '../campaign/campaign.ts';
import './campaign.css';

type MissionOutcome = {
  won: boolean;
  earned: number;
  best: number;
  saved: boolean;
  changedDifficulty: boolean;
  turns: number;
  health: number;
};

const getStorage = (): Storage | null => {
  try { return typeof window !== 'undefined' ? window.localStorage : null; }
  catch { return null; }
};

/** Wraps the existing duel without modifying its motor or save slot. */
const CampaignMission: React.FC = () => {
  const navigate = useNavigate();
  const { missionId } = useParams<{ missionId: string }>();
  const mission = getCampaignMission(missionId);
  const [attempt, setAttempt] = React.useState(0);
  const [outcome, setOutcome] = React.useState<MissionOutcome | null>(null);
  const storage = React.useMemo(getStorage, []);
  const initial = React.useMemo(
    () => createCombat(mission?.seed ?? 1, mission?.difficulty ?? 'Aprendiz'),
    [mission?.seed, mission?.difficulty, attempt],
  );
  const unlocked = !!mission && isMissionUnlocked(loadCampaignProgress(storage), mission.id);
  const index = mission ? CAMPAIGN_MISSIONS.findIndex(item => item.id === mission.id) : -1;
  const next = CAMPAIGN_MISSIONS[index + 1];
  const retry = () => { setAttempt(value => value + 1); setOutcome(null); };

  const onStateChange = (state: CombatState) => {
    if (!mission || state.phase !== 'finished' || outcome) return;
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

  if (outcome) return <main className="dc-page dc-center">
    <div className="dc-result-card">
      <small>CAPÍTULO I · MISIÓN {mission.id}</small>
      <h1>{outcome.won ? '¡Misión superada!' : 'El duelo continúa pendiente'}</h1>
      <h2>{mission.title}</h2>
      <p>{outcome.won ? 'Has abierto el siguiente tramo del camino.' : 'No has vencido al rival esta vez. Puedes volver a intentarlo.'}</p>
      <div className="dc-result-stars" role="img" aria-label={`${outcome.earned} de 3 estrellas`}>
        {[0, 1, 2].map(i => <span key={i} className={i < outcome.earned ? 'earned' : ''}>★</span>)}
      </div>
      <p>{outcome.won ? `Mejor marca: ${outcome.best}/3 estrellas` : 'Consigue una victoria para desbloquear la próxima misión.'}</p>
      <div className="dc-result-stats"><span>Turno <b>{outcome.turns}</b></span><span>Vida restante <b>{outcome.health}</b></span></div>
      {outcome.changedDifficulty && outcome.won && <p className="dc-warning">Cambiaste la dificultad del rival. Esta partida concede una estrella como máximo.</p>}
      {!outcome.saved && <p role="alert" className="dc-warning">No se pudo guardar tu progreso en este navegador.</p>}
      {outcome.won && next && outcome.saved && <button className="dc-primary" onClick={() => navigate(`/campania/mision/${next.id}`)}>Siguiente misión →</button>}
      <button className="dc-primary" onClick={retry}>Repetir duelo</button>
      <button className="dc-secondary" onClick={() => navigate('/campania')}>Volver al mapa</button>
    </div>
  </main>;

  return <DuelBoard
    key={`${mission.id}-${attempt}`}
    initial={initial}
    onExit={() => navigate('/campania')}
    onNewGame={retry}
    onStateChange={onStateChange}
  />;
};

export default CampaignMission;
