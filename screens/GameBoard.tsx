import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { OPPONENT_IMG, PLAYER_IMG, BATTLE_BG_IMG } from '../constants';
import { CardData, GamePhase, CardType } from '../types';
import { useAudio } from '../contexts/AudioContext';

// --- GAME CONFIGURATION ---
const MAX_HP = 10;
const INITIAL_HAND_SIZE = 3;
const ATTACK_DAMAGE = 2;
const GAUGE_MAX = 3;
const SPECIAL_VALUE = 3;

// --- ASSETS ---
const IMG_ATTACK = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCz0KG07Lruyfwcs0CylpCBzQELmDZ8708K4g8nRHRvtmNEJDol2TBIf1UXTI9hVtxik0ghc8TWVgOvBG_KrvOOzfxdmKx2jVqOTnFAbplSVsVvmBQc2JaEDy3yVqBnZKW_uTGD6k1fV3e6YH9wnLe5B6QKGutNPrRd76IKEyqztPw5hRp3M3wdh7SBmgG0ACCRZfvTFTdOvLJebq0Ya0UIj5OZBkOcUSWo8H3xesJAB3Z4pUtuoNjQ9ZoQ97rYP-M5cVjPAfFLkwI';
const IMG_DEFEND = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCroE4sS8jthKtiw7SbOcVB7m-XJ9F3ztM3cQBZN-P64TNZdLXsRTab7aiBwwyjkTBMfr1Mi6DOsWd5_k1_m7XhaDLppSi732GALkqjJXtwDAry8OzPM84NL3-R1i6jFXVXnX9AeMBqGI3pVpY8ri31x0rXOSP0YnI92BuyOgrldGuo_qZeJTMR5CpHiDBNzqerWyQ95n-v8NiazgHIYAFf4niy5_iTy_FfOeqnM8jhrfw0kNZkEHR1YRObCJmPzslp4JMrNTC-Kdk';
const IMG_IMPACT = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw80oIeHzQfRuaHPRmW8hbhRaMwZc2_qLwyOKXD38HscRqtNsr2FFeOxuS0ls2PA7VJA9yEFL59caHnxxF2VS5nyo9hBLv6e38RF6UwvtNjkLLsY5pMB5WKoYKHPidC5hrRBo32Qxpn-SM-dUViy2G9jIQHkTiXvX0XPLht13PqAoQhA-bg9Z-NaaM1R2XwtOAIkVrWsJGhnGQkFHBJDB_QeftHPxZUV7ajSr3h_KBEc_iIVnV3km9MnCsxRgP8FOrZY7zk6QljBI';

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

const GameBoard: React.FC = () => {
  const navigate = useNavigate();
  const { playSound, sfxEnabled, musicEnabled, toggleSfx, toggleMusic } = useAudio();
  const scale = useFitScale();

  const [phase, setPhase] = useState<GamePhase>('INIT');
  const [turnCount, setTurnCount] = useState(0);
  const [whoStarted, setWhoStarted] = useState<'PLAYER' | 'OPPONENT' | null>(null);
  const [bannerText, setBannerText] = useState("");
  const gameOverRef = useRef(false);

  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [playerDeck, setPlayerDeck] = useState<CardData[]>([]);
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [playerImpactLevel, setPlayerImpactLevel] = useState(0);
  const [playerImpactPlayedThisTurn, setPlayerImpactPlayedThisTurn] = useState(false);
  const [playerGauge, setPlayerGauge] = useState(0);
  const [playerLastType, setPlayerLastType] = useState<CardType | null>(null);
  const [showSpecialSelection, setShowSpecialSelection] = useState(false);

  const [opponentHP, setOpponentHP] = useState(MAX_HP);
  const [opponentDeck, setOpponentDeck] = useState<CardData[]>([]);
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

  const isMuted = !musicEnabled && !sfxEnabled;
  const handleGlobalAudioToggle = () => {
    playSound('CLICK');
    if (!isMuted) { if (musicEnabled) toggleMusic(); if (sfxEnabled) toggleSfx(); }
    else { if (!musicEnabled) toggleMusic(); if (!sfxEnabled) toggleSfx(); }
  };

  useEffect(() => {
    setPlayerDeck(generateDeck('p1'));
    setOpponentDeck(generateDeck('ai'));
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
      if (opponentLastType === cardType) {
        const newVal = opponentGauge + 1; setOpponentGauge(newVal);
        if (newVal >= GAUGE_MAX) triggered = true;
      } else { setOpponentLastType(cardType); setOpponentGauge(1); }
    }
    return triggered;
  };

  const drawCards = (target: 'PLAYER' | 'OPPONENT', amount: number) => {
    if (target === 'PLAYER') {
      setPlayerDeck(prev => {
        const newDeck = [...prev]; const drawn = newDeck.splice(0, amount);
        setPlayerHand(h => [...h, ...drawn]); return newDeck;
      });
    } else {
      setOpponentDeck(prev => {
        const newDeck = [...prev]; const drawn = newDeck.splice(0, amount);
        setOpponentHand(h => [...h, ...drawn]); return newDeck;
      });
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
      else setTimeout(() => triggerSpecialAbility('OPPONENT', opponentHP < 5 ? 'HEAL' : 'DAMAGE'), 800);
    }
  };

  useEffect(() => {
    if (phase === 'OPPONENT_TURN') {
      const aiRoutine = async () => {
        await new Promise(r => setTimeout(r, 1000));
        let currentHand = [...opponentHand];
        const playAiCard = async (c: CardData) => {
          if (gameOverRef.current) return;
          playCard(c, false); currentHand = currentHand.filter(x => x.id !== c.id);
          await new Promise(r => setTimeout(r, 1500));
        };
        const validImpact = currentHand.find(c => c.type === 'IMPACT' && c.rank === opponentImpactLevel + 1);
        if (validImpact) await playAiCard(validImpact);
        if (opponentHP < 5) { for (const d of currentHand.filter(x => x.type === 'DEFENSE')) await playAiCard(d); }
        for (const a of currentHand.filter(x => x.type === 'ATTACK')) await playAiCard(a);
        if (!gameOverRef.current) { setTurnCount(p => p + 1); setPhase('TURN_BANNER'); }
      };
      aiRoutine();
    }
  }, [phase]);

  useEffect(() => {
    if (gameOverRef.current) return;
    if (playerHP <= 0 || opponentImpactLevel === 4) { setPhase('DEFEAT'); gameOverRef.current = true; }
    else if (opponentHP <= 0 || playerImpactLevel === 4) { setPhase('VICTORY'); gameOverRef.current = true; }
  }, [playerHP, opponentHP, playerImpactLevel, opponentImpactLevel]);

  useEffect(() => {
    if (phase === 'VICTORY' || phase === 'DEFEAT') {
      const timer = setTimeout(() => navigate('/victory', { state: { outcome: phase, turnCount } }), 3000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handlePlayerCardClick = (card: CardData) => {
    if (phase !== 'PLAYER_TURN' || showSpecialSelection || gameOverRef.current) return;
    if (card.type === 'IMPACT' && (playerImpactPlayedThisTurn || card.rank !== playerImpactLevel + 1)) return;
    playCard(card, true);
  };

  const handleEndTurn = () => {
    if (phase !== 'PLAYER_TURN' || showSpecialSelection || gameOverRef.current) return;
    playSound('CLICK'); setTurnCount(p => p + 1); setPhase('TURN_BANNER');
  };

  const handleMenuToggle = () => { playSound('CLICK'); setIsMenuOpen(!isMenuOpen); setShowSurrenderConfirm(false); };

  const renderGauge = (val: number) => (
    <div className="flex gap-1 mt-1 justify-center">
      {[1, 2, 3].map(v => (
        <div key={v} className={`w-3 h-3 rounded-full border border-stone-600 transition-all duration-300 relative ${v <= val ? 'bg-[#d946ef] shadow-[0_0_8px_#d946ef]' : 'bg-black/50'}`}>
          {v <= val && <div className="absolute inset-0 bg-white opacity-40 animate-pulse rounded-full"></div>}
        </div>
      ))}
    </div>
  );

  const Board = (
    <div className={`bg-[#050505] font-body w-full overflow-hidden select-none flex flex-col relative text-white ${shakeScreen ? 'animate-shake' : ''}`} style={{ width: 430, height: 932 }}>
      <style>{`
        @keyframes fire-glow { 0%, 100% { box-shadow: 0 0 15px #f59e0b, 0 0 30px #f97316; } 50% { box-shadow: 0 0 25px #fbbf24, 0 0 50px #ef4444; } }
        .fire-button { animation: fire-glow 2s infinite ease-in-out; border: 2px solid #f59e0b !important; background: radial-gradient(circle, #27272a 0%, #000 100%); }
        .fire-layer { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 115%; height: 115%; background: radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%); filter: blur(10px); z-index: 0; }
        @keyframes shake { 0%, 100% { transform: translate(0,0); } 10%, 30%, 50%, 70%, 90% { transform: translate(-2px, 1px); } 20%, 40%, 60%, 80% { transform: translate(2px, -1px); } }
        .animate-shake { animation: shake 0.5s; }
        .slash-effect { animation: slash 0.4s ease-out forwards; }
        @keyframes slash { 0% { opacity: 0; transform: scale(0.5) rotate(-45deg); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0; transform: scale(1.5); } }
        .heal-effect { animation: healPulse 0.8s ease-out forwards; }
        @keyframes healPulse { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 30px #22c55e; } 100% { transform: scale(1.2); opacity: 0; } }
        .special-burst { animation: specialBurst 0.8s ease-out forwards; }
        @keyframes specialBurst { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.5); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }
        .gold-leaf-frame { background: linear-gradient(45deg, #8B6F36, #F9E076, #D4AF37, #8B6F36); box-shadow: 0 0 15px rgba(212,175,55,0.4); }
      `}</style>

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <img src={BATTLE_BG_IMG} className="w-full h-full object-cover opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/20 to-black/90"></div>
      </div>

      {/* TOP: OPPONENT */}
      <div className="flex-1 flex flex-col items-center pt-8 relative z-10">
        <div className="flex flex-col items-center flex-1">
          <div className="relative p-[3px] gold-leaf-frame transition-all duration-500 mb-2" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)' }}>
            <div className="relative w-28 h-32 bg-black overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)' }}>
              <img src={OPPONENT_IMG} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 w-full h-5 bg-black/60 backdrop-blur-md flex items-center justify-center">
                <div className="absolute left-0 h-full bg-red-600 transition-all duration-700" style={{ width: `${(opponentHP/MAX_HP)*100}%` }}></div>
                <span className="relative z-10 text-[10px] font-bold">HP: {opponentHP}/{MAX_HP}</span>
              </div>
            </div>
          </div>
          {renderGauge(opponentGauge)}
        </div>
      </div>

      {/* CENTER: PROGRESS */}
      <div className="grid grid-cols-4 gap-4 w-full px-12 my-4 relative z-10">
        {[1, 2, 3, 4].map(lvl => (
          <div key={lvl} className={`h-6 border-b-2 transition-all duration-700 flex items-center justify-center ${playerImpactLevel >= lvl ? 'border-gold-main text-gold-main' : 'border-stone-800 text-stone-700'}`}>
            <span className="text-[10px] font-bold italic">{lvl === 4 ? 'VICTORIA' : `Fase ${romanize(lvl)}`}</span>
          </div>
        ))}
      </div>

      {/* BOTTOM: PLAYER */}
      <div className="flex-1 flex flex-col justify-end pb-12 relative z-10">
        {/* CARDS HAND */}
        <div className="h-48 relative flex justify-center items-end mb-8">
          <div className="flex items-end -space-x-8">
            {playerHand.map((card, i) => {
              const rot = (i - (playerHand.length-1)/2) * 6;
              const ty = Math.pow(Math.abs(i - (playerHand.length-1)/2), 2) * 5;
              const playable = card.type !== 'IMPACT' || (card.rank === playerImpactLevel + 1 && !playerImpactPlayedThisTurn);
              return (
                <div key={card.id} onClick={() => handlePlayerCardClick(card)} style={{ transform: `rotate(${rot}deg) translateY(${ty}px)` }}
                     className={`w-28 h-40 bg-stone-900 rounded-lg border-2 transition-all hover:z-50 hover:-translate-y-12 hover:scale-110 shadow-xl cursor-pointer overflow-hidden
                                ${card.type === 'IMPACT' ? 'border-gold-main' : 'border-stone-700'} ${!playable ? 'opacity-40 grayscale' : ''}`}>
                  <img src={card.img} className="w-full h-3/5 object-cover" />
                  <div className="p-2 text-center bg-black/80 h-2/5 border-t border-white/10">
                    <div className="text-[9px] font-bold text-gold-main">{card.name}</div>
                    <div className="text-[7px] text-gray-400">{card.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PLAYER STATS & DECK */}
        <div className="flex justify-between items-end px-8">
          {/* DECK + AUDIO */}
          <div className="flex flex-col items-center relative group">
            <button onClick={handleGlobalAudioToggle} className="absolute -top-10 w-8 h-8 rounded-full bg-black/60 border border-gold-dark/40 text-gold-main flex items-center justify-center hover:bg-gold-main hover:text-black transition-all">
              <span className="material-icons text-lg">{isMuted ? 'volume_off' : 'volume_up'}</span>
            </button>
            <div className="w-14 h-20 bg-stone-800 border-2 border-stone-600 rounded-sm flex items-center justify-center relative shadow-lg">
              <div className="absolute inset-0 bg-black/40"></div>
              <span className="relative z-10 text-gold-main font-bold">{playerDeck.length}</span>
            </div>
            <span className="text-[8px] text-stone-500 mt-1 uppercase">Mazo</span>
          </div>

          {/* PORTRAIT + HP */}
          <div className="flex flex-col items-center flex-1 mx-4">
            <div className="relative p-[3px] gold-leaf-frame transition-all" style={{ clipPath: 'polygon(15% 0, 85% 0, 100% 100%, 0% 100%)' }}>
              <div className="relative w-28 h-32 bg-black overflow-hidden" style={{ clipPath: 'polygon(15% 0, 85% 0, 100% 100%, 0% 100%)' }}>
                <img src={PLAYER_IMG} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 w-full h-5 bg-black/60 backdrop-blur-md flex items-center justify-center">
                  <div className="absolute left-0 h-full bg-emerald-600 transition-all duration-700" style={{ width: `${(playerHP/MAX_HP)*100}%` }}></div>
                  <span className="relative z-10 text-[10px] font-bold">HP: {playerHP}/{MAX_HP}</span>
                </div>
              </div>
            </div>
            {renderGauge(playerGauge)}
          </div>

          {/* MENU BUTTON */}
          <button onClick={handleMenuToggle} className="w-12 h-12 rounded-full bg-black/50 border border-gold-dark/50 text-gold-main flex items-center justify-center hover:bg-black/80 transition-all shadow-lg">
            <span className="material-icons">menu</span>
          </button>
        </div>
      </div>

      {/* END TURN BUTTON (FIRE) */}
      <div className="absolute bottom-8 right-6 z-40">
        <button onClick={handleEndTurn} disabled={phase !== 'PLAYER_TURN' || showSpecialSelection}
                className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all relative
                           ${phase === 'PLAYER_TURN' ? 'fire-button scale-110' : 'bg-stone-900 border-stone-700 opacity-50 grayscale'}`}>
          {phase === 'PLAYER_TURN' && <div className="fire-layer animate-pulse"></div>}
          <span className="material-icons-round text-3xl text-gold-main relative z-10">east</span>
          <span className="text-[10px] font-bold text-gold-light relative z-10 uppercase tracking-widest">Fin</span>
        </button>
      </div>

      {/* OVERLAYS (TURN/WIN/COIN) */}
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
        <div style={{ width: 430, height: 932, transform: `scale(${scale})`, transformOrigin: 'center' }}>{Board}</div>
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
