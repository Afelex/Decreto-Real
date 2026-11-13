import React from 'react';
import { cardActivationCopy } from '../game/cardActivationText';
import { cardEffectCue, DECREE_BANNER_DURATION_MS } from '../game/effectCues';
import type { MultiplayerCue } from '../game/multiplayerPresentation';
import type { CardType } from '../types';

/** The uploaded transparent WebM art is shared by AI and online duels.
 * This is presentation only: the WebSocket server remains authoritative. */
export function MultiplayerCinematicCue({ cue, onEnded }: {
  cue: MultiplayerCue;
  onEnded: () => void;
}) {
  const [failed, setFailed] = React.useState(false);
  const completed = React.useRef(false);
  const callback = React.useRef(onEnded);
  callback.current = onEnded;

  const turn = cue.kind === 'turn';
  const isEnergy = cue.kind === 'card' && Boolean(cardEffectCue(cue.cardType as CardType).file);
  const file = turn
    ? `animaciones/banner-${cue.isPlayer ? 'jugador-rojo' : 'rival-azul'}.webm`
    : cardEffectCue(cue.cardType as CardType).file
      ?? `animaciones/banner-${cue.isPlayer ? 'jugador-rojo' : 'rival-azul'}.webm`;
  const durationMs = turn ? 1500 : DECREE_BANNER_DURATION_MS;
  const finish = () => {
    if (completed.current) return;
    completed.current = true;
    callback.current();
  };
  React.useEffect(() => {
    completed.current = false;
    setFailed(false);
    const timer = window.setTimeout(finish, durationMs + (turn ? 250 : 0));
    return () => window.clearTimeout(timer);
  }, [cue.id, durationMs]);

  const names = { ATTACK: 'Decreto de Ataque', DEFENSE: 'Decreto de Defensa',
    ORDER: 'Decreto de Orden', IMPACT: cue.kind === 'card' && cue.rank === 4
      ? 'Impacto Final' : `Impacto ${cue.kind === 'card' ? cue.rank ?? 1 : 1}` };
  const descriptions = { ATTACK: '-2 HP al rival', DEFENSE: '+1 HP propio',
    ORDER: 'Roba 1 carta extra', IMPACT: 'Sella un Impacto' };
  const cardCopy = cue.kind === 'card' ? cardActivationCopy({
    type: cue.cardType, name: names[cue.cardType], description: descriptions[cue.cardType],
    rank: cue.rank,
  }, cue.isPlayer) : null;
  const heading = turn ? (cue.isPlayer ? 'TU TURNO' : 'TURNO DEL RIVAL') : cardCopy!.title;
  const detail = turn ? (cue.isPlayer ? 'Es tu momento de jugar' : 'El rival está actuando') : cardCopy!.effect;
  const kicker = turn ? 'DECRETO REAL' : cardCopy!.kicker;

  return <div key={cue.id} className={`dr-pvp-cinematic ${cue.isPlayer ? 'is-player' : 'is-opponent'}${isEnergy ? ' is-energy' : ''}`}
    role="status" aria-live="polite" aria-label={`${kicker}: ${heading}. ${detail}`}>
    <div className="dr-pvp-cinematic-media" aria-hidden="true">
      {!failed ? <video key={cue.id} autoPlay muted playsInline preload="auto"
        onLoadedMetadata={event => { event.currentTarget.playbackRate = isEnergy ? 1 : 4; }}
        onError={() => setFailed(true)} onEnded={turn ? finish : undefined}>
        <source src={import.meta.env.BASE_URL + file} type="video/webm" />
      </video> : <div className="dr-pvp-cinematic-fallback" />}
    </div>
    <div className="dr-pvp-cinematic-copy" aria-hidden="true">
      <small>{kicker}</small>
      <strong>{heading}</strong>
      <span>{detail}</span>
    </div>
  </div>;
}
