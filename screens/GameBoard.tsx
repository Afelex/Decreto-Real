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
const SPECIAL_VALUE = 3; // Damage or Heal amount for Gauge ability

// --- ASSETS ---
const IMG_ATTACK =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCz0KG07Lruyfwcs0CylpCBzQELmDZ8708K4g8nRHRvtmNEJDol2TBIf1UXTI9hVtxik0ghc8TWVgOvBG_KrvOOzfxdmKx2jVqOTnFAbplSVsVvmBQc2JaEDy3yVqBnZKW_uTGD6k1fV3e6YH9wnLe5B6QKGutNPrRd76IKEyqztPw5hRp3M3wdh7SBmgG0ACCRZfvTFTdOvLJebq0Ya0UIj5OZBkOcUSWo8H3xesJAB3Z4pUtuoNjQ9ZoQ97rYP-M5cVjPAfFLkwI';
const IMG_DEFEND =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCroE4sS8jthKtiw7SbOcVB7m-XJ9F3ztM3cQBZN-P64TNZdLXsRTab7aiBwwyjkTBMfr1Mi6DOsWd5_k1_m7XhaDLppSi732GALkqjJXtwDAry8OzPM84NL3-R1i6jFXVXnX9AeMBqGI3pVpY8ri31x0rXOSP0YnI92BuyOgrldGuo_qZeJTMR5CpHiDBNzqerWyQ95n-v8NiazgHIYAFf4niy5_iTy_FfOeqnM8jhrfw0kNZkEHR1YRObCJmPzslp4JMrNTC-Kdk';
const IMG_IMPACT =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDw80oIeHzQfRuaHPRmW8hbhRaMwZc2_qLwyOKXD38HscRqtNsr2FFeOxuS0ls2PA7VJA9yEFL59caHnxxF2VS5nyo9hBLv6e38RF6UwvtNjkLLsY5pMB5WKoYKHPidC5hrRBo32Qxpn-SM-dUViy2G9jIQHkTiXvX0XPLht13PqAoQhA-bg9Z-NaaM1R2XwtOAIkVrWsJGhnGQkFHBJDB_QeftHPxZUV7ajSr3h_KBEc_iIVnV3km9MnCsxRgP8FOrZY7zk6QljBI';

// --- DECK GENERATION ---
const generateDeck = (playerIdPrefix: string): CardData[] => {
  let deck: CardData[] = [];

  // 4 Impacts
  deck.push({ id: `${playerIdPrefix}-imp-1`, type: 'IMPACT', rank: 1, name: 'Impacto I', description: 'Sello + Drenar 1', cost: 0, img: IMG_IMPACT });
  deck.push({ id: `${playerIdPrefix}-imp-2`, type: 'IMPACT', rank: 2, name: 'Impacto II', description: 'Sello + Drenar 1', cost: 0, img: IMG_IMPACT });
  deck.push({ id: `${playerIdPrefix}-imp-3`, type: 'IMPACT', rank: 3, name: 'Impacto III', description: 'Sello + Drenar 1', cost: 0, img: IMG_IMPACT });
  deck.push({ id: `${playerIdPrefix}-imp-4`, type: 'IMPACT', rank: 4, name: 'Impacto Final', description: 'VICTORIA', cost: 0, img: IMG_IMPACT });

  // 10 Attack Decrees
  for (let i = 0; i < 10; i++) {
    deck.push({ id: `${playerIdPrefix}-atk-${i}`, type: 'ATTACK', name: 'Decreto de Ataque', description: `-${ATTACK_DAMAGE} HP al Rival`, cost: 0, img: IMG_ATTACK });
  }

  // 10 Defense Decrees
  for (let i = 0; i < 10; i++) {
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

// --- VISUAL EFFECTS TYPES ---
type EffectType = 'ATTACK' | 'DEFENSE' | 'IMPACT' | 'SPECIAL_ATTACK' | 'SPECIAL_HEAL' | null;
type EffectTarget = 'PLAYER' | 'OPPONENT' | 'GLOBAL' | null;

/**
 * ✅ FIT SCALE: evita scroll en móvil.
 * Base “lienzo” del juego (puedes ajustar si quieres):
 *  - 430x932 ≈ móvil vertical típico.
 */
function useFitScale(baseW = 1080, baseH = 932) {
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);

  useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  return useMemo(() => {
    const s = Math.min(vw / baseW, vh / baseH);
    // límites para no “miniaturizar” demasiado ni agrandar de más
    return Math.max(0.62, Math.min(1, s));
  }, [vw, vh, baseW, baseH]);
}

const GameBoard: React.FC = () => {
  const navigate = useNavigate();
  const { playSound, sfxEnabled, musicEnabled, toggleSfx, toggleMusic } = useAudio();

  const scale = useFitScale(430, 932);

  // --- GAME STATE ---
  const [phase, setPhase] = useState<GamePhase>('INIT');
  const [turnCount, setTurnCount] = useState(0);
  const [whoStarted, setWhoStarted] = useState<'PLAYER' | 'OPPONENT' | null>(null);
  const [bannerText, setBannerText] = useState("");

  // Critical: Use Ref to track Game Over state synchronously to prevent AI overwriting defeat state
  const gameOverRef = useRef(false);

  // Player State
  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [playerDeck, setPlayerDeck] = useState<CardData[]>([]);
  const [playerHand, setPlayerHand] = useState<CardData[]>([]);
  const [playerImpactLevel, setPlayerImpactLevel] = useState(0);
  const [playerImpactPlayedThisTurn, setPlayerImpactPlayedThisTurn] = useState(false);

  // Player Gauge (Combo) State
  const [playerGauge, setPlayerGauge] = useState(0);
  const [playerLastType, setPlayerLastType] = useState<CardType | null>(null);
  const [showSpecialSelection, setShowSpecialSelection] = useState(false);

  // Opponent State
  const [opponentHP, setOpponentHP] = useState(MAX_HP);
  const [opponentDeck, setOpponentDeck] = useState<CardData[]>([]);
  const [opponentHand, setOpponentHand] = useState<CardData[]>([]);
  const [opponentImpactLevel, setOpponentImpactLevel] = useState(0);
  const [opponentImpactPlayedThisTurn, setOpponentImpactPlayedThisTurn] = useState(false);

  // Opponent Gauge (Combo) State
  const [opponentGauge, setOpponentGauge] = useState(0);
  const [opponentLastType, setOpponentLastType] = useState<CardType | null>(null);

  // UI State
  const [coinSide, setCoinSide] = useState<'CARA' | 'SELLO' | null>(null);
  const [isCoinFlipping, setIsCoinFlipping] = useState(false);

  // Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);

  // --- VISUAL EFFECTS STATE ---
  const [visualEffect, setVisualEffect] = useState<{ type: EffectType, target: EffectTarget }>({ type: null, target: null });
  const [shakeScreen, setShakeScreen] = useState(false);

  // --- AUDIO LOGIC ---
  const isMuted = !musicEnabled && !sfxEnabled;
  const handleGlobalAudioToggle = () => {
    if (!isMuted) {
      playSound('CLICK');
      if (musicEnabled) toggleMusic();
      if (sfxEnabled) toggleSfx();
    } else {
      if (!musicEnabled) toggleMusic();
      if (!sfxEnabled) toggleSfx();
    }
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    setPlayerDeck(generateDeck('p1'));
    setOpponentDeck(generateDeck('ai'));
    setPhase('COIN_TOSS');
  }, []);

  // --- COIN TOSS ---
  const handleCoinToss = () => {
    if (isCoinFlipping) return;
    playSound('FLIP');
    setIsCoinFlipping(true);
    setTimeout(() => {
      const isHeads = Math.random() > 0.5;
      setCoinSide(isHeads ? 'CARA' : 'SELLO');
      const winner = isHeads ? 'PLAYER' : 'OPPONENT';
      setWhoStarted(winner);
      setTimeout(() => {
        setPhase('START_BANNER');
        setIsCoinFlipping(false);
      }, 1500);
    }, 1500);
  };

  // --- PHASE TRANSITIONS ---
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
      const currentPlayer =
        ((whoStarted === 'PLAYER' && turnCount % 2 !== 0) || (whoStarted === 'OPPONENT' && turnCount % 2 === 0))
          ? 'PLAYER'
          : 'OPPONENT';
      setBannerText(`TURNO ${turnCount}: ${currentPlayer === 'PLAYER' ? 'TU TURNO' : 'TURNO DEL RIVAL'}`);
      setTimeout(() => {
        if (gameOverRef.current) return;
        if (currentPlayer === 'PLAYER') startPlayerTurn();
        else startOpponentTurn();
      }, 1500);
    }
  }, [phase, turnCount, whoStarted]);

  // --- TURN LOGIC ---
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

  // --- HELPER: TRIGGER VISUAL FX ---
  const triggerVisualEffect = (type: EffectType, target: EffectTarget) => {
    setVisualEffect({ type, target });

    if (type === 'ATTACK' || type === 'IMPACT' || type === 'SPECIAL_ATTACK') {
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 500);
    }

    const duration = type === 'IMPACT' ? 600 : 1200;
    setTimeout(() => setVisualEffect({ type: null, target: null }), duration);
  };

  // --- SPECIAL ABILITY LOGIC (GAUGE) ---
  const triggerSpecialAbility = (user: 'PLAYER' | 'OPPONENT', ability: 'DAMAGE' | 'HEAL') => {
    playSound('IMPACT');

    if (user === 'PLAYER') {
      setPlayerGauge(0);
      setPlayerLastType(null);
      setShowSpecialSelection(false);

      if (ability === 'DAMAGE') {
        setOpponentHP(prev => Math.max(0, prev - SPECIAL_VALUE));
        triggerVisualEffect('SPECIAL_ATTACK', 'OPPONENT');
      } else {
        setPlayerHP(prev => Math.min(MAX_HP, prev + SPECIAL_VALUE));
        triggerVisualEffect('SPECIAL_HEAL', 'PLAYER');
      }
    } else {
      setOpponentGauge(0);
      setOpponentLastType(null);

      if (ability === 'DAMAGE') {
        setPlayerHP(prev => Math.max(0, prev - SPECIAL_VALUE));
        triggerVisualEffect('SPECIAL_ATTACK', 'PLAYER');
      } else {
        setOpponentHP(prev => Math.min(MAX_HP, prev + SPECIAL_VALUE));
        triggerVisualEffect('SPECIAL_HEAL', 'OPPONENT');
      }
    }
  };

  // --- GAUGE UPDATE LOGIC ---
  const updateGauge = (isPlayer: boolean, cardType: CardType): boolean => {
    if (cardType === 'IMPACT') {
      if (isPlayer) { setPlayerGauge(0); setPlayerLastType(null); }
      else { setOpponentGauge(0); setOpponentLastType(null); }
      return false;
    }

    let isTriggered = false;

    if (isPlayer) {
      if (playerLastType === cardType) {
        const newVal = playerGauge + 1;
        setPlayerGauge(newVal);
        if (newVal >= GAUGE_MAX) isTriggered = true;
      } else {
        setPlayerLastType(cardType);
        setPlayerGauge(1);
      }
    } else {
      if (opponentLastType === cardType) {
        const newVal = opponentGauge + 1;
        setOpponentGauge(newVal);
        if (newVal >= GAUGE_MAX) isTriggered = true;
      } else {
        setOpponentLastType(cardType);
        setOpponentGauge(1);
      }
    }

    return isTriggered;
  };

  // --- ACTION LOGIC ---
  const drawCards = (target: 'PLAYER' | 'OPPONENT', amount: number) => {
    if (target === 'PLAYER') {
      setPlayerDeck(prev => {
        const newDeck = [...prev];
        const drawn = newDeck.splice(0, amount);
        setPlayerHand(h => [...h, ...drawn]);
        return newDeck;
      });
    } else {
      setOpponentDeck(prev => {
        const newDeck = [...prev];
        const drawn = newDeck.splice(0, amount);
        setOpponentHand(h => [...h, ...drawn]);
        return newDeck;
      });
    }
  };

  const playCard = (card: CardData, isPlayer: boolean) => {
    if (gameOverRef.current) return;

    // 1. Remove from hand
    if (isPlayer) setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    else setOpponentHand(prev => prev.filter(c => c.id !== card.id));

    // 2. Apply Effects & Visuals
    if (card.type === 'ATTACK') {
      playSound('ATTACK');
      const target = isPlayer ? 'OPPONENT' : 'PLAYER';
      triggerVisualEffect('ATTACK', target);
      if (isPlayer) setOpponentHP(prev => Math.max(0, prev - ATTACK_DAMAGE));
      else setPlayerHP(prev => Math.max(0, prev - ATTACK_DAMAGE));
    } else if (card.type === 'DEFENSE') {
      playSound('DEFENSE');
      const target = isPlayer ? 'PLAYER' : 'OPPONENT';
      triggerVisualEffect('DEFENSE', target);
      if (isPlayer) setPlayerHP(prev => Math.min(MAX_HP, prev + 1));
      else setOpponentHP(prev => Math.min(MAX_HP, prev + 1));
    } else if (card.type === 'IMPACT') {
      playSound('IMPACT');
      triggerVisualEffect('IMPACT', 'GLOBAL');
      if (isPlayer) {
        setPlayerImpactLevel(prev => prev + 1);
        setPlayerImpactPlayedThisTurn(true);
        setOpponentHP(prev => Math.max(0, prev - 1));
        setPlayerHP(prev => Math.min(MAX_HP, prev + 1));
      } else {
        setOpponentImpactLevel(prev => prev + 1);
        setOpponentImpactPlayedThisTurn(true);
        setPlayerHP(prev => Math.max(0, prev - 1));
        setOpponentHP(prev => Math.min(MAX_HP, prev + 1));
      }
    }

    // 3. Update Gauge & Check for Special
    const specialReady = updateGauge(isPlayer, card.type);
    if (specialReady) {
      if (isPlayer) {
        setTimeout(() => setShowSpecialSelection(true), 600);
      } else {
        setTimeout(() => {
          if (gameOverRef.current) return;
          const aiNeedsHeal = opponentHP < 5;
          triggerSpecialAbility('OPPONENT', aiNeedsHeal ? 'HEAL' : 'DAMAGE');
        }, 800);
      }
    }
  };

  // --- AI LOGIC ---
  useEffect(() => {
    if (phase === 'OPPONENT_TURN') {
      const aiTurnRoutine = async () => {
        await new Promise(r => setTimeout(r, 1000));

        let currentHand = [...opponentHand];
        const playAiCard = async (cardToPlay: CardData) => {
          if (gameOverRef.current) return;
          playCard(cardToPlay, false);
          currentHand = currentHand.filter(c => c.id !== cardToPlay.id);
          await new Promise(r => setTimeout(r, 1500));
        };

        if (!gameOverRef.current) {
          const validImpact = currentHand.find(c => c.type === 'IMPACT' && c.rank === opponentImpactLevel + 1);
          if (validImpact) await playAiCard(validImpact);
        }

        if (!gameOverRef.current && opponentHP < 5) {
          const defenses = currentHand.filter(c => c.type === 'DEFENSE');
          for (const def of defenses) {
            if (opponentHP < MAX_HP && !gameOverRef.current) await playAiCard(def);
          }
        }

        if (!gameOverRef.current) {
          const attacks = currentHand.filter(c => c.type === 'ATTACK');
          for (const atk of attacks) if (!gameOverRef.current) await playAiCard(atk);
        }

        if (!gameOverRef.current) {
          const remainingDefenses = currentHand.filter(c => c.type === 'DEFENSE');
          for (const def of remainingDefenses) if (!gameOverRef.current) await playAiCard(def);
        }

        if (!gameOverRef.current) {
          setTurnCount(prev => prev + 1);
          setPhase('TURN_BANNER');
        }
      };
      aiTurnRoutine();
    }
  }, [phase]);

  // --- WIN CONDITION CHECK ---
  useEffect(() => {
    if (gameOverRef.current) return;

    if (playerHP <= 0 || opponentImpactLevel === 4) {
      setPhase('DEFEAT');
      gameOverRef.current = true;
    } else if (opponentHP <= 0 || playerImpactLevel === 4) {
      setPhase('VICTORY');
      gameOverRef.current = true;
    }
  }, [playerHP, opponentHP, playerImpactLevel, opponentImpactLevel]);

  // --- END GAME NAVIGATION ---
  useEffect(() => {
    if (phase === 'VICTORY' || phase === 'DEFEAT') {
      const timer = setTimeout(() => {
        navigate('/victory', { state: { outcome: phase, turnCount: turnCount } });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [phase, navigate, turnCount]);

  // --- PLAYER ACTION HANDLERS ---
  const handlePlayerCardClick = (card: CardData) => {
    if (phase !== 'PLAYER_TURN') return;
    if (showSpecialSelection) return;
    if (gameOverRef.current) return;

    if (card.type === 'IMPACT') {
      if (playerImpactPlayedThisTurn) return;
      if (card.rank !== playerImpactLevel + 1) return;
    }
    playCard(card, true);
  };

  const handleEndTurn = () => {
    if (phase !== 'PLAYER_TURN') return;
    if (showSpecialSelection) return;
    if (gameOverRef.current) return;

    playSound('CLICK');
    setTurnCount(prev => prev + 1);
    setPhase('TURN_BANNER');
  };

  // --- MENU HANDLERS ---
  const handleMenuToggle = () => {
    playSound('CLICK');
    setIsMenuOpen(!isMenuOpen);
    setShowSurrenderConfirm(false);
  };

  const handleSurrenderRequest = () => {
    playSound('CLICK');
    setShowSurrenderConfirm(true);
  };

  const handleSurrenderConfirm = () => {
    playSound('CLICK');
    navigate('/');
  };

  const handleSurrenderCancel = () => {
    playSound('CLICK');
    setShowSurrenderConfirm(false);
  };

  // --- RENDER HELPERS ---
  const renderImpactSlots = (currentLevel: number) => (
    <div className="flex gap-2 p-2 bg-[#0a0a0a] rounded-lg border-2 border-gold-dark shadow-inner relative overflow-hidden">
      <div className="absolute inset-0 bg-gold-dark/10 animate-pulse"></div>

      {[1, 2, 3, 4].map(lvl => (
        <div key={lvl} className="relative w-5 h-5 flex items-center justify-center">
          {lvl <= currentLevel && <div className="absolute inset-0 bg-gold-main blur-md animate-pulse"></div>}

          <div
            className={`absolute inset-0 transition-all duration-700 transform border border-black
              ${lvl <= currentLevel ? 'bg-gradient-to-t from-gold-dark via-gold-main to-white scale-110 shadow-[0_0_10px_#ffd700]' : 'bg-stone-800 scale-100 opacity-50'}
            `}
            style={{
              clipPath:
                'polygon(20% 0%, 80% 0%, 80% 20%, 100% 20%, 100% 80%, 80% 80%, 80% 100%, 20% 100%, 20% 80%, 0% 80%, 0% 20%, 20% 20%)',
            }}
          ></div>
        </div>
      ))}
    </div>
  );

  const renderGauge = (gaugeValue: number) => (
    <div className="flex gap-1 mt-1 justify-center">
      {[1, 2, 3].map(val => (
        <div
          key={val}
          className={`w-3 h-3 rounded-full border border-stone-600 transition-all duration-300 relative
            ${val <= gaugeValue ? 'bg-[#d946ef] border-[#f0abfc] shadow-[0_0_8px_#d946ef]' : 'bg-black/50'}
          `}
        >
          {val <= gaugeValue && <div className="absolute inset-0 bg-white opacity-40 animate-pulse rounded-full"></div>}
        </div>
      ))}
    </div>
  );

  /**
   * ✅ TABLERO REAL
   * OJO: este “board” tiene tamaño fijo (baseW/baseH) y se escala arriba.
   * Mantén aquí tu UI tal cual.
   */
  const Board = (
    <div
      className={`bg-[#050505] font-body w-full overflow-hidden select-none flex flex-col relative text-white ${shakeScreen ? 'animate-shake' : ''}`}
      style={{ width: 430, height: 932 }}
    >
      {/* Custom Animations Styles */}
      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .animate-shake { animation: shake 0.5s; }

        @keyframes slash {
          0% { opacity: 0; transform: scale(0.5) rotate(-45deg) translateX(-50px); filter: blur(2px); }
          50% { opacity: 1; transform: scale(1.2) rotate(-45deg) translateX(0); filter: blur(0px); }
          100% { opacity: 0; transform: scale(1.5) rotate(-45deg) translateX(50px); filter: blur(4px); }
        }
        .slash-effect { animation: slash 0.4s ease-out forwards; will-change: transform, opacity; }

        @keyframes healPulse {
          0% { transform: scale(0.8); opacity: 0; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          50% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 30px 15px rgba(34, 197, 94, 0.5); }
          100% { transform: scale(1.2); opacity: 0; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .heal-effect { animation: healPulse 0.8s ease-out forwards; will-change: transform, opacity, box-shadow; }

        @keyframes specialBurst {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.5); opacity: 1; filter: brightness(2); }
          100% { transform: scale(2); opacity: 0; }
        }
        .special-burst { animation: specialBurst 0.8s ease-out forwards; }

        .bg-stone-wall-dark {
          background-color: #0c0a09;
          background-image: url("https://www.transparenttextures.com/patterns/dark-wall.png");
        }

        .gold-leaf-frame {
          background: linear-gradient(45deg, #8B6F36, #F9E076, #D4AF37, #8B6F36);
          box-shadow:
            0 0 0 2px #000,
            0 0 10px rgba(212, 175, 55, 0.4),
            inset 0 0 10px rgba(0,0,0,0.8);
        }

        .text-gold-gradient {
          background: linear-gradient(to bottom, #fff 0%, #ffd700 50%, #b8860b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .trapezoid-panel {
          clip-path: polygon(5% 0, 95% 0, 100% 100%, 0% 100%);
          background: linear-gradient(180deg, rgba(28, 25, 23, 0.95) 0%, rgba(12, 10, 9, 0.95) 100%);
          border-top: 2px solid #D4AF37;
        }
      `}</style>

      {/* --- BACKGROUND LAYERS --- */}
      <div className="absolute inset-0 z-0 bg-[#050505]">
        <img src={BATTLE_BG_IMG} alt="Battle Background" className="absolute inset-0 w-full h-full object-cover object-center opacity-100" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/20 to-black/90"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 mix-blend-color-dodge"></div>
      </div>

      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] opacity-80 pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-color-dodge pointer-events-none"></div>

      <div className="absolute top-10 left-0 w-full h-32 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>

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

      {/* --- AUDIO TOGGLE --- */}
      <button
        onClick={handleGlobalAudioToggle}
        className="absolute top-4 left-4 z-50 w-12 h-12 flex items-center justify-center text-gold-main hover:text-white transition-all bg-black/50 rounded-full border border-gold-dark/50 hover:bg-black/80 hover:border-gold-light shadow-lg"
        aria-label={isMuted ? 'Activar Sonido' : 'Silenciar'}
      >
        <span className="material-icons">{isMuted ? 'volume_off' : 'volume_up'}</span>
      </button>

      {/* --- MENU BUTTON --- */}
      <button
        onClick={handleMenuToggle}
        className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center text-gold-main hover:text-white transition-all bg-black/50 rounded-full border border-gold-dark/50 hover:bg-black/80 hover:border-gold-light shadow-lg"
        aria-label="Abrir Menú"
      >
        <span className="material-icons">menu</span>
      </button>

      {/* --- MENU MODAL --- */}
      {isMenuOpen && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B0C10] border-2 border-gold-dark p-6 rounded-lg w-full max-w-sm shadow-[0_0_20px_rgba(212,175,55,0.2)] relative">
            <button onClick={handleMenuToggle} className="absolute top-2 right-2 text-gray-500 hover:text-white">
              <span className="material-icons">close</span>
            </button>

            <h2 className="text-xl font-decorative text-gold-main text-center mb-6 uppercase tracking-widest border-b border-gold-dark/30 pb-2">Pausa</h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10 hover:border-gold-dark/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-gray-400 text-sm">music_note</span>
                  <span className="text-gray-300 font-display text-sm tracking-wide">Música</span>
                </div>
                <button
                  onClick={() => { toggleMusic(); playSound('CLICK'); }}
                  className={`text-xs font-bold px-3 py-1 rounded border ${musicEnabled ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'} transition-all`}
                >
                  {musicEnabled ? 'ENCENDIDO' : 'APAGADO'}
                </button>
              </div>

              <div className="flex justify-between items-center p-3 bg-white/5 rounded border border-white/10 hover:border-gold-dark/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-gray-400 text-sm">volume_up</span>
                  <span className="text-gray-300 font-display text-sm tracking-wide">Efectos</span>
                </div>
                <button
                  onClick={() => { toggleSfx(); playSound('CLICK'); }}
                  className={`text-xs font-bold px-3 py-1 rounded border ${sfxEnabled ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'} transition-all`}
                >
                  {sfxEnabled ? 'ENCENDIDO' : 'APAGADO'}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {!showSurrenderConfirm ? (
                <>
                  <button onClick={handleMenuToggle} className="w-full py-3 bg-gold-dark text-black font-bold font-display text-sm uppercase hover:bg-gold-main transition-colors rounded shadow-md">
                    Continuar Batalla
                  </button>
                  <button onClick={handleSurrenderRequest} className="w-full py-3 border border-red-900/50 text-red-500 font-display text-sm uppercase hover:bg-red-900/20 transition-colors rounded hover:border-red-600">
                    Rendirse
                  </button>
                </>
              ) : (
                <div className="text-center animate-in fade-in slide-in-from-bottom-2 bg-red-900/10 p-4 rounded border border-red-900/30">
                  <p className="text-red-400 font-body mb-4 text-sm font-bold">¿Abandonar la batalla y aceptar la derrota?</p>
                  <div className="flex gap-3">
                    <button onClick={handleSurrenderConfirm} className="flex-1 py-2 bg-red-800 text-white font-display text-xs uppercase hover:bg-red-600 rounded shadow-lg">
                      Sí, Huir
                    </button>
                    <button onClick={handleSurrenderCancel} className="flex-1 py-2 border border-gray-600 text-gray-300 font-display text-xs uppercase hover:bg-gray-800 rounded">
                      Cancelar
                    </button>
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

      {/* --- TOP: OPPONENT AREA --- */}
      <div className="flex-1 flex flex-col items-center pt-4 w-full max-w-md mx-auto relative z-10">
        <div className="flex justify-between items-start w-full px-4 mb-2">
          <div className="flex flex-col items-center">
            <div className="relative w-14 h-20 bg-stone-800 border-2 border-stone-600 shadow-lg flex items-center justify-center rounded-sm">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-50"></div>
              <div className="relative z-10 bg-black/60 w-8 h-8 flex items-center justify-center border border-gold-dark/30 rounded-full">
                <span className="text-sm text-gold-main font-bold font-display">{opponentDeck.length}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center flex-1 mx-4">
            <div
              className={`relative p-[3px] gold-leaf-frame shadow-2xl mb-2 transition-all duration-500 ${phase === 'OPPONENT_TURN' ? 'scale-110 shadow-[0_0_20px_rgba(212,175,55,0.4)]' : ''}`}
              style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)' }}
            >
              <div
                className={`relative w-24 h-28 bg-black overflow-hidden ${visualEffect.type === 'ATTACK' && visualEffect.target === 'OPPONENT' ? 'brightness-150 contrast-125 sepia-0' : 'sepia-[0.2]'}`}
                style={{ clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)' }}
              >
                <img alt="Opponent" className="w-full h-full object-cover opacity-90" src={OPPONENT_IMG} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20"></div>
              </div>

              <div className="absolute bottom-0 left-[15%] right-[15%] h-2 bg-stone-900 border-t border-gold-dark/50">
                <div
                  className="h-full bg-gradient-to-r from-red-900 via-red-600 to-red-500 transition-all duration-500 shadow-[0_0_5px_red]"
                  style={{ width: `${(opponentHP / MAX_HP) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-black/80 border-x border-gold-dark px-4 py-0.5 transform -skew-x-12 mb-1">
              <span className="text-[10px] text-gold-light font-display uppercase tracking-[0.2em] transform skew-x-12 inline-block">
                HP: {opponentHP}/{MAX_HP}
              </span>
            </div>

            {renderGauge(opponentGauge)}

            <div className="mt-2">{renderImpactSlots(opponentImpactLevel)}</div>
          </div>

          <div className="w-14"></div>
        </div>

        <div className="flex justify-center -space-x-4 mb-2 scale-75 h-24 opacity-80">
          {opponentHand.map((c, i) => (
            <div
              key={c.id}
              className="w-16 h-24 bg-gradient-to-b from-stone-800 to-black border border-stone-600 rounded-sm shadow-black shadow-lg"
              style={{ transform: `translateY(${i % 2 * 4}px)` }}
            >
              <div className="w-full h-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')]"></div>
            </div>
          ))}
        </div>
      </div>

      {/* --- CENTER: DECORATIVE LINES --- */}
      <div className="relative w-full h-10 flex items-center justify-center z-0 shrink-0 my-2 pointer-events-none">
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-gold-dark to-transparent opacity-30 top-1/2"></div>
      </div>

      {/* --- BOTTOM: PLAYER AREA --- */}
      <div className="flex-1 flex flex-col justify-start items-center pb-10 w-full max-w-md mx-auto relative z-10">
        <div className="grid grid-cols-4 gap-2 w-full px-12 mb-2 mt-auto">
          {[1, 2, 3, 4].map(lvl => (
            <div
              key={lvl}
              className={`
                h-8 flex items-center justify-center transition-all duration-500 border
                ${playerImpactLevel >= lvl ? 'bg-gold-dark border-gold-light shadow-[0_0_10px_#b8860b]' : 'bg-black/60 border-stone-700'}
              `}
              style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)' }}
            >
              <span className={`text-[10px] font-bold font-display ${playerImpactLevel >= lvl ? 'text-black' : 'text-stone-500'}`}>
                {lvl === 4 ? 'VICTORIA' : romanize(lvl)}
              </span>
            </div>
          ))}
        </div>

        <div className="w-full h-44 relative flex justify-center items-end mb-6 z-30 perspective-1000">
          <div className="flex items-end justify-center -space-x-6 w-full px-4 overflow-x-visible pb-2">
            {playerHand.map((card, index) => {
              const rot = (index - (playerHand.length - 1) / 2) * 4;
              const ty = Math.abs(index - (playerHand.length - 1) / 2) * 8;
              const isImpact = card.type === 'IMPACT';
              const isPlayableImpact = isImpact && card.rank === playerImpactLevel + 1 && !playerImpactPlayedThisTurn;
              const highlight = card.type !== 'IMPACT' || isPlayableImpact;

              return (
                <div
                  key={card.id}
                  onClick={() => handlePlayerCardClick(card)}
                  style={{ transform: `rotate(${rot}deg) translateY(${ty}px)` }}
                  className={`relative w-28 h-40 bg-stone-900 rounded-lg border-2 flex-shrink-0 transition-all duration-300 cursor-pointer group hover:z-50 hover:-translate-y-12 hover:scale-110 hover:rotate-0 shadow-xl
                    ${isImpact ? 'border-gold-light shadow-[0_0_10px_rgba(212,175,55,0.4)]' : card.type === 'ATTACK' ? 'border-red-900/80' : 'border-emerald-900/80'}
                    ${!highlight && phase === 'PLAYER_TURN' ? 'opacity-40 grayscale blur-[1px]' : ''}
                  `}
                >
                  <div className="absolute inset-1 border border-white/10 rounded-md overflow-hidden bg-black">
                  <img className={`w-full h-full object-cover transition-opacity ${card.type === 'IMPACT' ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}
                  `}
                  src={card.img}
                  alt={card.name}
                  />

                   <div
  className={`absolute inset-0
    ${card.type === 'IMPACT'
      ? 'bg-gradient-to-t from-black/40 via-transparent to-transparent'
      : 'bg-gradient-to-t from-black via-transparent to-transparent'}
  `}
></div>


                    <div className="absolute bottom-0 w-full p-2 text-center bg-black/80 backdrop-blur-sm border-t border-white/10">
                      <div className={`text-[9px] font-display font-bold uppercase tracking-wider ${isImpact ? 'text-gold-main' : 'text-gray-200'}`}>{card.name}</div>
                      <div className="text-[7px] text-gray-500 mt-0.5 leading-tight">{card.description}</div>
                    </div>
                  </div>

                  {isImpact && (
                    <>
                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-gold-main rotate-45"></div>
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-gold-main rotate-45"></div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-end w-full px-4">
          <div className="flex flex-col items-center">
            <div className="relative w-14 h-20 bg-stone-800 border-2 border-stone-600 shadow-lg flex items-center justify-center rounded-sm">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-50"></div>
              <div className="relative z-10 bg-black/60 w-8 h-8 flex items-center justify-center border border-gold-dark/30 rounded-full">
                <span className="text-sm text-gold-main font-bold font-display">{playerDeck.length}</span>
              </div>
            </div>
            <span className="text-[8px] text-stone-500 uppercase mt-1 font-display tracking-widest">Mazo</span>
          </div>

          <div className="flex flex-col items-center flex-1 mx-4">
            <div className="bg-black/80 border-x border-gold-dark px-4 py-0.5 transform skew-x-12 mb-1">
              <span className="text-[10px] text-gold-light font-display uppercase tracking-[0.2em] transform -skew-x-12 inline-block">
                HP: {playerHP}/{MAX_HP}
              </span>
            </div>

            {renderGauge(playerGauge)}

            <div
              className={`relative p-[3px] gold-leaf-frame shadow-2xl z-20 mt-2 transition-all duration-300 ${phase === 'PLAYER_TURN' ? 'scale-105 shadow-[0_0_15px_rgba(212,175,55,0.5)]' : ''}`}
              style={{ clipPath: 'polygon(15% 0, 85% 0, 100% 100%, 0% 100%)' }}
            >
              <div className="relative w-28 h-32 bg-black overflow-hidden" style={{ clipPath: 'polygon(15% 0, 85% 0, 100% 100%, 0% 100%)' }}>
                <img alt="Player" className="w-full h-full object-cover" src={PLAYER_IMG} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10"></div>
              </div>

              <div className="absolute bottom-0 left-[5%] right-[5%] h-2 bg-stone-900 border-t border-gold-dark/50">
                <div
                  className="h-full bg-gradient-to-r from-emerald-800 via-emerald-500 to-emerald-400 transition-all duration-500 shadow-[0_0_5px_green]"
                  style={{ width: `${(playerHP / MAX_HP) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="w-14"></div>
        </div>
      </div>

      {/* --- END TURN BUTTON --- */}
      <div className="absolute z-40 transition-all duration-500 bottom-4 right-4">
        <button
          onClick={handleEndTurn}
          disabled={phase !== 'PLAYER_TURN' || showSpecialSelection || gameOverRef.current}
          className={`
            w-20 h-20 rounded-full bg-[#151515] border-2 border-gold-dark
            flex flex-col items-center justify-center
            shadow-[0_0_15px_rgba(0,0,0,0.8)] transition-all duration-300
            group relative overflow-hidden
            ${phase !== 'PLAYER_TURN' || showSpecialSelection || gameOverRef.current
              ? 'opacity-60 grayscale cursor-not-allowed border-stone-600'
              : 'hover:scale-110 hover:border-gold-light hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] cursor-pointer active:scale-95'}
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gold-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="material-icons-round text-3xl text-gold-main mb-1 relative z-10 group-hover:text-white transition-colors">east</span>
          <span className="text-[9px] font-display font-bold text-gold-light uppercase tracking-widest relative z-10">Fin</span>
        </button>
      </div>

      {/* --- OVERLAYS --- */}
      {(phase === 'START_BANNER' || phase === 'TURN_BANNER') && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="w-full py-8 bg-stone-900 border-y-4 border-gold-dark flex items-center justify-center relative shadow-[0_0_50px_rgba(0,0,0,0.9)]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30"></div>
            <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-50"></div>
            <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-50"></div>

            <h2 className="text-4xl font-decorative text-transparent bg-clip-text bg-gradient-to-b from-white via-gold-main to-gold-dark drop-shadow-[0_4px_4px_rgba(0,0,0,1)] tracking-[0.2em] text-center relative z-10 uppercase">
              {bannerText}
            </h2>
          </div>
        </div>
      )}

      {phase === 'COIN_TOSS' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
          <h2 className="text-3xl font-decorative text-gold-gradient mb-12 tracking-widest uppercase">Ritual de Inicio</h2>

          <div className={`w-40 h-40 rounded-full border-4 border-gold-dark shadow-[0_0_40px_rgba(212,175,55,0.4)] flex items-center justify-center bg-gradient-to-br from-[#8B6F36] to-[#423116] relative transition-transform duration-700 ${isCoinFlipping ? 'animate-[spin_0.5s_linear_infinite]' : ''}`}>
            <div className="absolute inset-2 border-2 border-dashed border-gold-main/50 rounded-full animate-spin-slow"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cracked-ground.png')] opacity-30 mix-blend-overlay"></div>
            <span className="text-6xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] relative z-10">
              {coinSide === 'CARA' ? '☀️' : coinSide === 'SELLO' ? '🌑' : '❔'}
            </span>
          </div>

          {!isCoinFlipping && !coinSide && (
            <button
              onClick={handleCoinToss}
              className="mt-16 px-10 py-4 bg-gradient-to-b from-stone-800 to-black border border-gold-dark text-gold-main font-bold tracking-[0.3em] uppercase rounded-sm shadow-lg active:scale-95 transition-transform hover:bg-stone-800 hover:shadow-[0_0_15px_rgba(212,175,55,0.2)]"
            >
              Lanzar Moneda
            </button>
          )}

          {whoStarted && !isCoinFlipping && (
            <div className="mt-12 text-2xl text-gold-main animate-pulse font-decorative text-center">
              <div className="text-sm text-stone-400 font-sans tracking-widest mb-2 uppercase">El destino elige a</div>
              {whoStarted === 'PLAYER' ? 'TU MAJESTAD' : 'TU ADVERSARIO'}
            </div>
          )}
        </div>
      )}

      {(phase === 'VICTORY' || phase === 'DEFEAT') && (
        <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md animate-in fade-in duration-1000 ${phase === 'VICTORY' ? 'bg-gold-dark/20' : 'bg-red-900/30'}`}>
          <div className="text-center scale-80 transform transition-transform duration-1000 p-12 bg-black border-[6px] border-double border-gold-dark shadow-[0_0_80px_rgba(0,0,0,1)] relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>
            <h1 className={`relative z-10 text-7xl font-decorative drop-shadow-[0_5px_15px_rgba(0,0,0,1)] ${phase === 'VICTORY' ? 'text-transparent bg-clip-text bg-gradient-to-b from-white to-gold-main' : 'text-red-600'}`}>
              {phase === 'VICTORY' ? 'VICTORIA' : 'CAÍDA'}
            </h1>
          </div>
        </div>
      )}
    </div>
  );

  // ✅ WRAPPER SIN SCROLL (100dvh) + escala automática
  return (
    <div
      className="w-screen overflow-hidden bg-black"
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div
          style={{
            width: 430,
            height: 932,
            transform: `scale(${scale})`,
            transformOrigin: 'center',
          }}
        >
          {Board}
        </div>
      </div>
    </div>
  );
};

function romanize(num: number) {
  const lookup: { [key: string]: number } = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let roman = '', i;
  for (i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman;
}

export default GameBoard;
