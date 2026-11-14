import React from 'react';
import { cardActivationCopy } from '../game/cardActivationText';
import { cardEffectCue, DECREE_BANNER_DURATION_MS, DECREE_EFFECT_DURATION_MS, syncCueVideoRate } from '../game/effectCues';
import type { MultiplayerCue } from '../game/multiplayerPresentation';
import type { CardType } from '../types';

/** Online duels follow the same two separate visual phases as IA:
 * banner with decree title (1.5 seconds), THEN a 1.5-second transparent energy WebM.
 * Presentation does not alter WebSocket server authority or game rules.
 */
export function MultiplayerCinematicCue({ cue, onEnded }: {
  cue: MultiplayerCue;
  onEnded: () => void;
}) {
  const [failed, setFailed] = React.useState(false);
  const [stage, setStage] = React.useState<'banner' | 'effect'>('banner');
  const completed = React.useRef(false);
  const callback = React.useRef(onEnded);
  callback.current = onEnded;

  const turn = cue.kind === 'turn';
  const cueFile = cue.kind === 'card' ? cardEffectCue(cue.cardType as CardType).file : null;
  const isEnergy = stage === 'effect' && Boolean(cueFile);
  const file = isEnergy && cueFile
    ? cueFile
    : `animaciones/banner-${cue.isPlayer ? 'jugador-rojo' : 'rival-azul'}.webm`;
  const finish = () => {
    if (completed.current) return;
    completed.current = true;
    callback.current();
  };
  React.useEffect(() => {
    completed.current = false;
    setFailed(false);
    setStage('banner');
    const timer = window.setTimeout(() => {
      if (cue.kind === 'card' && cardEffectCue(cue.cardType).file) {
        setFailed(false);
        setStage('effect');
      } else finish();
    }, turn ? 1750 : DECREE_BANNER_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [cue.id, turn]);
  React.useEffect(() => {
    if (stage !== 'effect' || cue.kind !== 'card') return;
    const timer = window.setTimeout(finish, DECREE_EFFECT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [cue.id, cue.kind, stage]);

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

  return <div className={`dr-pvp-cinematic ${cue.isPlayer ? 'is-player' : 'is-opponent'}${turn ? ' is-turn' : ' is-card'}${isEnergy ? ' is-energy is-effect-only' : ''}`}
    data-decree-stage={stage} role="status" aria-live="polite"
    aria-label={stage === 'banner' ? `${kicker}: ${heading}. ${detail}` : `Animación de ${heading}`}>
    <div className="dr-pvp-cinematic-media" aria-hidden="true">
      {!failed ? <video key={`${cue.id}-${stage}`} autoPlay muted playsInline preload="auto"
        onLoadedMetadata={event => {
          if (turn) event.currentTarget.playbackRate = 4;
          else syncCueVideoRate(event.currentTarget,
            isEnergy ? DECREE_EFFECT_DURATION_MS : DECREE_BANNER_DURATION_MS);
        }}
        onError={() => setFailed(true)} onEnded={turn ? finish : undefined}>
        <source src={import.meta.env.BASE_URL + file} type="video/webm" />
      </video> : <div className="dr-pvp-cinematic-fallback" />}
    </div>
    {stage === 'banner' && <div className="dr-pvp-cinematic-copy" aria-hidden="true">
      <small>{kicker}</small>
      <strong>{heading}</strong>
      <span>{detail}</span>
    </div>}
  </div>;
}
