import { applyCombatAction, createCombat, invalidAction, type CombatAction } from '../game/combatEngine.ts';

export function scenario(winner: 'player' | 'rival') {
  for (let candidate = 0; candidate < 200; candidate++) {
    let state = createCombat(candidate);
    const actions: CombatAction[] = [];
    for (let step = 0; step < 120 && state.phase !== 'finished'; step++) {
      const card = state.hand.find(c => !invalidAction(state, { type: 'play', cardId: c.id }));
      const action: CombatAction = state.phase === 'rival' ? { type: 'resolve_rival' } : card ? { type: 'play', cardId: card.id } : { type: 'end_turn' };
      actions.push(action); state = applyCombatAction(state, action).state;
    }
    if (state.winner === winner) return { seed: candidate, actions, state };
  }
  throw Error(`No scenario for ${winner}`);
}
