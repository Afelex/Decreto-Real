import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StudioBoardPanel, StudioBoardProvider, useBoardStudio } from './studio/StudioBoardKit';
import { NarrativePortrait } from './studio/NarrativePortrait';
import { OPPONENT_IMG, PLAYER_IMG } from '../constants';
import { CardData, GamePhase, CardType } from '../types';
import { useAudio } from '../contexts/AudioContext';
import {scheduleNarrativeMusic,scheduleNarrativeSound,
  DEFAULT_NARRATIVE_TIMING,type AudioTimelineTimer} from '../campaign/studio/audioTimeline.ts';
import { AiTurnController, runOpponentTurn } from '../game/aiTurn';
import { cardPlacementPrompt, checkCardPlacement, resolveVisualDropZone, type CardDropZone } from '../game/cardPlacement.ts';
import { CardActivationBanner } from './CardActivationBanner';
import { LastDecreeIndicator } from './LastDecreeIndicator';
import './hud-g3.css';
import { ComboEffectOverlay } from './ComboEffectOverlay';
import { comboEffectCue, DECREE_BANNER_DURATION_MS } from '../game/effectCues';
import { TurnIndicator, TurnAnnouncement, ComboChoicePanel, CoinTossPanel } from './CombatEventUI';
import { resolveBattleScenery } from '../game/battleScenery';
import { getRoyalCardText } from '../game/royalCardText';
import { resolveBattleEnd, resolveSurrender, resolveDevelopmentVictory, type BattleEndResult } from '../game/battleEnd';
import { BattleSceneryLayer } from './BattleSceneryLayer';
import StorySpeechPanel from './StorySpeechPanel';
import type { CombatConversation } from '../campaign/combatDialogues.ts';
import { GUIDED_STEPS, GUIDED_ACTION_CARDS, arrangeGuidedDeck, guidedActionForCard, type GuidedAction } from '../campaign/guidedOpeningDuel';
import {
  insertMystics, mysticPower, mysticPowerText, mysticDisplayName, resolveMysticPower,
  canActivateMystic, type MysticId, type MysticSlot, type MysticPower,
} from '../game/mysticCards.ts';

// --- GAME CONFIGURATION ---
const MAX_HP = 20;
const INITIAL_HAND_SIZE = 3;
const ATTACK_DAMAGE = 2;
const GAUGE_MAX = 3;
const SPECIAL_VALUE = 3;
/** TODO BEFORE RELEASE: remove this QA-only win control and outcome.
 * Visible automatically in Vite dev or only on an explicit hosted test URL
 * such as ?drDev=1#/game (including campaign missions).
 */
const SHOW_DEV_WIN = import.meta.env.DEV ||
  (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('drDev') === '1');

/** G3 approved HUD graphics. Each asset is separate so artists can replace
 * it later without editing an atlas or changing game rules and hit areas. */
const HUD_G3 = `${import.meta.env.BASE_URL}interfaz/hud-g3/`;
const PortraitOrnament: React.FC = () => (
  <span className="dr-royal-portrait-ornament" aria-hidden="true">
    <img className="dr-royal-portrait-art-image" src={`${HUD_G3}retrato_marco.webp`}
      alt="" draggable={false}/>
  </span>
);
const EndTurnOrnament: React.FC<{ disabled: boolean }> = ({ disabled }) => (
  <span className="dr-royal-finish-ornament" aria-hidden="true"
    data-state={disabled ? 'disabled' : 'active'}>
    <img className="dr-royal-finish-art-image" src={`${HUD_G3}fin_turno.webp`}
      alt="" draggable={false}/>
  </span>
);

// --- ASSETS ---
// Artes aprobadas, servidas desde el propio juego para que funcionen en GitHub Pages.
// Impacto I–FINAL comparten ilustración; se mantienen rangos y mecánicas.
const IMG_ATTACK = `${import.meta.env.BASE_URL}cartas/decreto-ataque.webp`;
const IMG_DEFEND = `${import.meta.env.BASE_URL}cartas/decreto-defensa.webp`;
const IMG_ORDER = `${import.meta.env.BASE_URL}cartas/decreto-orden.webp?v=20261103`;
const IMG_IMPACT = `${import.meta.env.BASE_URL}cartas/decreto-impacto.webp?v=20261103`;

// --- DECK GENERATION & UTILS ---
const generateDeck = (playerIdPrefix: string, mysticSlots: readonly MysticSlot[] = []): CardData[] => {
  let deck: CardData[] = [];
  deck.push({ id: `${playerIdPrefix}-imp-1`, type: 'IMPACT', rank: 1, name: 'Impacto I', description: 'Sello + Drenar 1', cost: 0, img: IMG_IMPACT });
  deck.push({ id: `${playerIdPrefix}-imp-2`, type: 'IMPACT', rank: 2, name: 'Impacto II', description: 'Sello + Drenar 1', cost: 0, img: IMG_IMPACT });
  deck.push({ id: `${playerIdPrefix}-imp-3`, type: 'IMPACT', rank: 3, name: 'Impacto III', description: 'Sello + Drenar 1', cost: 0, img: IMG_IMPACT });
  deck.push({ id: `${playerIdPrefix}-imp-4`, type: 'IMPACT', rank: 4, name: 'Impacto Final', description: 'VICTORIA', cost: 0, img: IMG_IMPACT });

  for (let i = 0; i < 10; i++) {
    deck.push({ id: `${playerIdPrefix}-atk-${i}`, type: 'ATTACK', name: 'Decreto de Ataque', description: `-${ATTACK_DAMAGE} HP al Rival`, cost: 0, img: IMG_ATTACK });
    deck.push({ id: `${playerIdPrefix}-def-${i}`, type: 'DEFENSE', name: 'Decreto de Defensa', description: '+1 HP Propio', cost: 0, img: IMG_DEFEND });
  }
  for (let i = 0; i < 4; i++) deck.push({ id: `${playerIdPrefix}-ord-${i}`, type: 'ORDER', name: 'Decreto de Orden', description: 'Roba 1 carta extra', cost: 0, img: IMG_ORDER });
  return shuffleArray(insertMystics(deck, mysticSlots, playerIdPrefix));
};

const shuffleArray = <T,>(array: T[]): T[] => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

type MysticSummon = { name: string; hp: number; attack: number };

type EffectType = 'ATTACK' | 'DEFENSE' | 'IMPACT' | 'SPECIAL_ATTACK' | 'SPECIAL_HEAL' | null;
type EffectTarget = 'PLAYER' | 'OPPONENT' | 'GLOBAL' | null;

function useFitScale(baseW = 430, baseH = 932) {
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);
  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return useMemo(() => Math.max(0.62, Math.min(1, Math.min(vw / baseW, vh / baseH))), [vw, vh, baseW, baseH]);
}

/** Original game, unchanged in free play. The optional bridge only reports a
 * finished match to the campaign; cards, coin, AI, visuals and SFX stay original. */
export type OriginalBattleOutcome = Readonly<{ won: boolean; turns: number; health: number }>;
export type BattlePresentation = Readonly<{
  background?: string;
  /** Optional per-battle animation. Null explicitly disables animation. */
  backgroundVideo?: string | null;
  playerPortrait?: string;
  opponentPortrait?: string;
}>;
type StoryMoment = { kind: 'intro' | 'midpoint' | 'critical' | 'victory'; step: number };
type GameBoardProps = {
  /** Exclusive to story missions; undefined keeps the classic/free duel untouched. */
  storyConversation?: CombatConversation;
  playerMysticSlots?: readonly MysticSlot[];
  opponentMysticSlots?: readonly MysticSlot[];
  /** La carta del legado se reparte en la mano inicial de la misión 35. */
  guaranteedOpeningMysticId?: MysticId;
  /** Guardián presente en el escenario al comenzar la misión. */
  initialOpponentSummon?: MysticSummon;
  onOutcome?: (result: OriginalBattleOutcome) => void;
  onReturn?: () => void;
  presentation?: BattlePresentation;
  guidedOpening?: boolean;
  /** Overlay illustrations for narrated moments; do not replace the fixed HUD portraits. */
  guidedNarrativeSprites?: {player:string;opponent:string};
};
const GameBoardScreen: React.FC<GameBoardProps> = ({ onOutcome, onReturn, presentation, storyConversation, playerMysticSlots, opponentMysticSlots, guidedOpening = false, guidedNarrativeSprites, guaranteedOpeningMysticId, initialOpponentSummon }) => {
  const scenery = resolveBattleScenery(presentation);
  const playerPortrait = presentation?.playerPortrait ?? PLAYER_IMG;
  const rivalPortrait = presentation?.opponentPortrait ?? OPPONENT_IMG;
  const navigate = useNavigate();
  // Studio · Tablero: ajustes visuales por perfil de pantalla (solo QA edita).
  const boardLayoutRef = React.useRef<HTMLDivElement | null>(null);
  const [studioGuidePreview,setStudioGuidePreview] = useState(0);
  const [studioPlayerPreview,setStudioPlayerPreview] = useState(false);
  const [studioMotionReplay,setStudioMotionReplay] = useState(0);
  const [studioParams]=useSearchParams();
  const { playSound, sfxEnabled, musicEnabled, toggleSfx, toggleMusic, setNarrativeMusicMode, setNarrativeMusicTrack } = useAudio();

  const [phase, setPhase] = useState<GamePhase>('INIT');
  const [turnCount, setTurnCount] = useState(0);
  const [whoStarted, setWhoStarted] = useState<'PLAYER' | 'OPPONENT' | null>(null);
  const gameOverRef = useRef(false);
  const campaignOutcomeReported = useRef(false);
  const midpointSpoken = useRef(false);
  const criticalSpoken = useRef(false);
  const [storyMoment, setStoryMoment] = useState<StoryMoment | null>(
    storyConversation ? { kind: 'intro', step: 0 } : null,
  );
  const [battleEnd, setBattleEnd] = useState<BattleEndResult | null>(null);
  const aiController = useRef<AiTurnController | null>(null);
  const [guideIndex, setGuideIndex] = useState(0);
  const guideRef = useRef(0);
  const guideAt = () => guidedOpening ? GUIDED_STEPS[guideRef.current] : undefined;
  const guideAllows = (action: GuidedAction) => !guidedOpening || guideAt()?.action === action;
  const guideAdvance = (action?: GuidedAction) => {
    if (!guidedOpening) return false;
    const step = guideAt();
    if (!step || (action ? step.action !== action : !!step.action)) return false;
    guideRef.current += 1;
    setGuideIndex(guideRef.current);
    return true;
  };
  const currentGuide = guidedOpening ? GUIDED_STEPS[guideIndex] : undefined;
  // Mientras se edita vemos el paso seleccionado; jugando, el paso real.
  // Ambos consumen el MISMO documento de composición publicado de Studio.
  const studioStep=studioParams.get('studio')==='1'
    ? GUIDED_STEPS[studioGuidePreview]?.id : currentGuide?.id;
  const board = useBoardStudio(boardLayoutRef,studioStep,studioPlayerPreview);
  // La vista previa muestra la escena COMPLETA, sin jugar sus acciones.
  const previewNarrativeStep=board.editing?GUIDED_STEPS[studioGuidePreview]:currentGuide;
  const previewNarrativeAction=board.editing?previewNarrativeStep?.action:undefined;
  const currentNarrativeAudio=currentGuide?board.guideAudio(currentGuide):undefined;
  const currentNarrativeTiming=currentGuide?board.guideTiming(currentGuide):DEFAULT_NARRATIVE_TIMING;
  const currentNarrativeTrack=currentGuide?board.guideMusicUrl(currentGuide):null;
  const activeAudioStep=guidedOpening&&!board.editing?currentGuide?.id:undefined;
  const soundRef=useRef(playSound);
  soundRef.current=playSound;
  // Temporizadores individuales: se cancelan cuando el paso cambia o el
  // componente se desmonta. La vista previa nunca reproduce audio sola.
  const audioTimers=useMemo<AudioTimelineTimer<number>>(()=>({
    after:(ms,fn)=>window.setTimeout(fn,ms),
    cancel:id=>window.clearTimeout(id),
  }),[]);
  useEffect(()=>{
    if(!activeAudioStep){
      setNarrativeMusicMode('normal');
      setNarrativeMusicTrack(null);
      return;
    }
    return scheduleNarrativeMusic(currentNarrativeTiming,{
      start:()=>{
        if(currentNarrativeTiming.musicCueMode==='stop'){
          setNarrativeMusicMode('silent');
          return;
        }
        if(currentNarrativeTiming.musicCueMode==='change')
          setNarrativeMusicTrack(currentNarrativeTrack);
        setNarrativeMusicMode(currentNarrativeAudio?.music??'normal');
      },
      stop:()=>setNarrativeMusicMode('silent'),
    },audioTimers);
  },[
    activeAudioStep,currentNarrativeTrack,currentNarrativeAudio?.music,
    currentNarrativeTiming.musicCueMode,currentNarrativeTiming.musicStartDelayMs,
    currentNarrativeTiming.musicStopAfterMs,
    setNarrativeMusicMode,setNarrativeMusicTrack,audioTimers,
  ]);
  useEffect(()=>{
    if(!activeAudioStep)return;
    const sound=currentNarrativeAudio?.sound??'none';
    return scheduleNarrativeSound(sound,currentNarrativeTiming,{
      start:()=>sound==='none'?undefined:soundRef.current(sound),
    },audioTimers);
  },[
    activeAudioStep,currentNarrativeAudio?.sound,
    currentNarrativeTiming.soundDelayMs,currentNarrativeTiming.soundMaxDurationMs,audioTimers,
  ]);
  useEffect(()=>()=>{setNarrativeMusicMode('normal');setNarrativeMusicTrack(null);},
    [setNarrativeMusicMode,setNarrativeMusicTrack]);
  const expectedGuideAction = currentGuide?.action;
  const guidedCardId = expectedGuideAction ? GUIDED_ACTION_CARDS[expectedGuideAction] : undefined;

  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [playerDeck, setPlayerDeck] = useState<CardData[]>([]);
  const playerDeckRef = useRef<CardData[]>([]);
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [playerImpactLevel, setPlayerImpactLevel] = useState(0);
  const [playerImpactPlayedThisTurn, setPlayerImpactPlayedThisTurn] = useState(false);
  const [playerGauge, setPlayerGauge] = useState(0);
  const [playerLastType, setPlayerLastType] = useState<CardType | null>(null);
  // Separate from combo tracking: a ×3 reset must not clear the last card icon.
  const [playerLastDecree, setPlayerLastDecree] = useState<CardType | null>(null);
  const [showSpecialSelection, setShowSpecialSelection] = useState(false);
  const [comboChoice, setComboChoice] = useState<2 | 3>(3);
  const [comboAnnouncement, setComboAnnouncement] = useState<{ id: number; level: 2 | 3; ability: 'DAMAGE' | 'HEAL'; isPlayer: boolean } | null>(null);
  const [mysticComboAnnouncement, setMysticComboAnnouncement] = useState<{ id: number; level: 2 | 3; name: string; effect: string; isPlayer: boolean } | null>(null);

  const [opponentHP, setOpponentHP] = useState(MAX_HP);
  const [opponentDeck, setOpponentDeck] = useState<CardData[]>([]);
  const opponentDeckRef = useRef<CardData[]>([]);
  const [opponentHand, setOpponentHand] = useState<CardData[]>([]);
  const [opponentImpactLevel, setOpponentImpactLevel] = useState(0);
  const [opponentImpactPlayedThisTurn, setOpponentImpactPlayedThisTurn] = useState(false);
  const [opponentGauge, setOpponentGauge] = useState(0);
  const [opponentLastType, setOpponentLastType] = useState<CardType | null>(null);
  const [opponentLastDecree, setOpponentLastDecree] = useState<CardType | null>(null);
  const [playerSummon, setPlayerSummon] = useState<MysticSummon | null>(null);
  const [opponentSummon, setOpponentSummon] = useState<MysticSummon | null>(initialOpponentSummon ?? null);
  const playerSummonRef = useRef<MysticSummon | null>(null);
  const opponentSummonRef = useRef<MysticSummon | null>(initialOpponentSummon ?? null);
  const playerLegacyRef = useRef<{ attack: number; defense: number }>({ attack: 0, defense: 0 });
  const opponentLegacyRef = useRef<{ attack: number; defense: number }>({ attack: 0, defense: 0 });
  const [legacyActive, setLegacyActive] = useState(false);

  const [coinSide, setCoinSide] = useState<'CARA' | 'SELLO' | null>(null);
  const [isCoinFlipping, setIsCoinFlipping] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  const [visualEffect, setVisualEffect] = useState<{ type: EffectType, target: EffectTarget }>({ type: null, target: null });
  const [cardAnnouncement, setCardAnnouncement] = useState<{ id: number; card: CardData; isPlayer: boolean } | null>(null);
  const announcementBusy = useRef(false);
  const announcementCount = useRef(0);
  const announcementClock = useRef(new AiTurnController());
  const cueFinished = useRef<(() => void) | null>(null);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [playHint, setPlayHint] = useState<string | null>(null);
  const [dragAt, setDragAt] = useState<{ id: string; x: number; y: number } | null>(null);
  const gesture = useRef<{ id: string; pointerId: number; startX: number; startY: number; moved: boolean } | null>(null);
  const spentIds = useRef(new Set<string>());

  const turnOwner: 'PLAYER' | 'OPPONENT' | null = whoStarted === null || turnCount === 0 ? null
    : ((whoStarted === 'PLAYER' && turnCount % 2 !== 0) || (whoStarted === 'OPPONENT' && turnCount % 2 === 0)) ? 'PLAYER' : 'OPPONENT';
  const isMuted = !musicEnabled && !sfxEnabled;
  const storyLines = storyMoment && storyConversation ? storyConversation[storyMoment.kind] : [];
  const storySpeech = storyMoment ? storyLines[storyMoment.step] : undefined;
  const advanceStorySpeech = () => {
    playSound('CLICK');
    setStoryMoment(current => {
      if (!current || !storyConversation) return null;
      return current.step + 1 >= storyConversation[current.kind].length
        ? null : { ...current, step: current.step + 1 };
    });
  };
  const latestOpponent = useRef({ hand: opponentHand, health: opponentHP, impactLevel: opponentImpactLevel, impactPlayedThisTurn: opponentImpactPlayedThisTurn, gauge: opponentGauge, lastType: opponentLastType });
  latestOpponent.current = { hand: opponentHand, health: opponentHP, impactLevel: opponentImpactLevel, impactPlayedThisTurn: opponentImpactPlayedThisTurn, gauge: opponentGauge, lastType: opponentLastType };
  const latestPlayer = useRef({ hand: playerHand, health: playerHP, impactLevel: playerImpactLevel, impactPlayedThisTurn: playerImpactPlayedThisTurn });
  latestPlayer.current = { hand: playerHand, health: playerHP, impactLevel: playerImpactLevel, impactPlayedThisTurn: playerImpactPlayedThisTurn };
  const handleGlobalAudioToggle = () => {
    playSound('CLICK');
    if (!isMuted) { if (musicEnabled) toggleMusic(); if (sfxEnabled) toggleSfx(); }
    else { if (!musicEnabled) toggleMusic(); if (!sfxEnabled) toggleSfx(); }
  };

  useEffect(() => {
    const playerPool = generateDeck('p1', playerMysticSlots);
    const rivalPool = generateDeck('ai', opponentMysticSlots);
    const playerCards = guidedOpening ? arrangeGuidedDeck(playerPool, 'player') : [...playerPool];
    if (guaranteedOpeningMysticId && !guidedOpening) {
      const index = playerCards.findIndex(card => card.mysticId === guaranteedOpeningMysticId);
      if (index >= 0) [playerCards[0], playerCards[index]] = [playerCards[index], playerCards[0]];
    }
    const rivalCards = guidedOpening ? arrangeGuidedDeck(rivalPool, 'rival') : rivalPool;
    playerDeckRef.current = playerCards;
    opponentDeckRef.current = rivalCards;
    setPlayerDeck(playerCards);
    setOpponentDeck(rivalCards);
    setPhase('COIN_TOSS');
  }, []);

  const handleCoinToss = () => {
    if (isCoinFlipping || gameOverRef.current || storyMoment || !guideAllows('coin')) return;
    playSound('FLIP');
    setIsCoinFlipping(true);
    // One tap, a single short flip, then the result before battle begins.
    setTimeout(() => {
      if (gameOverRef.current) return; // A surrender during the toss must remain a defeat.
      const isHeads = guidedOpening || Math.random() > 0.5;
      setCoinSide(isHeads ? 'CARA' : 'SELLO');
      setWhoStarted(isHeads ? 'PLAYER' : 'OPPONENT');
      setIsCoinFlipping(false);
      guideAdvance('coin');
       setTimeout(() => { if (!gameOverRef.current) setPhase('START_BANNER'); }, 450);
    }, 500);
  };

  useEffect(() => {
    if (gameOverRef.current) return;
    if (phase === 'START_BANNER') {
      setTimeout(() => {
        if (gameOverRef.current) return;
        drawCards('PLAYER', INITIAL_HAND_SIZE);
        drawCards('OPPONENT', INITIAL_HAND_SIZE);
        setTurnCount(1);
        setPhase('TURN_BANNER');
      }, 1100);
    } else if (phase === 'TURN_BANNER') {
      const currentPlayer = ((whoStarted === 'PLAYER' && turnCount % 2 !== 0) || (whoStarted === 'OPPONENT' && turnCount % 2 === 0)) ? 'PLAYER' : 'OPPONENT';
      setTimeout(() => {
        if (gameOverRef.current) return;
        if (currentPlayer === 'PLAYER') startPlayerTurn();
        else startOpponentTurn();
      }, 1500); // visible WebM transition for both turns
    }
  }, [phase, turnCount]);

  const startPlayerTurn = () => {
    if (gameOverRef.current) return;
    playerLegacyRef.current = { attack: 0, defense: 0 };
    setLegacyActive(false);
    if (playerSummonRef.current) setOpponentHP(hp => Math.max(0, hp - playerSummonRef.current!.attack));
    drawCards('PLAYER', 1);
    setPlayerImpactPlayedThisTurn(false);
    setPhase('PLAYER_TURN');
  };

  const startOpponentTurn = () => {
    if (gameOverRef.current) return;
    opponentLegacyRef.current = { attack: 0, defense: 0 };
    if (opponentSummonRef.current) setPlayerHP(hp => Math.max(0, hp - opponentSummonRef.current!.attack));
    drawCards('OPPONENT', 1);
    setOpponentImpactPlayedThisTurn(false);
    setPhase('OPPONENT_TURN');
  };

  // Advance as soon as the real clip ends; use a pausable fallback for blocked
  // autoplay, unavailable assets, or browsers that never emit an ended event.
  const waitForCue = async (durationMs: number): Promise<boolean> => {
    const mediaEnded = new Promise<boolean>(resolve => {
      cueFinished.current = () => resolve(true);
    });
    const active = await Promise.race([
      mediaEnded,
      announcementClock.current.wait(durationMs),
    ]);
    cueFinished.current = null;
    return active;
  };

  const triggerVisualEffect = (type: EffectType, target: EffectTarget) => {
    setVisualEffect({ type, target });
    if (['ATTACK', 'IMPACT', 'SPECIAL_ATTACK'].includes(type || '')) {
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 500);
    }
    setTimeout(() => setVisualEffect({ type: null, target: null }), type === 'IMPACT' ? 600 : 1200);
  };

  const triggerSpecialAbility = async (user: 'PLAYER' | 'OPPONENT', ability: 'DAMAGE' | 'HEAL', level: 2 | 3): Promise<void> => {
    if (gameOverRef.current || announcementBusy.current) return;
    announcementBusy.current = true;
    if (user === 'PLAYER') setShowSpecialSelection(false);
    setComboAnnouncement({ id: ++announcementCount.current, level, ability, isPlayer: user === 'PLAYER' });
    playSound('IMPACT');
    const active = await waitForCue(comboEffectCue(ability, level).durationMs);
    setComboAnnouncement(null);
    announcementBusy.current = false;
    if (!active || gameOverRef.current) return;

    // The bonus is resolved only AFTER the chosen combo animation finishes.
    const value = level === 2 ? 1 : SPECIAL_VALUE;
    if (user === 'PLAYER') {
      if (level === 3) { setPlayerGauge(0); setPlayerLastType(null); }
      if (ability === 'DAMAGE') setOpponentHP(p => Math.max(0, p - value));
      else setPlayerHP(p => Math.min(MAX_HP, p + value));
    } else {
      if (level === 3) { setOpponentGauge(0); setOpponentLastType(null); }
      if (ability === 'DAMAGE') setPlayerHP(p => Math.max(0, p - value));
      else setOpponentHP(p => Math.min(MAX_HP, p + value));
    }
  };

  const updateGauge = (isPlayer: boolean, cardType: CardType): 0 | 2 | 3 => {
    const previousType = isPlayer ? playerLastType : latestOpponent.current.lastType;
    const previousGauge = isPlayer ? playerGauge : latestOpponent.current.gauge;
    const next = previousType === cardType ? Math.min(GAUGE_MAX, previousGauge + 1) : 1;
    if (isPlayer) { setPlayerLastType(cardType); setPlayerGauge(next); }
    else { setOpponentLastType(cardType); setOpponentGauge(next); }
    return next === 2 || next === 3 ? next : 0;
  };

  const drawCards = (target: 'PLAYER' | 'OPPONENT', amount: number) => {
    // Pure state updates: React StrictMode may call updater functions twice.
    // Avoid triggering setHand inside setDeck's updater, which previously
    // duplicated cards despite removing only one copy from the deck.
    if (target === 'PLAYER') {
      const drawn = playerDeckRef.current.slice(0, amount);
      playerDeckRef.current = playerDeckRef.current.slice(amount);
      setPlayerDeck(playerDeckRef.current);
      if (drawn.length) setPlayerHand(hand => [...hand, ...drawn]);
    } else {
      const drawn = opponentDeckRef.current.slice(0, amount);
      opponentDeckRef.current = opponentDeckRef.current.slice(amount);
      setOpponentDeck(opponentDeckRef.current);
      if (drawn.length) setOpponentHand(hand => [...hand, ...drawn]);
    }
  };

  /** Move real cards between hands: "arrebatar" never duplicates cards or generates new ones. */
  const stealMysticCards = (isPlayer: boolean, amount: number) => {
    if (amount <= 0) return;
    const rivalHand = isPlayer ? latestOpponent.current.hand : latestPlayer.current.hand;
    const taken = rivalHand.slice(-amount);
    if (!taken.length) return;
    const takenIds = new Set(taken.map(card => card.id));
    if (isPlayer) {
      setOpponentHand(prev => prev.filter(card => !takenIds.has(card.id)));
      setPlayerHand(prev => [...prev, ...taken]);
    } else {
      setPlayerHand(prev => prev.filter(card => !takenIds.has(card.id)));
      setOpponentHand(prev => [...prev, ...taken]);
      setSelectedCardId(null); // A robbed card must never remain visually selected.
    }
  };

  /** Las invocaciones retienen sus PV hasta recibir suficientes ataques. */
  const damagePersistentSummon = (attackerIsPlayer: boolean, damage: number): boolean => {
    const ref = attackerIsPlayer ? opponentSummonRef : playerSummonRef;
    if (!ref.current) return false;
    const updated = { ...ref.current, hp: Math.max(0, ref.current.hp - damage) };
    ref.current = updated.hp > 0 ? updated : null;
    if (attackerIsPlayer) setOpponentSummon(ref.current);
    else setPlayerSummon(ref.current);
    return true;
  };

  const activateMysticPower = (isPlayer: boolean, power: MysticPower, mysticName = 'Guardián místico') => {
    const own = isPlayer ? latestPlayer.current : latestOpponent.current;
    const enemy = isPlayer ? latestOpponent.current : latestPlayer.current;
    const result = resolveMysticPower(power, {
      selfHp: own.health, enemyHp: enemy.health, selfSeals: own.impactLevel,
      impactPlayedThisTurn: own.impactPlayedThisTurn,
    });
    if (!result.accepted) return;
    if (power.attackBoost || power.defenseBoost) {
      const boost = { attack: power.attackBoost ?? 0, defense: power.defenseBoost ?? 0 };
      if (isPlayer) { playerLegacyRef.current = boost; setLegacyActive(true); }
      else opponentLegacyRef.current = boost;
    }
    if (power.summon) {
      const guardian = { name: mysticName, hp: power.summon.hp, attack: power.summon.attack };
      if (isPlayer) { playerSummonRef.current = guardian; setPlayerSummon(guardian); }
      else { opponentSummonRef.current = guardian; setOpponentSummon(guardian); }
    }
    if (isPlayer) {
      setPlayerHP(result.selfHp); setOpponentHP(result.enemyHp);
      if (power.impact) { setPlayerImpactLevel(result.selfSeals); setPlayerImpactPlayedThisTurn(true); }
    } else {
      setOpponentHP(result.selfHp); setPlayerHP(result.enemyHp);
      if (power.impact) { setOpponentImpactLevel(result.selfSeals); setOpponentImpactPlayedThisTurn(true); }
    }
    if (power.impact) { playSound('IMPACT'); triggerVisualEffect('IMPACT', 'GLOBAL'); }
    if (result.steal) stealMysticCards(isPlayer, result.steal);
    if (result.draw) drawCards(isPlayer ? 'PLAYER' : 'OPPONENT', result.draw);
  };

  /** Mystic combos are automatic and unique to the LAST Mystic played. */
  const triggerMysticCombo = async (isPlayer: boolean, id: MysticId, level: 2 | 3): Promise<void> => {
    if (gameOverRef.current || announcementBusy.current) return;
    announcementBusy.current = true;
    const power = mysticPower(id, level);
    setMysticComboAnnouncement({
      id: ++announcementCount.current, level, isPlayer,
      name: mysticDisplayName(id), effect: mysticPowerText(power),
    });
    playSound('IMPACT');
    const active = await announcementClock.current.wait(950);
    setMysticComboAnnouncement(null);
    if (active && !gameOverRef.current) {
      activateMysticPower(isPlayer, power, mysticDisplayName(id));
      if (level === 3) {
        if (isPlayer) { setPlayerGauge(0); setPlayerLastType(null); }
        else { setOpponentGauge(0); setOpponentLastType(null); }
      }
    }
    announcementBusy.current = false;
  };

  // Announce a legally placed card BEFORE applying its HP, seal or draw effects.
  // The same pausable clock is used for player and rival animations.
  const playCard = async (card: CardData, isPlayer: boolean): Promise<void> => {
    if (gameOverRef.current || announcementBusy.current) return;
    if (card.type === 'MYSTIC' && !canActivateMystic(card.mysticId,
      isPlayer ? latestPlayer.current.impactPlayedThisTurn : latestOpponent.current.impactPlayedThisTurn)) return;
    announcementBusy.current = true;
    // Update the independent latest-card status for the corresponding hand.
    if (isPlayer) {
      setPlayerLastDecree(card.type);
      setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    } else {
      setOpponentLastDecree(card.type);
      setOpponentHand(prev => prev.filter(c => c.id !== card.id));
    }

    setCardAnnouncement({ id: ++announcementCount.current, card, isPlayer });
    // Sound accompanies the card animation; actual HP/draw effects still wait.
    if (card.type === 'ATTACK' || card.type === 'MYSTIC') playSound('ATTACK');
    else if (card.type === 'DEFENSE') playSound('DEFENSE');
    else if (card.type === 'ORDER') playSound('FLIP');
    const active = await waitForCue(DECREE_BANNER_DURATION_MS);
    if (!active) return; // Unmounted/cancelled: do not mutate the match.
    setCardAnnouncement(null);
    announcementBusy.current = false;
    if (gameOverRef.current) return;

    if (card.type === 'ATTACK') {
      const bonus = isPlayer ? playerLegacyRef.current.attack : opponentLegacyRef.current.attack;
      const damage = ATTACK_DAMAGE + bonus;
      if (!damagePersistentSummon(isPlayer, damage)) {
        if (isPlayer) setOpponentHP(p => Math.max(0, p - damage));
        else setPlayerHP(p => Math.max(0, p - damage));
      }
    } else if (card.type === 'MYSTIC' && card.mysticId) {
      activateMysticPower(isPlayer, mysticPower(card.mysticId as MysticId, 1), mysticDisplayName(card.mysticId as MysticId));
    } else if (card.type === 'DEFENSE') {
      if (isPlayer) setPlayerHP(p => Math.min(MAX_HP, p + 1 + playerLegacyRef.current.defense));
      else setOpponentHP(p => Math.min(MAX_HP, p + 1 + opponentLegacyRef.current.defense));
    } else if (card.type === 'ORDER') {
      drawCards(isPlayer ? 'PLAYER' : 'OPPONENT', 1);
    } else if (card.type === 'IMPACT') {
      playSound('IMPACT'); triggerVisualEffect('IMPACT', 'GLOBAL');
      if (isPlayer) { setPlayerImpactLevel(p => p + 1); setPlayerImpactPlayedThisTurn(true); setOpponentHP(p => Math.max(0, p - 1)); setPlayerHP(p => Math.min(MAX_HP, p + 1)); }
      else { setOpponentImpactLevel(p => p + 1); setOpponentImpactPlayedThisTurn(true); setPlayerHP(p => Math.max(0, p - 1)); setOpponentHP(p => Math.min(MAX_HP, p + 1)); }
    }

    if (isPlayer && guidedOpening) {
      const action = guidedActionForCard(card.id);
      if (action) guideAdvance(action);
    }
    const comboLevel = updateGauge(isPlayer, card.type);
    if (comboLevel) {
      if (card.type === 'MYSTIC' && card.mysticId) {
        await triggerMysticCombo(isPlayer, card.mysticId as MysticId, comboLevel);
      } else if (isPlayer) {
        setComboChoice(comboLevel); setShowSpecialSelection(true);
      } else {
        await triggerSpecialAbility('OPPONENT', latestOpponent.current.health < MAX_HP / 2 ? 'HEAL' : 'DAMAGE', comboLevel);
      }
    }
  };

  const latestPlayCard = useRef(playCard);
  latestPlayCard.current = playCard;

  useEffect(() => {
    if (phase !== 'OPPONENT_TURN') return;
    const controller = new AiTurnController();
    aiController.current = controller;
    if (isMenuOpen) controller.pause();
    if (guidedOpening) {
      // Tactical choice is scripted; HP, combos and animation use normal GameBoard playCard.
      void (async () => {
        if (!await controller.wait(380)) return;
        const attack = latestOpponent.current.hand.find(card => card.type === 'ATTACK');
        if (!attack) return;
        await latestPlayCard.current(attack, false);
        if (!await controller.wait(380) || gameOverRef.current) return;
        const action = guideAt()?.action;
        if (action?.startsWith('rival')) guideAdvance(action);
        setTurnCount(p => p + 1);
        setPhase('TURN_BANNER');
      })();
    } else {
      void runOpponentTurn(controller, () => latestOpponent.current, card => {
        if (!gameOverRef.current) return latestPlayCard.current(card, false);
      }, () => {
        if (!gameOverRef.current) { setTurnCount(p => p + 1); setPhase('TURN_BANNER'); }
      });
    }
    return () => {
      controller.cancel();
      if (aiController.current === controller) aiController.current = null;
    };
  }, [phase]);

  useEffect(() => {
    if (isMenuOpen || storyMoment) { aiController.current?.pause(); announcementClock.current.pause(); }
    else { aiController.current?.resume(); announcementClock.current.resume(); }
  }, [isMenuOpen, storyMoment]);

  // Player-caused thresholds only; never interrupt a playing clip, a choice,
  // or a finished combat. A boss can speak at half HP and again near defeat.
  useEffect(() => {
    if (!storyConversation || storyMoment || gameOverRef.current || isMenuOpen ||
        (phase !== 'PLAYER_TURN' && phase !== 'OPPONENT_TURN') ||
        opponentHP <= 0 || cardAnnouncement || comboAnnouncement ||
        showSpecialSelection || announcementBusy.current) return;
    if (storyConversation.midpoint.length > 0 && !midpointSpoken.current && opponentHP <= MAX_HP / 2) {
      midpointSpoken.current = true;
      setStoryMoment({ kind: 'midpoint', step: 0 });
      return;
    }
    // Two attack damage, a three-point combo, or the next Impacto FINAL.
    if (!criticalSpoken.current && (opponentHP <= Math.max(ATTACK_DAMAGE, SPECIAL_VALUE) || playerImpactLevel >= 3)) {
      criticalSpoken.current = true;
      setStoryMoment({ kind: 'critical', step: 0 });
    }
  }, [storyConversation, storyMoment, phase, opponentHP, playerImpactLevel,
      isMenuOpen, cardAnnouncement, comboAnnouncement, showSpecialSelection]);

  // React StrictMode mounts, cleans up and remounts effects in development.
  // A cancelled clock must never be reused: otherwise a card leaves the hand
  // but its animation completes without applying damage, healing or Impact.
  useEffect(() => {
    const clock = new AiTurnController();
    announcementClock.current = clock;
    return () => clock.cancel();
  }, []);

  // La partida termina en el tablero: no navegar hasta pulsar «Continuar».
  useEffect(() => {
    if (gameOverRef.current) return;
    const result = resolveBattleEnd({ playerHP, opponentHP, playerImpactLevel, opponentImpactLevel });
    if (!result) return;
    gameOverRef.current = true;
    setBattleEnd(result);
    setShowSpecialSelection(false);
    if (result.phase === 'VICTORY' && storyConversation?.victory.length) {
      // The opponent's defeat line (bosses) and Xervias' reply are shown
      // before the existing victory reason and Continue button.
      setStoryMoment({ kind: 'victory', step: 0 });
    }
    setPhase(result.phase);
  }, [playerHP, opponentHP, playerImpactLevel, opponentImpactLevel]);

  useEffect(() => {
    if (phase === 'VICTORY' || phase === 'DEFEAT') {
      playSound(phase === 'VICTORY' ? 'VICTORY' : 'DEFEAT');
    }
  }, [phase]);

  const handleBattleEndContinue = () => {
    if (!battleEnd || campaignOutcomeReported.current || storyMoment || (guidedOpening && guideIndex !== GUIDED_STEPS.length - 1)) return;
    campaignOutcomeReported.current = true; // Evitar doble avance o doble guardado.
    playSound('CLICK');
    if (onOutcome) {
      onOutcome({ won: battleEnd.phase === 'VICTORY', turns: turnCount, health: playerHP });
    } else {
      navigate('/victory', { state: {
        outcome: battleEnd.phase, reason: battleEnd.reason,
        turnCount, playerHP, opponentHP, playerImpactLevel, opponentImpactLevel,
      } });
    }
  };

  const canHandleCards = (!guidedOpening || !!guidedCardId) && phase === 'PLAYER_TURN' && !storyMoment && !showSpecialSelection && !isMenuOpen && !cardAnnouncement && !comboAnnouncement && !announcementBusy.current && !gameOverRef.current;
  const selectedCard = playerHand.find(card => card.id === selectedCardId) ?? null;

  const selectCard = (card: CardData) => {
    if (!canHandleCards || (guidedOpening && guidedCardId !== card.id) || spentIds.current.has(card.id)) return;
    setSelectedCardId(card.id);
    setPlayHint(null);
    playSound('CLICK');
  };

  const placeCard = (card: CardData, zone: CardDropZone) => {
    if (!canHandleCards || (guidedOpening && guidedCardId !== card.id) || spentIds.current.has(card.id) || !playerHand.some(item => item.id === card.id)) return;
    const check = checkCardPlacement(card, resolveVisualDropZone(card, zone), playerImpactLevel, playerImpactPlayedThisTurn);
    if ('message' in check) { setPlayHint(check.message); return; }
    spentIds.current.add(card.id);
    setSelectedCardId(null);
    setPlayHint(null);
    setDragAt(null);
    playCard(card, true);
  };

  const placeSelected = (zone: CardDropZone) => {
    if (selectedCard) placeCard(selectedCard, zone);
  };

  const getZoneAt = (clientX: number, clientY: number): CardDropZone | null => {
    const field = document.querySelector<HTMLElement>('[data-card-drop="field"]');
    if (!field) return null;
    const bounds = field.getBoundingClientRect();
    if (clientX < bounds.left || clientX > bounds.right || clientY < bounds.top || clientY > bounds.bottom) return null;
    for (const element of Array.from(field.querySelectorAll<HTMLElement>('[data-card-drop^="impact-"]'))) {
      const slot = element.getBoundingClientRect();
      if (clientX >= slot.left && clientX <= slot.right && clientY >= slot.top && clientY <= slot.bottom) {
        return element.dataset.cardDrop as CardDropZone;
      }
    }
    return 'field';
  };

  const onCardPointerDown = (event: React.PointerEvent<HTMLButtonElement>, card: CardData) => {
    if (!canHandleCards || (event.pointerType === 'mouse' && event.button !== 0)) return;
    selectCard(card);
    gesture.current = { id: card.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onCardPointerMove = (event: React.PointerEvent<HTMLButtonElement>, card: CardData) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId || current.id !== card.id) return;
    if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) >= 9) current.moved = true;
    if (current.moved) setDragAt({ id: card.id, x: event.clientX, y: event.clientY });
  };

  const onCardPointerUp = (event: React.PointerEvent<HTMLButtonElement>, card: CardData) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId || current.id !== card.id) return;
    gesture.current = null;
    setDragAt(null);
    if (!current.moved) return; // Tap selects; it never spends a card.
    const zone = getZoneAt(event.clientX, event.clientY);
    if (zone) placeCard(card, zone);
    else setPlayHint('Suelta la carta sobre el centro del tablero.');
  };

  const onCardPointerCancel = () => { gesture.current = null; setDragAt(null); };

  // Turn changes and modals discard any pending selection or drag.
  useEffect(() => {
    if (phase !== 'PLAYER_TURN' || showSpecialSelection || !!comboAnnouncement || isMenuOpen) {
      setSelectedCardId(null);
      setDragAt(null);
      gesture.current = null;
    }
  }, [phase, showSpecialSelection, comboAnnouncement, isMenuOpen]);

  const helpText = playHint ?? (selectedCard && selectedCard.type !== 'IMPACT'
    ? `Arrastra ${selectedCard.name} al campo o a una losa.`
    : cardPlacementPrompt(selectedCard, playerImpactLevel));

  const handleEndTurn = () => {
    if (phase !== 'PLAYER_TURN' || storyMoment || (guidedOpening && !expectedGuideAction?.startsWith('end')) || showSpecialSelection || !!comboAnnouncement || announcementBusy.current || gameOverRef.current) return;
    setSelectedCardId(null); setPlayHint(null);
    playSound('CLICK');
    if (guidedOpening && expectedGuideAction?.startsWith('end')) guideAdvance(expectedGuideAction);
    setTurnCount(p => p + 1); setPhase('TURN_BANNER');
  };

  const handleMenuToggle = () => { playSound('CLICK'); setIsMenuOpen(!isMenuOpen); setShowSurrenderConfirm(false); };
  const handleSurrenderRequest = () => { playSound('CLICK'); setShowSurrenderConfirm(true); };
  /** Use the normal battle-end banner and Continue action, never exit directly. */
  const finishManually = (result: BattleEndResult) => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    aiController.current?.cancel();
    announcementClock.current.cancel();
    cueFinished.current?.();
    cueFinished.current = null;
    announcementBusy.current = false;
    setCardAnnouncement(null);
    setComboAnnouncement(null);
    setMysticComboAnnouncement(null);
    setShowSpecialSelection(false);
    setSelectedCardId(null);
    setDragAt(null);
    setIsMenuOpen(false);
    setShowSurrenderConfirm(false);
    setStoryMoment(null);
    setBattleEnd(result);
    setPhase(result.phase);
  };
  const handleSurrenderConfirm = () => { playSound('CLICK'); finishManually(resolveSurrender()); };
  const handleDevelopmentWin = () => {
    if (!SHOW_DEV_WIN) return;
    playSound('CLICK');
    finishManually(resolveDevelopmentVictory());
  };
  const handleSurrenderCancel = () => { playSound('CLICK'); setShowSurrenderConfirm(false); };

  const endTurnUnavailable = (guidedOpening && !expectedGuideAction?.startsWith('end')) || phase !== 'PLAYER_TURN' || !!storyMoment || showSpecialSelection || !!comboAnnouncement || !!mysticComboAnnouncement || isMenuOpen || !!cardAnnouncement || announcementBusy.current;

  const Board = (
    <div ref={boardLayoutRef} className={`dr-classic-screen dr-royal-screen${board.editing ? ' dr-royal-tutorial-studio' : ''}${board.editing&&studioPlayerPreview ? ' dr-royal-player-preview' : ''} bg-[#050505] font-body w-full overflow-hidden select-none flex flex-col relative text-white ${shakeScreen ? 'animate-shake' : ''}`} style={{ width: 'min(100vw, 430px)', height: '100dvh' }}>
      <style>{`
        /* Animaciones para el botón de fuego */
        @keyframes fire-glow { 0%, 100% { box-shadow: 0 0 15px #f59e0b, 0 0 30px #f97316; } 50% { box-shadow: 0 0 25px #fbbf24, 0 0 50px #ef4444; } }
        .fire-button { animation: fire-glow 2s infinite ease-in-out; border: 2px solid #f59e0b !important; background: radial-gradient(circle, #27272a 0%, #000 100%); }
        .fire-layer { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 115%; height: 115%; background: radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%); filter: blur(10px); z-index: 0; }
        
        /* Animaciones generales (Shake, etc) */
        @keyframes shake { 0%, 100% { transform: translate(0,0); } 10%, 30%, 50%, 70%, 90% { transform: translate(-2px, 1px); } 20%, 40%, 60%, 80% { transform: translate(2px, -1px); } }
        .animate-shake { animation: shake 0.5s; }
        
        /* EFECTOS DE BATALLA ORIGINALES */
        @keyframes slash { 0% { opacity: 0; transform: scale(0.5) rotate(-45deg) translateX(-50px); filter: blur(2px); } 50% { opacity: 1; transform: scale(1.2) rotate(-45deg) translateX(0); filter: blur(0px); } 100% { opacity: 0; transform: scale(1.5) rotate(-45deg) translateX(50px); filter: blur(4px); } }
        .slash-effect { animation: slash 0.4s ease-out forwards; will-change: transform, opacity; }

        @keyframes healPulse { 0% { transform: scale(0.8); opacity: 0; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 50% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 30px 15px rgba(34, 197, 94, 0.5); } 100% { transform: scale(1.2); opacity: 0; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }
        .heal-effect { animation: healPulse 0.8s ease-out forwards; will-change: transform, opacity, box-shadow; }

        @keyframes specialBurst { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.5); opacity: 1; filter: brightness(2); } 100% { transform: scale(2); opacity: 0; } }
        .special-burst { animation: specialBurst 0.8s ease-out forwards; }
        
        /* Utiles */
        .gold-leaf-frame { background: linear-gradient(45deg, #8B6F36, #F9E076, #D4AF37, #8B6F36); box-shadow: 0 0 15px rgba(212,175,55,0.4); }
        .text-gold-gradient { background: linear-gradient(to bottom, #fff 0%, #ffd700 50%, #b8860b 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
      `}</style>

      {/* Scene only: all cards, controls and overlays remain live above the animation. */}
      <BattleSceneryLayer {...scenery} />

      {/* --- VISUAL EFFECTS LAYER --- */}
      {visualEffect.type && (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
          {visualEffect.type === 'ATTACK' && (
            <>
              <div className={`absolute w-96 h-1 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_20px_rgba(255,255,255,0.8)] slash-effect ${visualEffect.target === 'PLAYER' ? 'bottom-[20%]' : 'top-[20%]'}`}></div>
              <div className={`absolute w-80 h-6 bg-gradient-to-r from-transparent via-cyan-200 to-transparent blur-md slash-effect ${visualEffect.target === 'PLAYER' ? 'bottom-[20%]' : 'top-[20%]'}`} style={{ animationDelay: '0.05s' }}></div>
            </>
          )}

          {visualEffect.type === 'DEFENSE' && (
            <div className={`absolute w-40 h-40 rounded-full border-4 border-emerald-400 bg-emerald-900/30 heal-effect flex items-center justify-center ${visualEffect.target === 'PLAYER' ? 'bottom-[15%]' : 'top-[15%]'}`}>
              <div className="w-full h-full absolute animate-ping rounded-full border border-emerald-500 opacity-50"></div>
              <span className="material-icons text-6xl text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">verified_user</span>
            </div>
          )}

          {visualEffect.type === 'SPECIAL_ATTACK' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl special-burst"></div>
              <div className="absolute w-2 h-[100vh] bg-white rotate-45 special-burst"></div>
              <div className="absolute w-2 h-[100vh] bg-white -rotate-45 special-burst"></div>
              <span className="material-icons text-9xl text-purple-300 drop-shadow-[0_0_30px_rgba(168,85,247,1)] special-burst">bolt</span>
            </div>
          )}

          {visualEffect.type === 'SPECIAL_HEAL' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl special-burst"></div>
              <div className="absolute w-[400px] h-[400px] border-4 border-blue-400 rounded-full special-burst opacity-50"></div>
              <span className="material-icons text-9xl text-blue-300 drop-shadow-[0_0_30px_rgba(59,130,246,1)] special-burst">health_and_safety</span>
            </div>
          )}

          {visualEffect.type === 'IMPACT' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0 bg-gold-main/20 animate-pulse duration-500"></div>
              <div className="scale-150 animate-bounce text-gold-main drop-shadow-glow opacity-50">
                <span className="material-icons text-8xl">auto_awesome</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real card animation completes before a ×2/×3 combo may be chosen. */}
      {cardAnnouncement && (
        <CardActivationBanner key={cardAnnouncement.id} card={cardAnnouncement.card}
          isPlayer={cardAnnouncement.isPlayer} paused={isMenuOpen}
          onEnded={() => cueFinished.current?.()} />
      )}
      {mysticComboAnnouncement && (
        <div className="dr-mystic-combo-overlay" role="status" aria-live="assertive"
          aria-label={`Combo místico por ${mysticComboAnnouncement.level}: ${mysticComboAnnouncement.name}. ${mysticComboAnnouncement.effect}`}>
          <div className="dr-mystic-combo-content">
            <small>{mysticComboAnnouncement.isPlayer ? 'XERVIAS' : 'PODER RIVAL'}</small>
            <h2>COMBO MÍSTICO ×{mysticComboAnnouncement.level}</h2>
            <strong>{mysticComboAnnouncement.name}</strong>
            <p>{mysticComboAnnouncement.effect}</p>
          </div>
        </div>
      )}
      {/* The selected combo video completes before the bonus damage/healing applies. */}
      {comboAnnouncement && (
        <ComboEffectOverlay key={comboAnnouncement.id} level={comboAnnouncement.level}
          ability={comboAnnouncement.ability} paused={isMenuOpen}
          onEnded={() => cueFinished.current?.()} />
      )}

      {guidedOpening && <button type="button" className="dr-royal-guided-pause" onClick={handleMenuToggle}
        aria-label="Abrir menú de pausa">☰</button>}

      {/* --- MENU MODAL --- */}
      {isMenuOpen && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B0C10] border-2 border-gold-dark p-6 rounded-lg w-full max-w-sm shadow-[0_0_20px_rgba(212,175,55,0.2)] relative">
            <button onClick={handleMenuToggle} className="absolute top-2 right-2 text-gray-500 hover:text-white"><span className="material-icons">close</span></button>
            <h2 className="text-xl font-decorative text-gold-main text-center mb-6 uppercase tracking-widest border-b border-gold-dark/30 pb-2">Pausa</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10">
                <div className="flex items-center gap-2"><span className="material-icons text-gray-400 text-sm">music_note</span><span className="text-gray-300 text-sm">Música</span></div>
                <button onClick={() => { toggleMusic(); playSound('CLICK'); }} className={`text-xs font-bold px-3 py-1 rounded border ${musicEnabled ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}>{musicEnabled ? 'ENCENDIDO' : 'APAGADO'}</button>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10">
                <div className="flex items-center gap-2"><span className="material-icons text-gray-400 text-sm">volume_up</span><span className="text-gray-300 text-sm">Efectos</span></div>
                <button onClick={() => { toggleSfx(); playSound('CLICK'); }} className={`text-xs font-bold px-3 py-1 rounded border ${sfxEnabled ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}>{sfxEnabled ? 'ENCENDIDO' : 'APAGADO'}</button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {!showSurrenderConfirm ? (
                <>
                  <button onClick={handleMenuToggle} className="w-full py-3 bg-gold-dark text-black font-bold uppercase text-sm rounded">Continuar Batalla</button>
                  {!guidedOpening && <button onClick={handleSurrenderRequest} className="w-full py-3 border border-red-900/50 text-red-500 uppercase text-sm rounded">Rendirse</button>}
                  {guidedOpening && onReturn && <button type="button" onClick={onReturn} className="w-full py-3 border border-gold-dark/50 text-amber-200 uppercase text-sm rounded">Volver al menú principal</button>}
                  {SHOW_DEV_WIN && !guidedOpening && <button type="button" data-testid="dev-auto-win"
                    onClick={handleDevelopmentWin} className="w-full py-2 border border-amber-600/50 text-amber-300 uppercase text-xs rounded"
                    title="Temporal: eliminar antes del lanzamiento">⚙ Victoria automática · DEV</button>}
                </>
              ) : (
                <div className="text-center bg-red-900/10 p-4 rounded border border-red-900/30">
                  <p className="text-red-400 text-sm font-bold mb-4">¿Aceptar derrota?</p>
                  <div className="flex gap-3">
                    <button onClick={handleSurrenderConfirm} className="flex-1 py-2 bg-red-800 text-white uppercase text-xs rounded">Sí</button>
                    <button onClick={handleSurrenderCancel} className="flex-1 py-2 border border-gray-600 text-gray-300 uppercase text-xs rounded">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(showSpecialSelection || board.editing && (board.selected==='native-tablero-combo-menu'||previewNarrativeAction?.startsWith('combo'))) && (
        <ComboChoicePanel level={showSpecialSelection?comboChoice:previewNarrativeAction==='combo3'?3:2} preview={board.editing}
          panelProps={board.attrs('native-tablero-combo-menu','')}
          onDamage={() => {
            if (guidedOpening && !guideAllows('combo2')) return;
            void triggerSpecialAbility('PLAYER', 'DAMAGE', comboChoice).then(() => guideAdvance('combo2'));
          }}
          onHeal={() => {
            if (guidedOpening && !guideAllows('combo3')) return;
            void triggerSpecialAbility('PLAYER', 'HEAL', comboChoice).then(() => guideAdvance('combo3'));
          }} />
      )}

      {/* DR-C08 — Scenic playfield. Portraits and the backdrop are independent assets. */}
      <div className={'dr-royal-layout' + (board.editing ? ' dr-board-editing' : '')}
        onClickCapture={board.editing ? event => { event.stopPropagation(); event.preventDefault(); } : undefined}>
        <header className="dr-royal-rival-area" aria-label="Estado del rival">
          <div {...board.attrs('native-tablero-mazo-rival', 'dr-royal-deck dr-royal-rival-deck')}>
            <div className="dr-royal-deck-back">
              <img className="dr-g3-deck-art" src={`${HUD_G3}mazo.webp`} alt="" aria-hidden="true" draggable={false}/>
              <span>{opponentDeck.length}</span><small>MAZO</small>
            </div>
          </div>
          <div {...board.attrs('native-tablero-retrato-rival', 'dr-royal-character')}>
            <div className="dr-royal-character-frame gold-leaf-frame">
              <img src={rivalPortrait} alt="Retrato del rival"/>
              <PortraitOrnament/>
              <div className="dr-royal-hp blue" aria-label={`Vida del rival: ${opponentHP} de ${MAX_HP}`}>HP: {opponentHP}/{MAX_HP}</div>
            </div>

          </div>
          {!guidedOpening && <button {...board.attrs('native-tablero-menu', 'dr-royal-menu-button dr-g3-menu')} type="button" onClick={handleMenuToggle} aria-label="Abrir menú de pausa">
            <img className="dr-g3-menu-art" src={`${HUD_G3}menu.webp`} alt="" aria-hidden="true" draggable={false}/>
          </button>}
        </header>

 <section {...board.attrs('native-tablero-mano-rival', 'dr-royal-rival-hand')} aria-label={`Mano del rival: ${opponentHand.length} cartas ocultas`}>
          <div className="dr-royal-rival-fan" aria-hidden="true">
            {opponentHand.map((card, i) => {
              const distance = i - (opponentHand.length - 1) / 2;
              const step = Math.min(14, 54 / Math.max(1, opponentHand.length - 1));
              return <div key={card.id} className="dr-royal-facedown" style={{
                left: `${50 + distance * step}%`,
                '--rival-card-rotate': `${distance * 7}deg`,
                '--rival-card-rise': `${Math.abs(distance) * 2}px`,
              } as React.CSSProperties}><span className="dr-royal-card-crest">✥</span></div>;
            })}
          </div>
        </section>

        <section className={`dr-royal-field${selectedCard ? ' is-guiding' : ''}${dragAt ? ' is-dragging' : ''}${selectedCard && selectedCard.type !== 'IMPACT' ? ' is-regular' : ''}`}
          style={{ '--arrow-left': selectedCard?.type === 'IMPACT' ? `${((selectedCard.rank ?? 1) - .5) * 25}%` : '50%' } as React.CSSProperties}
          data-card-drop="field" aria-label="Campo central de activación">
          <div {...board.attrs('native-tablero-progreso-rival', 'dr-royal-rival-progress')} role="group"
            aria-label={`Progreso de impactos del rival: ${opponentImpactLevel} de 4`}>
            {[1, 2, 3, 4].map(lvl => {
              const completed = opponentImpactLevel >= lvl;
              const label = lvl === 4 ? 'FINAL' : ['I', 'II', 'III'][lvl - 1];
              return <div key={lvl} className={`dr-royal-rival-progress-slot${completed ? ' completed' : ''}`}
                role="img" aria-label={`Impacto rival ${label}${completed ? ', completado' : ', pendiente'}`}>
                {completed && <img className="dr-royal-impact-card-art" src={IMG_IMPACT} alt=""/>}
                <span className="dr-royal-rival-progress-numeral dr-royal-impact-persistent-label">{label}</span>
              </div>;
            })}
          </div>
          {(opponentSummon || playerSummon) && <div role="status" aria-live="polite" style={{ position:'absolute',zIndex:15,top:'17%',left:'5%',right:'5%',padding:'6px 8px',borderRadius:8,border:'1px solid rgba(225,185,99,.7)',background:'rgba(10,13,24,.91)',fontSize:11,textAlign:'center',color:'#fff' }}>
            {opponentSummon ? `${opponentSummon.name} · ${opponentSummon.hp} PV · ATQ ${opponentSummon.attack} · tus ataques deben destruirlo` : ''}
            {playerSummon ? ` · Tu guardián: ${playerSummon.name} (${playerSummon.hp} PV)` : ''}
          </div>}
          {legacyActive && <div role="status" style={{ position:'absolute',bottom:'12%',left:'5%',right:'5%',fontSize:11,textAlign:'center',color:'#f8d989',zIndex:15 }}>✦ Decreto del Legado activo: +2 Ataque / +2 Defensa</div>}
          <button type="button" className="dr-royal-activation-target" onClick={() => placeSelected('field')}
            disabled={!selectedCard || !canHandleCards || selectedCard.type === 'IMPACT'}
            aria-label="Campo para activar Ataque, Defensa, Orden o Mística">
            <span className="dr-royal-activation-icon" aria-hidden="true">✦</span>
            <span id="dr-royal-help" className="dr-royal-field-prompt" aria-live="polite">{helpText}</span>
          </button>
          <div {...board.attrs('native-tablero-impactos', 'dr-royal-impact-track')} role="group" aria-label="Las cuatro posiciones de Impacto">
            {[1,2,3,4].map(lvl => {
              const completed = playerImpactLevel >= lvl;
              const available = canHandleCards && selectedCard?.type === 'IMPACT' && selectedCard.rank === lvl && lvl === playerImpactLevel + 1 && !playerImpactPlayedThisTurn;
              const label = lvl === 4 ? 'Final' : ['I','II','III'][lvl - 1];
              return <button key={lvl} type="button" data-card-drop={`impact-${lvl}`}
                className={`dr-royal-impact-slot${completed ? ' completed' : ''}${available ? ' available' : ''}`}
                onClick={event => { event.stopPropagation(); placeSelected(`impact-${lvl}` as CardDropZone); }}
                aria-label={`Casilla Impacto ${label}${completed ? ', completado' : ''}`}
                aria-disabled={!available && !(canHandleCards && selectedCard && selectedCard.type !== 'IMPACT')}>
                {completed && <img className="dr-royal-impact-card-art" src={IMG_IMPACT} alt=""/>}
                <span className="dr-royal-impact-numeral dr-royal-impact-persistent-label">{label}</span>
              </button>;
            })}
          </div>
          {((!board.editing&&playerGauge >= 2 && phase === 'PLAYER_TURN') || (board.editing&&(board.selected==='native-tablero-combo'||previewNarrativeAction?.startsWith('combo')))) && <div key={board.editing?'studio-preview':playerGauge} {...board.attrs('native-tablero-combo', `dr-royal-combo combo-${board.editing&&previewNarrativeAction==='combo3'?3:playerGauge>=2?playerGauge:2}`)}
            aria-label={`Combo por ${board.editing&&previewNarrativeAction==='combo3'?3:playerGauge>=2?playerGauge:2}`} role="status"><strong>COMBO</strong><b>×{board.editing&&previewNarrativeAction==='combo3'?3:playerGauge>=2?playerGauge:2}</b><em>de {{ ATTACK: 'Ataque', DEFENSE: 'Defensa', IMPACT: 'Impacto', ORDER: 'Orden' }[playerLastType ?? 'ATTACK']}</em></div>}
        </section>

        <section {...board.attrs('native-tablero-mano-jugador', 'dr-royal-player-hand')} aria-label={`Tu mano: ${playerHand.length} cartas`}>
          <div className="dr-royal-player-fan">
            {playerHand.map((card, i) => {
              const distance = i - (playerHand.length - 1) / 2;
              const step = Math.min(15, 60 / Math.max(1, playerHand.length - 1));
              const selected = selectedCardId === card.id;
              const canUse = canHandleCards && (!guidedOpening || card.id === guidedCardId) &&
                (card.type !== 'IMPACT' || (!playerImpactPlayedThisTurn && card.rank === playerImpactLevel + 1)) &&
                (card.type !== 'MYSTIC' || canActivateMystic(card.mysticId, playerImpactPlayedThisTurn));
              const display = getRoyalCardText(card, ATTACK_DAMAGE);
              return <button key={card.id} type="button"
                className={`dr-royal-hand-card ${card.type.toLowerCase()}${selected ? ' selected' : ''}${!canUse ? ' unavailable' : ''}`}
                style={{ left: `${50 + distance * step}%`, '--fan-rotate': `${distance * 7}deg`,
                  '--fan-rise': `${Math.abs(distance) * 4}px`, zIndex: selected ? 20 : i + 1 } as React.CSSProperties}
                aria-label={`${card.name}: ${card.description}`} aria-pressed={selected}
                aria-describedby="dr-royal-help"
                onPointerDown={event => onCardPointerDown(event, card)}
                onPointerMove={event => onCardPointerMove(event, card)}
                onPointerUp={event => onCardPointerUp(event, card)}
                onPointerCancel={onCardPointerCancel}
                onClick={event => { if (event.detail === 0) selectCard(card); }}>
                <img src={card.img} alt="" draggable={false}/>
                <span className="dr-royal-card-title">{display.title}</span>
                <span className="dr-royal-card-effect">{display.effect}</span>
              </button>;
            })}
          </div>
        </section>

        <footer className="dr-royal-player-area" aria-label="Tus estadísticas y controles">
          <div {...board.attrs('native-tablero-mazo-jugador', 'dr-royal-player-deck')}>
            <button className="dr-royal-audio dr-g3-audio" type="button" onClick={handleGlobalAudioToggle}
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}>
              <img className="dr-g3-audio-art" src={`${HUD_G3}${isMuted ? 'sonido_silenciado.webp' : 'sonido_activado.webp'}`}
                alt="" aria-hidden="true" draggable={false}/>
            </button>
            <div className="dr-royal-deck-back red">
              <img className="dr-g3-deck-art" src={`${HUD_G3}mazo.webp`} alt="" aria-hidden="true" draggable={false}/>
              <span>{playerDeck.length}</span><small>MAZO</small>
            </div>
          </div>
          <div {...board.attrs('native-tablero-retrato-jugador', 'dr-royal-character player')}>
            <div className="dr-royal-character-frame gold-leaf-frame">
              <img src={playerPortrait} alt="Retrato de tu personaje"/>
              <PortraitOrnament/>
              <div className="dr-royal-hp red" aria-label={`Tu vida: ${playerHP} de ${MAX_HP}`}>HP: {playerHP}/{MAX_HP}</div>
            </div>

          </div>
          <button {...board.attrs('native-tablero-fin-turno', 'dr-royal-finish')} type="button" onClick={handleEndTurn}
            disabled={endTurnUnavailable}
            aria-label="Terminar turno" data-art-version="hud-g3">
            <EndTurnOrnament disabled={endTurnUnavailable}/>
            <strong>FIN<br/>TURNO</strong>
          </button>
          {(playerLastDecree || opponentLastDecree) && (
            <div className="dr-last-decree-stack" role="group"
              aria-label="Últimos decretos activados, sobre el botón Fin de turno">
              <LastDecreeIndicator type={opponentLastDecree} side="opponent" />
              <LastDecreeIndicator type={playerLastDecree} side="player" />
            </div>
          )}
        </footer>
      </div>
      <StudioBoardPanel sceneKey={board.sceneKey} profile={board.profile}
        previewGuideIndex={studioGuidePreview} onPreviewGuideIndex={setStudioGuidePreview}
        layoutRef={boardLayoutRef} playerPreview={studioPlayerPreview}
        onPlayerPreview={()=>setStudioPlayerPreview(true)}
        onReplayMotion={()=>setStudioMotionReplay(v=>v+1)}/>
      {board.editing&&studioPlayerPreview&&<button type="button" className="dr-studio-return-from-preview"
        data-testid="studio-player-return" onClick={()=>setStudioPlayerPreview(false)}>
        ↶ Volver a DRStudio <small>Vista visual · partida congelada</small>
      </button>}
      {dragAt && <div className={`dr-royal-drag-ghost ${playerHand.find(card => card.id === dragAt.id)?.type.toLowerCase() ?? ""}`} aria-hidden="true"
        style={{ left: dragAt.x, top: dragAt.y }}>
        <img src={playerHand.find(card => card.id === dragAt.id)?.img ?? IMG_ATTACK} alt=""/>
      </div>}

      {(['rival','player'] as const).map(side=>{
        const id='native-tablero-tutorial-'+(side==='rival'?'rival':'jugador');
        const preview=board.editing&&board.selected===id;
        const current=previewNarrativeStep;
        const visibleWithDialogue=Boolean(current&&board.guidePortraitVisible(current)&&
          (board.guideSpeaker(current)==='Domingo Quispe')===(side==='rival'));
        const sprite=current?board.guideSprite(current):undefined;
        const speaker=side==='rival'?'Domingo Quispe':'Xervias';
        const fallback=side==='rival'?(guidedNarrativeSprites?.opponent??rivalPortrait):
          (guidedNarrativeSprites?.player??playerPortrait);
        // Solo el combate guiado utiliza la expresión de cada intervención.
        // La ilustración existente permanece como respaldo seguro.
        const source=sprite?.speaker===speaker
          ?import.meta.env.BASE_URL+sprite.path:fallback;
        return <NarrativePortrait key={side}
          stepId={current?current.id+(board.editing?':'+studioMotionReplay:''):null}
          visible={Boolean(preview||visibleWithDialogue)} src={source}
          motion={current?board.guideMotion(current):{enter:'fade',exit:'fade',durationMs:320}}
          attrs={board.attrs(id,'dr-royal-guided-actor is-'+side)}/>;
      })}
      {((guidedOpening && currentGuide && !board.editing) || board.editing) && (()=>{
        const step=board.editing?GUIDED_STEPS[studioGuidePreview]:currentGuide!;
        const stepIndex=board.editing?studioGuidePreview:guideIndex;
        const speaker=board.guideSpeaker(step);
        return <section {...board.attrs('native-tablero-tutorial-dialogo',
          'dr-royal-story-coach '+(speaker==='Domingo Quispe'?'is-rival':'is-player')+
          (step.action?' is-guided-action':''))}
          data-testid="campaign-guided-coach" aria-live="polite">
          <div className="dr-royal-story-coach-header">
            <strong>{speaker}</strong>
            <small>Duelo guiado · {stepIndex + 1}/{GUIDED_STEPS.length}</small>
          </div>
          <p>{board.guideText(step)}</p>
          {!step.action
            ? <button type="button" onClick={() => {
                if (board.editing) return;
                if (guideIndex === GUIDED_STEPS.length - 1) handleBattleEndContinue();
                else guideAdvance();
              }}>{stepIndex === GUIDED_STEPS.length - 1 ? 'Ver desenlace ›' : 'Continuar ›'}</button>
            : <small className="dr-royal-story-coach-hint">{step.action.startsWith('rival') ? 'El guardia responde…' :
                  (board.editing?GUIDED_ACTION_CARDS[step.action]:guidedCardId) ? 'Selecciona la carta iluminada y arrástrala al campo.' :
                  step.action === 'coin' ? 'Pulsa la moneda para lanzarla.' :
                  step.action.startsWith('combo') ? 'Elige la opción indicada en el menú de Combo.' :
                  'Pulsa FIN TURNO.'}</small>}
        </section>;
      })()}
      {/* Combat cues are brief overlays; the field remains visible. */}
      {/* Studio muestra ambos rótulos para ajustarlos por separado aunque no sea su turno. */}
      {((board.editing && board.selected!=='native-tablero-turno-jugador') || (!board.editing && turnOwner === 'PLAYER' && (phase === 'PLAYER_TURN' || phase === 'OPPONENT_TURN'))) &&
        <TurnIndicator side="PLAYER" {...board.attrs('native-tablero-turno-jugador', '')}/>}
      {((board.editing && board.selected!=='native-tablero-turno-rival') || (!board.editing && turnOwner === 'OPPONENT' && (phase === 'PLAYER_TURN' || phase === 'OPPONENT_TURN'))) &&
        <TurnIndicator side="OPPONENT" {...board.attrs('native-tablero-turno-rival', '')}/>}
      {/* En modo edición el estandarte seleccionado se muestra inmóvil para ajustarlo. */}
      {board.editing && (board.selected==='native-tablero-turno-jugador'||board.selected==='native-tablero-turno-rival') &&
        <TurnAnnouncement preview variant={board.selected==='native-tablero-turno-jugador'?'player':'opponent'}
          ribbonProps={board.attrs(board.selected,'')}/>}
      {!board.editing && (phase === 'START_BANNER' || phase === 'TURN_BANNER') &&
        <TurnAnnouncement
          variant={phase === 'START_BANNER' ? 'opening' : turnOwner === 'PLAYER' ? 'player' : 'opponent'}
          ribbonProps={phase === 'START_BANNER' ? undefined : board.attrs(turnOwner==='PLAYER'?'native-tablero-turno-jugador':'native-tablero-turno-rival','')}
          turn={turnCount} />}
      {((phase === 'COIN_TOSS' && !storyMoment && !board.editing)||
        (board.editing&&(board.selected==='native-tablero-moneda'||previewNarrativeAction==='coin')))&&
        <CoinTossPanel coinSide={board.editing?null:coinSide} isFlipping={board.editing?false:isCoinFlipping}
          onToss={board.editing?()=>{}:handleCoinToss} preview={board.editing}
          panelProps={board.attrs('native-tablero-moneda','')}/>}
      {storyMoment && storySpeech && storyConversation && (
        <StorySpeechPanel speech={storySpeech} rivalName={storyConversation.opponentName} rivalRole={storyConversation.opponentRole}
          playerPortrait={playerPortrait} rivalPortrait={rivalPortrait}
          step={storyMoment.step + 1} total={storyLines.length}
          onContinue={advanceStorySpeech}/>
      )}

      {battleEnd && !guidedOpening && (phase === 'VICTORY' || phase === 'DEFEAT') && (
        <div className={`dr-royal-end-banner-stage ${battleEnd.phase === 'VICTORY' ? 'is-victory' : 'is-defeat'}`}>
          <section className="dr-royal-end-banner" role="dialog" aria-modal="true"
            aria-labelledby="dr-royal-end-title" aria-describedby="dr-royal-end-reason">
            <h2 id="dr-royal-end-title">{battleEnd.title}</h2>
            <p id="dr-royal-end-reason">{battleEnd.message}</p>
            <button type="button" onClick={handleBattleEndContinue} autoFocus>Continuar</button>
          </section>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-screen overflow-hidden bg-black" style={{ height: '100dvh' }}>
      <div className="w-full h-full flex items-center justify-center">
        <div style={{ width: 'min(100vw, 430px)', height: '100dvh' }}>{Board}</div>
      </div>
    </div>
  );
};

function romanize(num: number) {
  const lookup: any = { IV: 4, I: 1 }; let roman = '';
  for (let i in lookup) { while (num >= lookup[i]) { roman += i; num -= lookup[i]; } }
  return roman;
}

/** Tablero con su capa de Decreto Real Studio (ajustes publicados; edición solo en QA). */
const GameBoard: React.FC<GameBoardProps> = props => <StudioBoardProvider><GameBoardScreen {...props}/></StudioBoardProvider>;

export default GameBoard;
