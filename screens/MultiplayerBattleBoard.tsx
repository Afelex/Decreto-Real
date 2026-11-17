import React from 'react';
import { OPPONENT_IMG, PLAYER_IMG } from '../constants';
import { BattleSceneryLayer } from './BattleSceneryLayer';
import { resolveBattleScenery } from '../game/battleScenery';
import { RoyalHpMeter, HpDeltaCue } from './RoyalHpMeter';
import { TurnIndicator, ComboChoicePanel } from './CombatEventUI';
import { ResultCinematicFX } from './ResultCinematicFX';
import { G3_UI_ASSETS } from '../game/g3UiAssets';
import { MultiplayerCinematicCue } from './MultiplayerCinematicCue';
import type { MultiplayerCue } from '../game/multiplayerPresentation';
import './hud-g3.css';
import './royal-battle-status.css';
import './multiplayer-board.css';

type Card = { id: string; type: 'ATTACK' | 'DEFENSE' | 'IMPACT' | 'ORDER'; rank?: number };
type Player = { name: string; hp: number; impact: number; connected: boolean; deckCount: number;
  hand?: Card[]; handCount?: number; comboCount?: number; impactThisTurn?: boolean };
type DuelView = { revision: number; status: 'playing' | 'finished'; isMyTurn: boolean; turnNumber: number;
  pendingCombo: 2 | 3 | null; winner: 'me' | 'opponent' | 'draw' | null;
  me: Player & { hand: Card[]; impactThisTurn: boolean }; opponent: Player & { handCount: number };
  lastEvent: string };
type Props = {
  view: DuelView; online: boolean; activeTurn: boolean;
  cinematicCue: MultiplayerCue | null; onCueEnded: () => void;
  onPlayCard: (card: Card) => void;
  onEndTurn: () => void;
  onCombo: (choice: 'DAMAGE' | 'HEAL') => void;
  onSurrender: () => void;
  onNewGame: () => void;
  onExit: () => void;
};
const BASE = import.meta.env.BASE_URL;
const HUD = BASE + 'interfaz/hud-g3/';
const CARD_IMAGES: Record<Card['type'], string> = {
  ATTACK: BASE + 'cartas/decreto-ataque.webp',
  DEFENSE: BASE + 'cartas/decreto-defensa.webp',
  ORDER: BASE + 'cartas/decreto-orden.webp?v=20261103',
  IMPACT: BASE + 'cartas/decreto-impacto.webp?v=20261103',
};
const CARD_NAMES: Record<Card['type'], string> = { ATTACK: 'Ataque', DEFENSE: 'Defensa', ORDER: 'Orden', IMPACT: 'Impacto' };
const impactLabel = (rank: number) => rank === 4 ? 'FINAL' : ['I', 'II', 'III'][rank - 1];

function Portrait({ name, hp, rival }: { name: string; hp: number; rival?: boolean }) {
  const side = rival ? 'opponent' : 'player';
  return <div className={'dr-royal-character' + (rival ? '' : ' player')}>
    <div className="dr-royal-character-frame gold-leaf-frame">
      <img src={rival ? OPPONENT_IMG : PLAYER_IMG} alt={'Retrato de ' + name} draggable={false}/>
      <span className="dr-royal-portrait-ornament" aria-hidden="true">
        <img className="dr-royal-portrait-art-image" src={HUD + 'retrato_marco.webp'} alt="" draggable={false}/>
      </span>
      <RoyalHpMeter hp={hp} maxHp={20} side={side}/>
      <HpDeltaCue hp={hp} side={side}/>
    </div>
    <strong className="dr-pvp-portrait-name">{name}</strong>
  </div>;
}

function Deck({ count, rival }: { count: number; rival?: boolean }) {
  return <div className={rival ? 'dr-royal-deck dr-royal-rival-deck' : 'dr-royal-player-deck'}>
    <div className={'dr-royal-deck-back' + (rival ? '' : ' red')}>
      <img className="dr-g3-deck-art" src={HUD + 'mazo.webp'} alt="" aria-hidden="true" draggable={false}/>
      <div className="dr-g3-deck-copy"><small>MAZO</small><span>{count}</span></div>
    </div>
  </div>;
}

/** Vista de combate PvP. Los eventos y las reglas pertenecen exclusivamente al servidor. */
export function MultiplayerBattleBoard({ view, online, activeTurn, cinematicCue, onCueEnded, onPlayCard, onEndTurn, onCombo, onSurrender, onNewGame, onExit }: Props) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  // A newly accepted state always clears selection, preventing stale card IDs.
  React.useEffect(() => { setSelected(null); }, [view.revision, view.isMyTurn]);
  const canPlay = (card: Card) => activeTurn && !view.pendingCombo &&
    (card.type !== 'IMPACT' || (card.rank === view.me.impact + 1 && !view.me.impactThisTurn));
  const chosen = view.me.hand.find(card => card.id === selected && canPlay(card));
  const playSelected = (rank?: number) => {
    if (!chosen || (rank && (chosen.type !== 'IMPACT' || chosen.rank !== rank))) return;
    if (!rank && chosen.type === 'IMPACT') return;
    onPlayCard(chosen);
    setSelected(null);
  };
  const finished = view.status === 'finished';
  const winner = view.winner === 'me';
  const outcome = view.winner === 'me' ? '¡VICTORIA!' : view.winner === 'opponent' ? 'DERROTA' : 'EMPATE';
  return <section className="dr-classic-screen dr-royal-screen dr-pvp-royal" data-hud-mode={finished ? 'result' : view.pendingCombo ? 'combo-choice' : !view.opponent.connected ? 'rival' : view.isMyTurn ? 'player' : 'rival'}
    data-hud-result={finished ? (winner ? 'victory' : 'defeat') : undefined}
    aria-label="Tablero de Decreto Real en línea">
    <BattleSceneryLayer {...resolveBattleScenery()} paused={menuOpen}/>
    <div className="dr-royal-layout">
      <header className="dr-royal-rival-area" aria-label={'Estado del rival ' + view.opponent.name}>
        <Deck count={view.opponent.deckCount} rival/>
        <Portrait name={view.opponent.name} hp={view.opponent.hp} rival/>
        <button className="dr-royal-menu-button dr-g3-menu" type="button"
          onClick={() => setMenuOpen(true)} aria-label="Abrir menú de pausa">
          <img className="dr-g3-menu-art" src={HUD + 'menu.webp'} alt="" aria-hidden="true"/>
        </button>
      </header>
      <section className="dr-royal-rival-hand" aria-label={view.opponent.handCount + ' cartas ocultas del rival'}>
        <div className="dr-royal-rival-fan" aria-hidden="true">
          {Array.from({ length: view.opponent.handCount }, (_, i) => {
            const d = i - (view.opponent.handCount - 1) / 2;
            const step = Math.min(14, 54 / Math.max(1, view.opponent.handCount - 1));
            return <div key={i} className="dr-royal-facedown" style={{
              left: `${50 + d * step}%`, '--rival-card-rotate': `${d * 7}deg`,
              '--rival-card-rise': `${Math.abs(d) * 2}px`,
            } as React.CSSProperties}><span className="dr-royal-card-crest">✥</span></div>;
          })}
        </div>
      </section>
      <section className={'dr-royal-field' + (chosen ? ' is-guiding' : '')} aria-label="Campo central de activación">
        <div className="dr-royal-rival-progress" role="group" aria-label={'Impactos del rival: ' + view.opponent.impact}>
          {[1,2,3,4].map(rank => <div key={rank} className={'dr-royal-rival-progress-slot' + (view.opponent.impact >= rank ? ' completed' : '')}>
            {view.opponent.impact >= rank && <img className="dr-royal-impact-card-art" src={CARD_IMAGES.IMPACT} alt=""/>}
            <span className="dr-royal-rival-progress-numeral dr-royal-impact-persistent-label">{impactLabel(rank)}</span>
          </div>)}
        </div>
        <button type="button" className="dr-royal-activation-target" disabled={!chosen || chosen.type === 'IMPACT'}
          onClick={() => playSelected()} aria-label="Activar decreto seleccionado en el campo">
          <span id="dr-royal-help" className="dr-royal-field-prompt" aria-live="polite">
            {!view.opponent.connected ? 'Esperando reconexión del rival…' :
              finished ? outcome : view.pendingCombo ? 'Elige el efecto de tu combo' :
              chosen ? 'Toca el campo para activar el decreto seleccionado' :
              view.isMyTurn ? 'Selecciona una carta de tu mano' : 'El rival está jugando…'}
          </span>
        </button>
        <div className="dr-royal-impact-track" role="group" aria-label={'Tus Impactos: ' + view.me.impact}>
          {[1,2,3,4].map(rank => <button type="button" key={rank}
            className={'dr-royal-impact-slot' + (view.me.impact >= rank ? ' completed' : '') +
              (chosen?.type === 'IMPACT' && chosen.rank === rank ? ' available' : '')}
            aria-label={'Posición Impacto ' + impactLabel(rank)}
            disabled={!chosen || chosen.type !== 'IMPACT' || chosen.rank !== rank}
            onClick={() => playSelected(rank)}>
            {view.me.impact >= rank && <img className="dr-royal-impact-card-art" src={CARD_IMAGES.IMPACT} alt=""/>}
            <span className="dr-royal-impact-numeral dr-royal-impact-persistent-label">{rank === 4 ? 'Final' : impactLabel(rank)}</span>
          </button>)}
        </div>
        <span className="dr-pvp-live-summary" aria-live="polite">
          Turno {view.turnNumber} · {view.lastEvent}
        </span>
      </section>
      <section className="dr-royal-player-hand" aria-label={'Tu mano: ' + view.me.hand.length + ' cartas'}>
        <div className="dr-royal-player-fan">
          {view.me.hand.map((card, i) => {
            const d = i - (view.me.hand.length - 1) / 2;
            const step = Math.min(15, 60 / Math.max(1, view.me.hand.length - 1));
            const chosenCard = selected === card.id;
            const allowed = canPlay(card);
            return <button key={card.id} type="button" disabled={!allowed} aria-pressed={chosenCard}
              aria-label={'Seleccionar Decreto de ' + CARD_NAMES[card.type] + (card.rank ? ' ' + card.rank : '')}
              className={`dr-royal-hand-card ${card.type.toLowerCase()}${chosenCard ? ' selected' : ''}${!allowed ? ' unavailable' : ''}`}
              style={{ left: `${50 + d * step}%`, '--fan-rotate': `${d * 7}deg`,
                '--fan-rise': `${Math.abs(d) * 4}px`, zIndex: chosenCard ? 20 : i + 1 } as React.CSSProperties}
              onClick={() => setSelected(chosenCard ? null : card.id)}>
              <img src={CARD_IMAGES[card.type]} alt="" draggable={false}/>
              <span className="dr-royal-card-title">{CARD_NAMES[card.type]}{card.type === 'IMPACT' ? ' ' + (card.rank === 4 ? 'Final' : card.rank) : ''}</span>
              <span className="dr-royal-card-effect">{card.type === 'ATTACK' ? '-2 PV rival' :
                card.type === 'DEFENSE' ? '+1 PV propio' : card.type === 'ORDER' ? 'Roba 1 carta' : 'Sella impacto'}</span>
            </button>;
          })}
        </div>
      </section>
      <footer className="dr-royal-player-area" aria-label="Tus estadísticas y controles">
        <Deck count={view.me.deckCount}/>
        <Portrait name={view.me.name} hp={view.me.hp}/>
        <button type="button" className="dr-royal-finish" disabled={!activeTurn || !!view.pendingCombo}
          aria-label="Terminar turno" onClick={onEndTurn}>
          <span className="dr-royal-finish-ornament" aria-hidden="true">
            <img className="dr-royal-finish-art-image" src={HUD + 'fin_turno.webp'} alt="" draggable={false}/>
          </span><strong>FIN<br/>TURNO</strong>
        </button>
      </footer>
    </div>
    {!finished && view.opponent.connected && <TurnIndicator side={view.isMyTurn ? 'PLAYER' : 'OPPONENT'} />}
    {cinematicCue && <MultiplayerCinematicCue cue={cinematicCue} onEnded={onCueEnded}/>}
    {!online && <div className="dr-pvp-status-overlay" role="status">Conexión interrumpida. Reconectando…</div>}
    {!!view.pendingCombo && !finished && !cinematicCue && <ComboChoicePanel level={view.pendingCombo}
      onDamage={() => onCombo('DAMAGE')} onHeal={() => onCombo('HEAL')}/>}
    {menuOpen && <div className="dr-pvp-pause" role="dialog" aria-modal="true" aria-label="Pausa multijugador">
      <div className="dr-pvp-pause-panel">
        <h2>DECRETO REAL</h2><p>Multijugador · {online ? 'En línea' : 'Reconectando'}</p>
        <button type="button" onClick={() => setMenuOpen(false)}>Continuar partida</button>
        <button type="button" onClick={() => { if (window.confirm('¿Rendirte? La partida contará como derrota.')) { setMenuOpen(false); onSurrender(); } }}
          disabled={finished || !online}>Rendirse</button>
        {finished && <button type="button" onClick={onExit}>Volver al menú principal</button>}
      </div>
    </div>}
    {finished && !cinematicCue && <div className="dr-royal-end-banner-stage dr-pvp-outcome">
      <ResultCinematicFX won={winner}/>
      <section className="dr-royal-end-banner" role="dialog" aria-modal="true" aria-label={'Resultado del duelo: ' + outcome}>
        <div className="dr-royal-end-cartela" aria-hidden="true">
          <img src={winner ? G3_UI_ASSETS.victoryCartela : G3_UI_ASSETS.defeatCartela} alt="" draggable={false}/>
        </div>
        <h2>{outcome}</h2>
        <p>Turno {view.turnNumber} · {view.lastEvent}</p>
        <button type="button" onClick={onNewGame}>Nueva partida</button>
        <button type="button" onClick={onExit}>Volver al menú</button>
      </section>
    </div>}
  </section>;
}
