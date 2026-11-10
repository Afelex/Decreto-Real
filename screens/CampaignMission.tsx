import { getCampaignStorage, isCampaignQaActive } from '../campaign/campaignQA.ts';
import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import GameBoard, { type OriginalBattleOutcome } from './GameBoard';
import { calculateClassicMissionStars } from '../campaign/classicScoring.ts';
import {
  awardMissionStars, bestStars,
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
import BossConfrontation from './BossConfrontation';
import { campaignMissionBackground, campaignOpponentPortrait } from '../campaign/regionAssets.ts';
import { StudioScreenLayers, StudioScreenPanel, StudioScreenProvider, StudioText, useStudioBackground, useStudioTitle } from './studio/StudioScreenKit';
import { useStudio } from './studio/StudioContext';
import './campaign.css';

type MissionOutcome = {
  won: boolean; earned: number; best: number; saved: boolean;
  changedDifficulty: boolean; turns: number; health: number;
};

const getStorage = getCampaignStorage;

/** Story presentation connects the untouched original combat to existing mission progression. */
const CampaignMissionScreen: React.FC = () => {
  const studio = useStudio();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const qaInitialView = isCampaignQaActive() && search.get('qaEscena') === 'combate' ? 'duel'
    : isCampaignQaActive() && search.get('qaEscena') === 'confrontacion' ? 'confrontation' : 'briefing';
  const { missionId } = useParams<{ missionId: string }>();
  const mission = getCampaignMission(missionId);
  const chapter = chapterForStage(missionId ?? '');
  const enemy = enemyForMission(missionId ?? '');
  const originalConversation = mission ? combatConversationForMission(mission.id) : undefined;
  const briefingKey = 'mision-' + (mission?.id ?? '00');
  const briefingTitle = useStudioTitle(briefingKey, mission?.title ?? '');
  const briefingArt = useStudioBackground(briefingKey, '');
  const briefingObjective = mission?.openingLine.includes(':')
    ? mission.openingLine.substring(mission.openingLine.indexOf(':') + 1).trim()
    : mission?.openingLine ?? '';
  // Cada intervención tiene una clave estable, compartida entre juego y DRStudio.
  // Las ediciones no afectan el motor de combate, solo lo que dicen los personajes.
  const speechKey = (phase: string, index: number) =>
    briefingKey + '/' + phase + '-' + String(index + 1).padStart(2, '0');
  const visibleSpeech = (key: string, original: string) => {
    const scene = studio.viewScene(key);
    return studio.visibleTo(scene?.devOnly) ? scene?.dialogue?.text ?? original : original;
  };
  const phases = ['intro', 'midpoint', 'critical', 'victory'] as const;
  const conversation = originalConversation ? {
    ...originalConversation,
    intro: originalConversation.intro.map((line, index) => ({
      ...line, text: visibleSpeech(speechKey('intro', index), line.text),
    })),
    midpoint: originalConversation.midpoint.map((line, index) => ({
      ...line, text: visibleSpeech(speechKey('midpoint', index), line.text),
    })),
    critical: originalConversation.critical.map((line, index) => ({
      ...line, text: visibleSpeech(speechKey('critical', index), line.text),
    })),
    victory: originalConversation.victory.map((line, index) => ({
      ...line, text: visibleSpeech(speechKey('victory', index), line.text),
    })),
  } : undefined;
  const briefingTexts = [
    { key: briefingKey + '/descripcion', label: 'Contexto de la misión', original: mission?.description ?? '' },
    { key: briefingKey + '/objetivo', label: 'Objetivo', original: briefingObjective },
    ...phases.flatMap(phase => (originalConversation?.[phase] ?? []).map((line, index) => ({
      key: speechKey(phase, index),
      label: ({ intro:'Antes del duelo', midpoint:'Mitad del combate', critical:'Rival en peligro', victory:'Después del duelo' })[phase]
        + ' · ' + (line.speaker === 'opponent' ? originalConversation?.opponentName : line.speaker === 'player' ? 'Xervias' : 'Sistema')
        + ' ' + (index + 1),
      original: line.text,
    }))),
  ];
  const [attempt, setAttempt] = React.useState(0);
  const [view, setView] = React.useState<'briefing' | 'confrontation' | 'duel'>(qaInitialView);
  const [outcome, setOutcome] = React.useState<MissionOutcome | null>(null);
  const storage = React.useMemo(getStorage, []);
  const progress = loadCampaignProgress(storage);
  const unlocked = !!mission && isMissionUnlocked(progress, mission.id);
  const mysticalReward = GENERAL_MYSTICS.find(card => card.missionId === mission?.id);
  const legacyAwakened = hasZhinchiLegacy(progress);
  const accent = { '--dc-accent': chapter?.color ?? '#bfa374' } as React.CSSProperties;
  const returnToMap = chapter?.id === 'p'
    ? bestStars(progress, '02') > 0 ? '/campania/generales' : '/campania'
    : chapter ? `/campania/region/${chapter.id}` : '/campania';

  React.useEffect(() => {
    setOutcome(null);
    setAttempt(0);
    setView(qaInitialView);
  }, [missionId, qaInitialView]);

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
        : mission.kind === 'final' ? mission.id === '37' ? '¡Sigumán ha caído...!' : '¡El Decreto Viviente cae!' : '¡Misión superada!'
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
        : mission.id === '35' ? 'El Sello de Mando ha despertado. ¡Ahora puedes utilizar cartas místicas!' : undefined
        : undefined}
      narrative={outcome.won ? mission.victoryLine : mission.defeatLine}
      actions={[
        ...(outcome.won && outcome.saved && mysticalReward ? [{
          label: mission.id === '35' || legacyAwakened ? 'Editar baraja mística ✦' : 'Ver mística sellada ✦',
          onClick: () => navigate('/campania/baraja'),
        }] : []),
        ...(outcome.won && outcome.saved ? [{
          label: mission.id === '38' ? 'Escuchar diálogo final →' : 'Continuar historia →',
          primary: true,
          onClick: () => navigate(`/campania/conversacion/${mission.id}`),
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
    <section className="dc-story-scene dc-briefing-scene" aria-labelledby="dc-scene-title"
      style={briefingArt ? {backgroundImage:'url("'+briefingArt+'")',backgroundSize:'cover',backgroundPosition:'center'} : undefined}>
      <RegionScene chapterId={chapter?.id} missionId={mission.id} formidable={mission.kind === 'boss' || mission.id === '38'}/>
      {mission.kind === 'boss' && <span className="dc-general-banner"><GeneralPortrait chapterId={chapter?.id ?? ''} className="dc-mini-general"/><span>♛ GENERAL DE LA REGIÓN · {mission.title}</span></span>}
      <span className="dc-scene-label">{mission.kind === 'boss' ? 'ENCUENTRO CON GENERAL' : mission.kind === 'subboss' ? 'ENCUENTRO CON SUBJEFE' : mission.kind === 'final' ? 'ENFRENTAMIENTO FINAL' : 'NUEVA MISIÓN'} · {mission.id}/38</span>
      {briefingTitle !== null && <h2 id="dc-scene-title">{briefingTitle}</h2>}
      <p className="dc-scene-location">⌖ {chapter?.region} · {enemy ? `${enemy.role}: ${enemy.name}` : mission.opponent}</p>
      <p className="dc-scene-narration"><StudioText k={briefingKey + '/descripcion'} original={mission.description}/></p>
      <div className="dc-story-conversation">
        <small>{mission.openingLine.includes(':') ? mission.openingLine.split(':', 1)[0] : 'CRÓNICA'}</small>
        <p><StudioText k={briefingKey + '/objetivo'} original={briefingObjective}/></p>
      </div>
      <div className="dc-mission-card">
        {missionStarGoals(mission).map(goal =>
          <div key={goal.id}><span>★</span> {goal.label}</div>)}
      </div>
      <p className="dc-note dc-briefing-note">Combate original: 20 de vida, 10 ataques, 10 defensas, 4 Impactos y 4 Órdenes. Los combos x2 y x3 permiten causar daño o curar vida.{mission.kind === 'boss' ? ' Este general tiene 3 místicas.' : mission.kind === 'final' ? ' Sigumán porta 3 místicas distintas.' : ''}</p>
      <div className="dc-briefing-actions">
        <button className="dc-primary" onClick={() => setView(mission.kind === 'boss' || mission.kind === 'final' ? 'confrontation' : 'duel')}>Preparar combate ⚔</button>
        <button className="dc-secondary" onClick={() => navigate(returnToMap)}>Volver al mapa</button>
      </div>
    </section>
    <StudioScreenLayers sceneKey={briefingKey}/>
    <StudioScreenPanel label={'Misión ' + mission.id + ' · Guion'} sceneKey={briefingKey}
      originalTitle={mission.title} texts={briefingTexts}/>
  </main>;

  if (view === 'confrontation') return <BossConfrontation key={mission.id}
    mission={mission}
    alreadyDefeated={bestStars(progress, mission.id) > 0}
    legacyAwakened={legacyAwakened}
    onBeginBattle={() => setView('duel')}
    onBack={() => setView('briefing')}
  />;

  return <GameBoard
    key={`${mission.id}-${attempt}`}
    onOutcome={onClassicOutcome}
    storyConversation={conversation}
    playerMysticSlots={legacyAwakened ? loadMysticSlots(storage, progress) : []}
    opponentMysticSlots={mission ? bossMysticSlots(mission.id) : []}
    presentation={{ background: campaignMissionBackground(mission.id) ?? '/Decreto-Real/escenarios/plaza-virreinal-v2.svg', opponentPortrait: campaignOpponentPortrait(mission.id) }}
    onReturn={() => navigate(returnToMap)}
  />;
};

const CampaignMission: React.FC = () => <StudioScreenProvider><CampaignMissionScreen/></StudioScreenProvider>;

export default CampaignMission;
