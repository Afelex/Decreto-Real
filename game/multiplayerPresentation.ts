/** A visual-only cue derived from a server-authoritative match update.
 * It never changes rules, turn ownership, rewards or the outcome. */
export type MultiplayerCue = (
  | { kind: 'turn'; id: number; isPlayer: boolean }
  | { kind: 'card'; id: number; isPlayer: boolean; cardType: 'ATTACK' | 'DEFENSE' | 'ORDER' | 'IMPACT'; rank?: number }
);
export type MultiplayerCueView = {
  revision: number;
  turnNumber: number;
  isMyTurn: boolean;
  status: 'playing' | 'finished';
  lastEvent: string;
};

export function multiplayerCueFromState(previous: MultiplayerCueView | null, next: MultiplayerCueView): MultiplayerCue | null {
  // First live state after joining: the opening player gets the red video,
  // and their opponent sees the corresponding blue video.
  if (!previous) return next.status === 'playing'
    ? { kind: 'turn', id: next.revision, isPlayer: next.isMyTurn } : null;
  // Reconnects and presence broadcasts can resend the same revision.
  if (next.revision <= previous.revision) return null;
  if (next.turnNumber > previous.turnNumber && next.status === 'playing')
    return { kind: 'turn', id: next.revision, isPlayer: next.isMyTurn };

  // The backend reports one accepted card per revision. On a final blow the
  // new state has no active turn, so use the PREVIOUS owner to identify actor.
  const event = next.lastEvent;
  const decree = event.match(/ jugó Decreto de (Ataque|Defensa|Orden)\.$/);
  if (decree) {
    const kind = { Ataque: 'ATTACK', Defensa: 'DEFENSE', Orden: 'ORDER' } as const;
    return { kind: 'card', id: next.revision, isPlayer: previous.isMyTurn,
      cardType: kind[decree[1] as keyof typeof kind] };
  }
  const impact = event.match(/ jugó Impacto ([1-4]|Final)\.$/);
  if (impact) return { kind: 'card', id: next.revision, isPlayer: previous.isMyTurn,
    cardType: 'IMPACT', rank: impact[1] === 'Final' ? 4 : Number(impact[1]) };
  return null;
}
