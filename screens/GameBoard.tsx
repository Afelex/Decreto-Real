import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { OPPONENT_IMG, PLAYER_IMG, BATTLE_BG_IMG } from '../constants';
import { CardData, GamePhase, CardType } from '../types';
import { useAudio } from '../contexts/AudioContext';
import { AiTurnController, runOpponentTurn } from '../game/aiTurn';
import { cardPlacementPrompt, checkCardPlacement, type CardDropZone } from '../game/cardPlacement.ts';

// --- GAME CONFIGURATION ---
const MAX_HP = 10;
const INITIAL_HAND_SIZE = 3;
const ATTACK_DAMAGE = 2;
const GAUGE_MAX = 3;
const SPECIAL_VALUE = 3;

// --- ASSETS ---
const IMG_ATTACK = 'https://i.imgur.com/x9iHqkK.png';
const IMG_DEFEND = 'https://i.imgur.com/z9KyWGL_d.webp?maxwidth=760&fidelity=grand';
const IMG_IMPACT = 'https://i.imgur.com/l0ZwqZN_d.webp?maxwidth=760&fidelity=grand';

// --- DECK GENERATION & UTILS ---
const generateDeck = (playerIdPrefix: string): CardData[] => {
  let deck: CardData[] = [];
  deck.push({ id: `${playerIdPrefix}-imp-1`, type: 'IMPACT', rank: 1, name: 'Impacto I', description: 'Sello + Drenar 1', cost: 0, img: IMG_IMPACT });
  deck.push({ id: `${playerIdPrefix}-imp-2`, type: 'IMPACT', rank: 2, name: 'Impacto II', description: 'Sello + Drenar 1', cost: 0, img: IMG_IMPACT });
  deck.push({ id: `${playerIdPrefix}-imp-3`, type: 'IMPACT', rank: 3, name: 'Impacto III', description: 'Sello + Drenar 1', cost: 0, img: IMG_IMPACT });
  deck.push({ id: `${playerIdPrefix}-imp-4`, type: 'IMPACT', rank: 4, name: 'Impacto Final', description: 'VICTORIA', cost: 0, img: IMG_IMPACT });

  for (let i = 0; i < 10; i++) {
    deck.push({ id: `${playerIdPrefix}-atk-${i}`, type: 'ATTACK', name: 'Decreto de Ataque', description: `-${ATTACK_DAMAGE} HP al Rival`, cost: 0, img: IMG_ATTACK });
    deck.push({ id: `${playerIdPrefix}-def-${i}`, type: 'DEFENSE', name: 'Decreto de Defensa', description: '+1 HP Propio', cost: 0, img: IMG_DEFEND });
  }
  return shuffleArray(deck);
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
  playerPortrait?: string;
  opponentPortrait?: string;
}>;
type GameBoardProps = {
  onOutcome?: (result: OriginalBattleOutcome) => void;
  onReturn?: () => void;
  presentation?: BattlePresentation;
};
const GameBoard: React.FC<GameBoardProps> = ({ onOutcome, onReturn, presentation }) => {
  const scenicBackground = presentation?.background ?? `${import.meta.env.BASE_URL}escenarios/plaza-virreinal.svg`;
  const playerPortrait = presentation?.playerPortrait ?? PLAYER_IMG;
  const rivalPortrait = presentation?.opponentPortrait ?? OPPONENT_IMG;
  const navigate = useNavigate();
  const { playSound, sfxEnabled, musicEnabled, toggleSfx, toggleMusic } = useAudio();

  const [phase, setPhase] = useState<GamePhase>('INIT');
  const [turnCount, setTurnCount] = useState(0);
  const [whoStarted, setWhoStarted] = useState<'PLAYER' | 'OPPONENT' | null>(null);
  const [bannerText, setBannerText] = useState("");
  const gameOverRef = useRef(false);
  const campaignOutcomeReported = useRef(false);
  const aiController = useRef<AiTurnController | null>(null);

  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [playerDeck, setPlayerDeck] = useState<CardData[]>([]);
  const playerDeckRef = useRef<CardData[]>([]);
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [playerImpactLevel, setPlayerImpactLevel] = useState(0);
  const [playerImpactPlayedThisTurn, setPlayerImpactPlayedThisTurn] = useState(false);
  const [playerGauge, setPlayerGauge] = useState(0);
  const [playerLastType, setPlayerLastType] = useState<CardType | null>(null);
  const [showSpecialSelection, setShowSpecialSelection] = useState(false);

  const [opponentHP, setOpponentHP] = useState(MAX_HP);
  const [opponentDeck, setOpponentDeck] = useState<CardData[]>([]);
  const opponentDeckRef = useRef<CardData[]>([]);
  const [opponentHand, setOpponentHand] = useState<CardData[]>([]);
  const [opponentImpactLevel, setOpponentImpactLevel] = useState(0);
  const [opponentImpactPlayedThisTurn, setOpponentImpactPlayedThisTurn] = useState(false);
  const [opponentGauge, setOpponentGauge] = useState(0);
  const [opponentLastType, setOpponentLastType] = useState<CardType | null>(null);

  const [coinSide, setCoinSide] = useState<'CARA' | 'SELLO' | null>(null);
  const [isCoinFlipping, setIsCoinFlipping] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  const [visualEffect, setVisualEffect] = useState<{ type: EffectType, target: EffectTarget }>({ type: null, target: null });
  const [shakeScreen, setShakeScreen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [playHint, setPlayHint] = useState<string | null>(null);
  const [dragAt, setDragAt] = useState<{ id: string; x: number; y: number } | null>(null);
  const gesture = useRef<{ id: string; pointerId: number; startX: number; startY: number; moved: boolean } | null>(null);
  const spentIds = useRef(new Set<string>());

  const isMuted = !musicEnabled && !sfxEnabled;
  const latestOpponent = useRef({ hand: opponentHand, health: opponentHP, impactLevel: opponentImpactLevel, gauge: opponentGauge, lastType: opponentLastType });
  latestOpponent.current = { hand: opponentHand, health: opponentHP, impactLevel: opponentImpactLevel, gauge: opponentGauge, lastType: opponentLastType };
  const handleGlobalAudioToggle = () => {
    playSound('CLICK');
    if (!isMuted) { if (musicEnabled) toggleMusic(); if (sfxEnabled) toggleSfx(); }
    else { if (!musicEnabled) toggleMusic(); if (!sfxEnabled) toggleSfx(); }
  };

  useEffect(() => {
    const playerCards = generateDeck('p1');
    const rivalCards = generateDeck('ai');
    playerDeckRef.current = playerCards;
    opponentDeckRef.current = rivalCards;
    setPlayerDeck(playerCards);
    setOpponentDeck(rivalCards);
    setPhase('COIN_TOSS');
  }, []);

  const handleCoinToss = () => {
    if (isCoinFlipping) return;
    playSound('FLIP');
    setIsCoinFlipping(true);
    setTimeout(() => {
      const isHeads = Math.random() > 0.5;
      setCoinSide(isHeads ? 'CARA' : 'SELLO');
      setWhoStarted(isHeads ? 'PLAYER' : 'OPPONENT');
      setTimeout(() => { setPhase('START_BANNER'); setIsCoinFlipping(false); }, 1500);
    }, 1500);
  };

  useEffect(() => {
    if (gameOverRef.current) return;
    if (phase === 'START_BANNER') {
      setBannerText("¡INICIA EL COMBATE!");
      setTimeout(() => {
        if (gameOverRef.current) return;
        drawCards('PLAYER', INITIAL_HAND_SIZE);
        drawCards('OPPONENT', INITIAL_HAND_SIZE);
        setTurnCount(1);
        setPhase('TURN_BANNER');
      }, 2000);
    } else if (phase === 'TURN_BANNER') {
      const currentPlayer = ((whoStarted === 'PLAYER' && turnCount % 2 !== 0) || (whoStarted === 'OPPONENT' && turnCount % 2 === 0)) ? 'PLAYER' : 'OPPONENT';
      setBannerText(`TURNO ${turnCount}: ${currentPlayer === 'PLAYER' ? 'TU TURNO' : 'TURNO DEL RIVAL'}`);
      setTimeout(() => {
        if (gameOverRef.current) return;
        if (currentPlayer === 'PLAYER') startPlayerTurn();
        else startOpponentTurn();
      }, 1500);
    }
  }, [phase, turnCount]);

  const startPlayerTurn = () => {
    if (gameOverRef.current) return;
    drawCards('PLAYER', 1);
    setPlayerImpactPlayedThisTurn(false);
    setPhase('PLAYER_TURN');
  };

  const startOpponentTurn = () => {
    if (gameOverRef.current) return;
    drawCards('OPPONENT', 1);
    setOpponentImpactPlayedThisTurn(false);
    setPhase('OPPONENT_TURN');
  };

  const triggerVisualEffect = (type: EffectType, target: EffectTarget) => {
    setVisualEffect({ type, target });
    if (['ATTACK', 'IMPACT', 'SPECIAL_ATTACK'].includes(type || '')) {
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 500);
    }
    setTimeout(() => setVisualEffect({ type: null, target: null }), type === 'IMPACT' ? 600 : 1200);
  };

  const triggerSpecialAbility = (user: 'PLAYER' | 'OPPONENT', ability: 'DAMAGE' | 'HEAL') => {
    playSound('IMPACT');
    if (user === 'PLAYER') {
      setPlayerGauge(0); setPlayerLastType(null); setShowSpecialSelection(false);
      if (ability === 'DAMAGE') { setOpponentHP(p => Math.max(0, p - SPECIAL_VALUE)); triggerVisualEffect('SPECIAL_ATTACK', 'OPPONENT'); }
      else { setPlayerHP(p => Math.min(MAX_HP, p + SPECIAL_VALUE)); triggerVisualEffect('SPECIAL_HEAL', 'PLAYER'); }
    } else {
      setOpponentGauge(0); setOpponentLastType(null);
      if (ability === 'DAMAGE') { setPlayerHP(p => Math.max(0, p - SPECIAL_VALUE)); triggerVisualEffect('SPECIAL_ATTACK', 'PLAYER'); }
      else { setOpponentHP(p => Math.min(MAX_HP, p + SPECIAL_VALUE)); triggerVisualEffect('SPECIAL_HEAL', 'OPPONENT'); }
    }
  };

  const updateGauge = (isPlayer: boolean, cardType: CardType): boolean => {
    if (cardType === 'IMPACT') {
      if (isPlayer) { setPlayerGauge(0); setPlayerLastType(null); }
      else { setOpponentGauge(0); setOpponentLastType(null); }
      return false;
    }
    let triggered = false;
    if (isPlayer) {
      if (playerLastType === cardType) {
        const newVal = playerGauge + 1; setPlayerGauge(newVal);
        if (newVal >= GAUGE_MAX) triggered = true;
      } else { setPlayerLastType(cardType); setPlayerGauge(1); }
    } else {
      if (latestOpponent.current.lastType === cardType) {
        const newVal = latestOpponent.current.gauge + 1; setOpponentGauge(newVal);
        if (newVal >= GAUGE_MAX) triggered = true;
      } else { setOpponentLastType(cardType); setOpponentGauge(1); }
    }
    return triggered;
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

  const playCard = (card: CardData, isPlayer: boolean) => {
    if (gameOverRef.current) return;
    if (isPlayer) setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    else setOpponentHand(prev => prev.filter(c => c.id !== card.id));

    if (card.type === 'ATTACK') {
      playSound('ATTACK'); triggerVisualEffect('ATTACK', isPlayer ? 'OPPONENT' : 'PLAYER');
      if (isPlayer) setOpponentHP(p => Math.max(0, p - ATTACK_DAMAGE)); else setPlayerHP(p => Math.max(0, p - ATTACK_DAMAGE));
    } else if (card.type === 'DEFENSE') {
      playSound('DEFENSE'); triggerVisualEffect('DEFENSE', isPlayer ? 'PLAYER' : 'OPPONENT');
      if (isPlayer) setPlayerHP(p => Math.min(MAX_HP, p + 1)); else setOpponentHP(p => Math.min(MAX_HP, p + 1));
    } else if (card.type === 'IMPACT') {
      playSound('IMPACT'); triggerVisualEffect('IMPACT', 'GLOBAL');
      if (isPlayer) { setPlayerImpactLevel(p => p + 1); setPlayerImpactPlayedThisTurn(true); setOpponentHP(p => Math.max(0, p - 1)); setPlayerHP(p => Math.min(MAX_HP, p + 1)); }
      else { setOpponentImpactLevel(p => p + 1); setOpponentImpactPlayedThisTurn(true); setPlayerHP(p => Math.max(0, p - 1)); setOpponentHP(p => Math.min(MAX_HP, p + 1)); }
    }

    const specialReady = updateGauge(isPlayer, card.type);
    if (specialReady) {
      if (isPlayer) setTimeout(() => setShowSpecialSelection(true), 600);
      else {
        const controller = aiController.current;
        if (controller) void controller.wait(800).then(active => {
          if (active && !gameOverRef.current) triggerSpecialAbility('OPPONENT', latestOpponent.current.health < 5 ? 'HEAL' : 'DAMAGE');
        });
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
    void runOpponentTurn(controller, () => latestOpponent.current, card => {
      if (!gameOverRef.current) latestPlayCard.current(card, false);
    }, () => {
      if (!gameOverRef.current) { setTurnCount(p => p + 1); setPhase('TURN_BANNER'); }
    });
    return () => {
      controller.cancel();
      if (aiController.current === controller) aiController.current = null;
    };
  }, [phase]);

  useEffect(() => {
    if (isMenuOpen) aiController.current?.pause();
    else aiController.current?.resume();
  }, [isMenuOpen]);

  useEffect(() => {
    if (gameOverRef.current) return;
    if (playerHP <= 0 || opponentImpactLevel === 4) { setPhase('DEFEAT'); gameOverRef.current = true; }
    else if (opponentHP <= 0 || playerImpactLevel === 4) { setPhase('VICTORY'); gameOverRef.current = true; }
  }, [playerHP, opponentHP, playerImpactLevel, opponentImpactLevel]);

  useEffect(() => {
    if (phase === 'VICTORY' || phase === 'DEFEAT') {
      const timer = setTimeout(() => {
        if (onOutcome) {
          if (campaignOutcomeReported.current) return;
          campaignOutcomeReported.current = true;
          playSound(phase === 'VICTORY' ? 'VICTORY' : 'DEFEAT');
          onOutcome({ won: phase === 'VICTORY', turns: turnCount, health: playerHP });
        } else navigate('/victory', { state: { outcome: phase, turnCount } });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const canHandleCards = phase === 'PLAYER_TURN' && !showSpecialSelection && !isMenuOpen && !gameOverRef.current;
  const selectedCard = playerHand.find(card => card.id === selectedCardId) ?? null;

  const selectCard = (card: CardData) => {
    if (!canHandleCards || spentIds.current.has(card.id)) return;
    setSelectedCardId(card.id);
    setPlayHint(null);
    playSound('CLICK');
  };

  const placeCard = (card: CardData, zone: CardDropZone) => {
    if (!canHandleCards || spentIds.current.has(card.id) || !playerHand.some(item => item.id === card.id)) return;
    const check = checkCardPlacement(card, zone, playerImpactLevel, playerImpactPlayedThisTurn);
    if (!check.valid) { setPlayHint(check.message); return; }
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
    if (phase !== 'PLAYER_TURN' || showSpecialSelection || isMenuOpen) {
      setSelectedCardId(null);
      setDragAt(null);
      gesture.current = null;
    }
  }, [phase, showSpecialSelection, isMenuOpen]);

  const helpText = playHint ?? cardPlacementPrompt(selectedCard, playerImpactLevel);

  const handleEndTurn = () => {
    if (phase !== 'PLAYER_TURN' || showSpecialSelection || gameOverRef.current) return;
    setSelectedCardId(null); setPlayHint(null);
    playSound('CLICK'); setTurnCount(p => p + 1); setPhase('TURN_BANNER');
  };

  const handleMenuToggle = () => { playSound('CLICK'); setIsMenuOpen(!isMenuOpen); setShowSurrenderConfirm(false); };
  const handleSurrenderRequest = () => { playSound('CLICK'); setShowSurrenderConfirm(true); };
  const handleSurrenderConfirm = () => { playSound('CLICK'); if (onReturn) onReturn(); else navigate('/'); };
  const handleSurrenderCancel = () => { playSound('CLICK'); setShowSurrenderConfirm(false); };

  const renderGauge = (val: number) => (
    <div className="flex gap-1 mt-1 justify-center">
      {[1, 2, 3].map(v => (
        <div key={v} className={`w-3 h-3 rounded-full border border-stone-600 transition-all duration-300 relative ${v <= val ? 'bg-[#d946ef] shadow-[0_0_8px_#d946ef]' : 'bg-black/50'}`}>
          {v <= val && <div className="absolute inset-0 bg-white opacity-40 animate-pulse rounded-full"></div>}
        </div>
      ))}
    </div>
  );

  const renderImpactSlots = (currentLevel: number) => (
    <div className="flex gap-2 p-1 bg-[#0a0a0a]/80 rounded-lg border border-gold-dark/50 justify-center mt-2">
      {[1, 2, 3, 4].map(lvl => (
        <div key={lvl} className="relative w-4 h-4 flex items-center justify-center">
          {lvl <= currentLevel && <div className="absolute inset-0 bg-gold-main blur-sm animate-pulse"></div>}
          <div className={`absolute inset-0 transition-all duration-700 transform border border-black rotate-45 ${lvl <= currentLevel ? 'bg-gold-main scale-110' : 'bg-stone-800 scale-90'}`}></div>
        </div>
      ))}
    </div>
  );

  const Board = (
    <div className={`dr-classic-screen dr-royal-screen bg-[#050505] font-body w-full overflow-hidden select-none flex flex-col relative text-white ${shakeScreen ? 'animate-shake' : ''}`} style={{ width: 'min(100vw, 430px)', height: '100dvh' }}>
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

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <img src={scenicBackground} alt="" className="dr-royal-background w-full h-full object-cover opacity-100" />
        <div className="absolute inset-0 dr-royal-vignette"></div>
      </div>

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
                  <button onClick={handleSurrenderRequest} className="w-full py-3 border border-red-900/50 text-red-500 uppercase text-sm rounded">Rendirse</button>
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

      {/* --- SPECIAL SELECTION MODAL --- */}
      {showSpecialSelection && (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-300">
          <div className="w-full max-w-md p-6 relative flex flex-col items-center">
            <div className="absolute inset-0 bg-purple-900/20 blur-3xl rounded-full animate-pulse"></div>
            <h2 className="text-3xl font-decorative text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] text-center mb-8 uppercase tracking-widest relative z-10">
              Combo Completo
            </h2>
            <p className="text-gray-300 font-body text-center mb-8 relative z-10 text-sm">
              Tu poder arcano está al máximo. Elige tu destino.
            </p>
            <div className="grid grid-cols-2 gap-6 w-full relative z-10">
              <button
                onClick={() => triggerSpecialAbility('PLAYER', 'DAMAGE')}
                className="group relative flex flex-col items-center p-4 bg-black/60 border border-purple-900 hover:border-purple-500 rounded-lg transition-all hover:bg-purple-900/20 active:scale-95"
              >
                <div className="w-16 h-16 rounded-full bg-purple-900/30 border border-purple-500 flex items-center justify-center mb-3 group-hover:shadow-[0_0_20px_#a855f7]">
                  <span className="material-icons text-3xl text-purple-300">bolt</span>
                </div>
                <span className="font-display font-bold text-white uppercase text-sm mb-1">Furia Real</span>
                <span className="font-body text-xs text-purple-300">{SPECIAL_VALUE} Daño al Rival</span>
              </button>

              <button
                onClick={() => triggerSpecialAbility('PLAYER', 'HEAL')}
                className="group relative flex flex-col items-center p-4 bg-black/60 border border-blue-900 hover:border-blue-500 rounded-lg transition-all hover:bg-blue-900/20 active:scale-95"
              >
                <div className="w-16 h-16 rounded-full bg-blue-900/30 border border-blue-500 flex items-center justify-center mb-3 group-hover:shadow-[0_0_20px_#3b82f6]">
                  <span className="material-icons text-3xl text-blue-300">health_and_safety</span>
                </div>
                <span className="font-display font-bold text-white uppercase text-sm mb-1">Gracia Divina</span>
                <span className="font-body text-xs text-blue-300">Curar {SPECIAL_VALUE} HP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DR-C08 — Scenic playfield. Portraits and the backdrop are independent assets. */}
      <div className="dr-royal-layout">
        <header className="dr-royal-rival-area" aria-label="Estado del rival">
          <div className="dr-royal-deck dr-royal-rival-deck">
            <div className="dr-royal-deck-back"><span>{opponentDeck.length}</span><small>MAZO</small></div>
          </div>
          <div className="dr-royal-character">
            <div className="dr-royal-character-frame gold-leaf-frame">
              <img src={rivalPortrait} alt="Retrato del rival"/>
              <div className="dr-royal-hp red" aria-label={`Vida del rival: ${opponentHP} de ${MAX_HP}`}>HP: {opponentHP}/{MAX_HP}</div>
            </div>
            {renderGauge(opponentGauge)}
            <div className="dr-royal-rival-impact" aria-label={`Impactos del rival: ${opponentImpactLevel} de 4`}>
              {renderImpactSlots(opponentImpactLevel)}
            </div>
          </div>
          <button className="dr-royal-menu-button" type="button" onClick={handleMenuToggle} aria-label="Abrir menú de pausa">
            <span className="material-icons" aria-hidden="true">menu</span>
          </button>
        </header>

        <section className="dr-royal-rival-hand" aria-label={`Mano del rival: ${opponentHand.length} cartas ocultas`}>
          <div className="dr-royal-rival-fan" aria-hidden="true">
            {opponentHand.map((card, i) => {
              const distance = i - (opponentHand.length - 1) / 2;
              const step = Math.min(15, 68 / Math.max(1, opponentHand.length - 1));
              return <div key={card.id} className="dr-royal-facedown" style={{
                left: `${50 + distance * step}%`,
                transform: `translateX(-50%) translateY(${Math.abs(distance) * 3}px) rotate(${distance * 7}deg)`,
              }}><span className="dr-royal-card-crest">✥</span></div>;
            })}
          </div>
          <output className="dr-royal-hand-count rival" aria-label={`El rival tiene ${opponentHand.length} cartas`}>MANO {opponentHand.length}</output>
        </section>

        <section className={`dr-royal-field${selectedCard ? ' is-guiding' : ''}${dragAt ? ' is-dragging' : ''}`}
          data-card-drop="field" aria-label="Campo central de activación">
          <button type="button" className="dr-royal-activation-target" onClick={() => placeSelected('field')}
            disabled={!selectedCard || !canHandleCards || selectedCard.type === 'IMPACT'}
            aria-label="Campo para activar Ataque o Defensa">
            <span className="dr-royal-activation-icon" aria-hidden="true">✦</span>
            <span id="dr-royal-help" className="dr-royal-field-prompt" aria-live="polite">{helpText}</span>
          </button>
          <div className="dr-royal-impact-track" role="group" aria-label="Las cuatro posiciones de Impacto">
            {[1,2,3,4].map(lvl => {
              const completed = playerImpactLevel >= lvl;
              const available = canHandleCards && selectedCard?.type === 'IMPACT' && selectedCard.rank === lvl && lvl === playerImpactLevel + 1 && !playerImpactPlayedThisTurn;
              const label = lvl === 4 ? 'Final' : ['I','II','III'][lvl - 1];
              return <button key={lvl} type="button" data-card-drop={`impact-${lvl}`}
                className={`dr-royal-impact-slot${completed ? ' completed' : ''}${available ? ' available' : ''}`}
                onClick={event => { event.stopPropagation(); placeSelected(`impact-${lvl}` as CardDropZone); }}
                aria-label={`Casilla Impacto ${label}${completed ? ', completado' : ''}`}
                aria-disabled={!available}>
                {completed ? <img src={IMG_IMPACT} alt=""/> : <span className="dr-royal-impact-numeral">{label}</span>}
              </button>;
            })}
          </div>
          {playerGauge >= 2 && phase === 'PLAYER_TURN' && <div key={playerGauge} className={`dr-royal-combo combo-${playerGauge}`}
            aria-label={`Combo por ${playerGauge}`} role="status"><strong>COMBO</strong><b>×{playerGauge}</b></div>}
        </section>

        <section className="dr-royal-player-hand" aria-label={`Tu mano: ${playerHand.length} cartas`}>
          <output className="dr-royal-hand-count player" aria-label={`Tienes ${playerHand.length} cartas en la mano`}>MANO {playerHand.length}</output>
          <div className="dr-royal-player-fan">
            {playerHand.map((card, i) => {
              const distance = i - (playerHand.length - 1) / 2;
              const step = Math.min(18, 68 / Math.max(1, playerHand.length - 1));
              const selected = selectedCardId === card.id;
              const canUse = canHandleCards && (card.type !== 'IMPACT' ||
                (!playerImpactPlayedThisTurn && card.rank === playerImpactLevel + 1));
              return <button key={card.id} type="button"
                className={`dr-royal-hand-card ${card.type.toLowerCase()}${selected ? ' selected' : ''}${!canUse ? ' unavailable' : ''}`}
                style={{ left: `${50 + distance * step}%`, '--fan-rotate': `${distance * 7}deg`,
                  '--fan-rise': `${Math.abs(distance) * 5}px`, zIndex: selected ? 20 : i + 1 } as React.CSSProperties}
                aria-label={`${card.name}: ${card.description}`} aria-pressed={selected}
                aria-describedby="dr-royal-help"
                onPointerDown={event => onCardPointerDown(event, card)}
                onPointerMove={event => onCardPointerMove(event, card)}
                onPointerUp={event => onCardPointerUp(event, card)}
                onPointerCancel={onCardPointerCancel}
                onClick={event => { if (event.detail === 0) selectCard(card); }}>
                <img src={card.img} alt="" draggable={false}/>
                <span className="dr-royal-card-kind">{card.type === 'ATTACK' ? 'ATAQUE' : card.type === 'DEFENSE' ? 'DEFENSA' : 'IMPACTO'}</span>
                <span className="dr-royal-card-title">{card.name}</span>
                <span className="dr-royal-card-effect">{card.description}</span>
              </button>;
            })}
          </div>
        </section>

        <footer className="dr-royal-player-area" aria-label="Tus estadísticas y controles">
          <div className="dr-royal-player-deck">
            <button className="dr-royal-audio" type="button" onClick={handleGlobalAudioToggle}
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}><span className="material-icons" aria-hidden="true">{isMuted ? 'volume_off' : 'volume_up'}</span></button>
            <div className="dr-royal-deck-back blue"><span>{playerDeck.length}</span><small>MAZO</small></div>
          </div>
          <div className="dr-royal-character player">
            <div className="dr-royal-character-frame gold-leaf-frame">
              <img src={playerPortrait} alt="Retrato de tu personaje"/>
              <div className="dr-royal-hp blue" aria-label={`Tu vida: ${playerHP} de ${MAX_HP}`}>HP: {playerHP}/{MAX_HP}</div>
            </div>
            {renderGauge(playerGauge)}
          </div>
          <button className="dr-royal-finish" type="button" onClick={handleEndTurn}
            disabled={phase !== 'PLAYER_TURN' || showSpecialSelection || isMenuOpen}
            aria-label="Terminar turno">
            <span aria-hidden="true">➜</span><strong>FIN<br/>TURNO</strong>
          </button>
        </footer>
      </div>
      {dragAt && <div className="dr-royal-drag-ghost" aria-hidden="true"
        style={{ left: dragAt.x, top: dragAt.y }}>
        <img src={playerHand.find(card => card.id === dragAt.id)?.img ?? IMG_ATTACK} alt=""/>
      </div>}

      {/* OVERLAYS */}
      {(phase === 'START_BANNER' || phase === 'TURN_BANNER') && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full py-10 bg-stone-900/90 border-y-4 border-gold-dark text-center">
            <h2 className="text-4xl font-decorative text-gold-main uppercase tracking-widest">{bannerText}</h2>
          </div>
        </div>
      )}

      {phase === 'COIN_TOSS' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95">
          <h2 className="text-2xl text-gold-main mb-12 tracking-[0.3em] uppercase">Ritual de Inicio</h2>
          <div className={`w-32 h-32 rounded-full border-4 border-gold-dark flex items-center justify-center bg-stone-900 transition-transform ${isCoinFlipping ? 'animate-spin' : ''}`}>
            <span className="text-5xl">{coinSide === 'CARA' ? '☀️' : coinSide === 'SELLO' ? '🌑' : '❔'}</span>
          </div>
          {!isCoinFlipping && !coinSide && (
            <button onClick={handleCoinToss} className="mt-12 px-8 py-3 border border-gold-main text-gold-main uppercase font-bold tracking-widest hover:bg-gold-main/10">Lanzar Moneda</button>
          )}
        </div>
      )}

      {(phase === 'VICTORY' || phase === 'DEFEAT') && (
        <div className={`absolute inset-0 z-[100] flex items-center justify-center backdrop-blur-lg ${phase === 'VICTORY' ? 'bg-gold-dark/20' : 'bg-red-900/30'}`}>
          <div className="p-12 bg-black border-4 border-gold-main shadow-2xl">
            <h1 className={`text-6xl font-decorative ${phase === 'VICTORY' ? 'text-gold-main' : 'text-red-600'}`}>{phase === 'VICTORY' ? 'VICTORIA' : 'CAÍDA'}</h1>
          </div>
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

export default GameBoard;
