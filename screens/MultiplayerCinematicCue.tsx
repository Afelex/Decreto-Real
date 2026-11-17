import React from 'react';
import { CardActivationBanner } from './CardActivationBanner';
import { ComboEffectOverlay } from './ComboEffectOverlay';
import { TurnAnnouncement, TURN_TRANSITION_DURATION_MS } from './CombatEventUI';
import { cardEffectCue, DECREE_BANNER_DURATION_MS, DECREE_EFFECT_DURATION_MS } from '../game/effectCues';
import type { MultiplayerCue } from '../game/multiplayerPresentation';
import type { CardData } from '../types';

/** PvP uses the *same* decree and turn presenter as Versus IA.
 * WebSocket updates choose the cue; animations never commit combat actions. */
export function MultiplayerCinematicCue({ cue, onEnded }: {
  cue: MultiplayerCue; onEnded: () => void;
}) {
  const [stage, setStage] = React.useState<'banner' | 'effect'>('banner');
  const callback = React.useRef(onEnded);
  callback.current = onEnded;

  React.useEffect(() => {
    setStage('banner');
    const duration = cue.kind === 'turn' ? TURN_TRANSITION_DURATION_MS
      : cue.kind === 'combo' ? DECREE_EFFECT_DURATION_MS : DECREE_BANNER_DURATION_MS;
    const timeout = window.setTimeout(() => {
      if (cue.kind === 'card' && (cardEffectCue(cue.cardType).file || cue.cardType === 'IMPACT')) setStage('effect');
      else callback.current();
    }, duration);
    return () => window.clearTimeout(timeout);
  }, [cue.id]);

  React.useEffect(() => {
    if (cue.kind !== 'card' || stage !== 'effect') return;
    const timeout = window.setTimeout(() => callback.current(), DECREE_EFFECT_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [cue.id, stage]);

  if (cue.kind === 'turn') return <TurnAnnouncement fullscreen
    variant={cue.isPlayer ? 'player' : 'opponent'}/>;
  if (cue.kind === 'combo') return <ComboEffectOverlay level={cue.level} ability={cue.ability}
    isPlayer={cue.isPlayer} paused={false}/>;

  const names = { ATTACK: 'Decreto de Ataque', DEFENSE: 'Decreto de Defensa',
    ORDER: 'Decreto de Orden', IMPACT: cue.rank === 4 ? 'Impacto Final' : 'Impacto ' + (cue.rank ?? 1) };
  const effects = { ATTACK: 'Causa 2 puntos de daño', DEFENSE: 'Recupera 1 punto de vida',
    ORDER: 'Roba 1 carta extra', IMPACT: 'Sella el Impacto' };
  const card: CardData = {
    id: 'pvp-cue-' + cue.id,
    type: cue.cardType,
    name: names[cue.cardType],
    description: effects[cue.cardType],
    rank: cue.rank,
    cost: 0,
    img: '',
  };
  return <CardActivationBanner key={cue.id + '-' + stage}
    card={card} isPlayer={cue.isPlayer} paused={false} stage={stage}/>;
}
