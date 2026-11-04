import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import GameBoard, { type OriginalBattleOutcome } from './GameBoard';
import { calculateClassicMissionStars } from '../campaign/classicScoring.ts';
import {
  CAMPAIGN_MISSIONS, awardMissionStars, bestStars,
  getCampaignMission, isMissionUnlocked, loadCampaignProgress, saveCampaignProgress,
} from '../campaign/campaign.ts';
import { chapterForStage } from '../campaign/story.ts';
import { combatConversationForMission } from '../campaign/combatDialogues.ts';
import { enemyForMission } from '../campaign/characters.ts';
import { loadMysticSlots, hasZhinchiLegacy } from '../campaign/mysticDeck.ts';
import { bossMysticSlots, GENERAL_MYSTICS } from '../game/mysticCards.ts';
import { missionStarGoals } from '../campaign/progressView.ts';
import BattleResultScreen from './BattleResultScreen';
import { RegionScene } from './RegionScene';
import { GeneralPortrait } from './GeneralPortrait';
import './campaign.css';

type MissionOutcome = {
  won: boolean; earned: number; best: number; saved: boolean;
  changedDifficulty: boolean; turns: number; health: number;
};

const getStorage = (): Storage | null => {
  try { return typeof window !== 'undefined' ? window.localStorage : null; }
  catch { return null; }
};

/** Story presentation connects the untouched original combat to existing mission progression. */
const CampaignMission: React.FC = () => {
  const navigate = useNavigate();
  const { missionId } = useParams<{ missionId: string }>();
  const mission = getCampaignMission(missionId);
  const chapter = chapterForStage(missionId ?? '');
  const enemy = enemyForMission(missionId ?? '');
  const conversation = mission ? combatConversationForMission(mission.id) : undefined;
  const [attempt, setAttempt] = React.useState(0);
  const [view, setView] = React.useState<'briefing' | 'duel'>('briefing');
  const [outcome, setOutcome] = React.useState<MissionOutcome | null>(null);
  const storage = React.useMemo(getStorage, []);
  const progress = loadCampaignProgress(storage);
  const unlocked = !!mission && isMissionUnlocked(progress, mission.id);
  const mysticalReward = GENERAL_MYSTICS.find(card => card.missionId === mission?.id);
  const legacyAwakened = hasZhinchiLegacy(progress);
  const index = mission ? CAMPAIGN_MISSIONS.findIndex(item => item.id === mission.id) : -1;
  const next = CAMPAIGN_MISSIONS[index + 1];
  const nextRegion = next && next.chapterId !== mission?.chapterId ? chapterForStage(next.id) : null;
  const accent = { '--dc-accent': chapter?.color ?? '#bfa374' } as React.CSSProperties;
  const returnToMap = chapter && chapter.id !== 'p' ? `/campania/region/${chapter.id}` : '/campania';

  React.useEffect(() => {
    setOutcome(null);
    setAttempt(0);
    setView('briefing');
  }, [missionId]);

  const retry = () => { setAttempt(value => value + 1); setOutcome(null); setView('duel'); };

  const onClassicOutcome = (result: OriginalBattleOutcome) => {
    if (!mission || outcome || view !== 'duel') return;
    const earned = calculateClassicMissionStars(mission, result);
    const oldProgress = loadCampaignProgress(storage);
    const newProgress = result.won ? awardMissionStars(oldProgress, mission.id, earned) : oldProgress;
    const saved = result.won ? saveCampaignProgress(storage, newProgress) : true;
    setOutcome({
      won: result.won, earned, best: bestStars(newProgress, mission.id), saved,
      changedDifficulty: false, turns: result.turns, health: result.health,
    });
  };

  if (!mission || !unlocked) return <main className="dc-page dc-center dc-full-page">
    <h1>Misión no disponible</h1>
    <p>Completa las misiones anteriores para desbloquear este camino.</p>
    <button className="dc-primary" onClick={() => navigate(returnToMap)}>Volver al mapa</button>
  </main>;

  if (outcome) {
    const heading = outcome.won
      ? mission.kind === 'boss' ? '¡General derrotado!'
        : mission.kind === 'final' ? '¡La Revolución Solar cae!' : '¡Misión superada!'
      : 'Misión fallida';

    return <BattleResultScreen
      won={outcome.won}
      heading={heading}
      stats={[
        { label: 'Turnos', value: outcome.turns },
        { label: 'Vida restante', value: outcome.health },
        { label: 'Estrellas', value: `${outcome.earned}/3` },
        { label: 'Mejor marca', value: `${outcome.best}/3` },
      ]}
      warning={!outcome.saved ? 'No se pudo guardar tu progreso en este navegador.' : undefined}
      reward={outcome.won && outcome.saved ? mysticalReward
        ? `Carta mística de ${mysticalReward.owner} añadida a tu colección${legacyAwakened ? '.' : ' (sellada).'}`
        : mission.id === '36' ? 'El bastón de Zhinchi despierta tus cartas místicas. ¡Editar baraja desbloqueado!' : undefined
        : undefined}
      narrative={outcome.won ? mission.victoryLine : mission.defeatLine}
      actions={[
        ...(outcome.won && outcome.saved && (mysticalReward || mission.id === '36') ? [{
          label: mission.id === '36' || legacyAwakened ? 'Editar baraja mística ✦' : 'Ver mística sellada ✦',
          onClick: () => navigate('/campania/baraja'),
        }] : []),
        ...(outcome.won && !next ? [{
          label: 'Leer epílogo ✦',
          primary: true,
          onClick: () => navigate('/campania/epilogo'),
        }] : []),
        ...(outcome.won && mission.id === '02' && outcome.saved ? [{
          label: 'Conocer a los generales →',
          primary: true,
          onClick: () => navigate('/campania/generales?intro=1'),
        }] : []),
        ...(outcome.won && next && outcome.saved && mission.id !== '02' ? [{
          label: nextRegion ? 'Volver al mapa de las ocho zonas →' : 'Siguiente misión →',
          primary: true,
          onClick: () => {
            if (nextRegion) { navigate('/campania/generales'); return; }
            setOutcome(null);
            setAttempt(0);
            setView('briefing');
            navigate(`/campania/mision/${next.id}`);
          },
        }] : []),
        { label: 'Repetir combate', onClick: retry },
        { label: 'Volver al mapa', onClick: () => navigate(returnToMap) },
      ]}
    />;
  }

  if (view === 'briefing') return <main className="dc-page dc-full-page dc-story-page dc-mission-briefing" style={accent}>
    <header className="dc-header">
      <button type="button" onClick={() => navigate(returnToMap)}>‹ Mapa</button>
      <div><small>DECRETO REAL I · HISTORIA</small><h1>{chapter?.title ?? 'Camino de campaña'}</h1></div>
    </header>
    <section className="dc-story-scene dc-briefing-scene" aria-labelledby="dc-scene-title">
      <RegionScene chapterId={chapter?.id} formidable={mission.kind === 'boss' || mission.kind === 'final'}/>
      {mission.kind === 'boss' && <span className="dc-general-banner"><GeneralPortrait chapterId={chapter?.id ?? ''} className="dc-mini-general"/><span>♛ GENERAL DE LA REGIÓN · {mission.title}</span></span>}
      <span className="dc-scene-label">{mission.kind === 'boss' ? 'ENCUENTRO CON GENERAL' : mission.kind === 'subboss' ? 'ENCUENTRO CON SUBJEFE' : mission.kind === 'final' ? 'ENFRENTAMIENTO FINAL' : 'NUEVA MISIÓN'} · {mission.id}/38</span>
      <h2 id="dc-scene-title">{mission.title}</h2>
      <p className="dc-scene-location">⌖ {chapter?.region} · {enemy ? `${enemy.role}: ${enemy.name}` : mission.opponent}</p>
      <p className="dc-scene-narration">{mission.description}</p>
      <div className="dc-story-conversation">
        <small>{mission.openingLine.includes(':') ? mission.openingLine.split(':', 1)[0] : 'CRÓNICA'}</small>
        <p>{mission.openingLine.includes(':') ? mission.openingLine.substring(mission.openingLine.indexOf(':') + 1).trim() : mission.openingLine}</p>
      </div>
      <div className="dc-mission-card">
        {missionStarGoals(mission).map(goal =>
          <div key={goal.id}><span>★</span> {goal.label}</div>)}
      </div>
      <p className="dc-note dc-briefing-note">Combate original: 20 de vida, 10 ataques, 10 defensas, 4 Impactos y 4 Órdenes. Los combos x2 y x3 permiten causar daño o curar vida.{mission.kind === 'boss' ? ' Este general tiene 3 místicas.' : mission.kind === 'final' ? ' Sigumán porta 3 místicas distintas.' : ''}</p>
      <div className="dc-briefing-actions">
        <button className="dc-primary" onClick={() => setView('duel')}>Preparar combate ⚔</button>
        <button className="dc-secondary" onClick={() => navigate(returnToMap)}>Volver al mapa</button>
      </div>
    </section>
  </main>;

  return <GameBoard
    key={`${mission.id}-${attempt}`}
    onOutcome={onClassicOutcome}
    storyConversation={conversation}
    playerMysticSlots={legacyAwakened ? loadMysticSlots(storage, progress) : []}
    opponentMysticSlots={mission ? bossMysticSlots(mission.id) : []}
    presentation={{ background: '/Decreto-Real/escenarios/plaza-virreinal-v2.svg' }}
    onReturn={() => navigate(returnToMap)}
  />;
};

export default CampaignMission;
