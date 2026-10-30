import { createCombat, type CombatState } from './combatEngine.ts';

/**
 * Guided tutorial on top of the normal engine: a fixed seed prepares the hand, every move is a regular
 * engine action and nothing is saved, so no advantage survives leaving the tutorial.
 * If catalog, shuffle or RNG change, tutorial.test.ts fails and this seed must be chosen again.
 */
export const TUTORIAL_SEED = 2308;
export const TUTORIAL_DIFFICULTY = 'Aprendiz' as const;
export const createTutorialCombat = () => createCombat(TUTORIAL_SEED, TUTORIAL_DIFFICULTY);

export type TutorialStepId = 'intro' | 'select' | 'confirm' | 'defend' | 'end_turn' | 'rival' | 'impact' | 'done';
export type TutorialCards = { attack: string; defense: string; impact: string };
export type TutorialProgress = { state: CombatState; selected: string | null; acknowledged: ReadonlySet<TutorialStepId> };

export function tutorialCards(initial: CombatState): TutorialCards {
  const find = (name: string) => {
    const card = initial.hand.find(item => item.name === name);
    if (!card) throw new Error(`Tutorial seed lacks ${name}`);
    return card.id;
  };
  return { attack: find('Golpe preciso'), defense: find('Bastión'), impact: find('Impacto I') };
}

const played = (state: CombatState, cardId: string) => state.journal.some(entry => entry.action.type === 'play' && entry.action.cardId === cardId);
const has = (state: CombatState, type: string) => state.journal.some(entry => entry.action.type === type);

/** The current step is the first one not completed, so cancelling a selection simply steps back. */
export function tutorialStep({ state, selected, acknowledged }: TutorialProgress, cards: TutorialCards): TutorialStepId {
  if (!acknowledged.has('intro')) return 'intro';
  if (!played(state, cards.attack)) return selected === cards.attack ? 'confirm' : 'select';
  if (!played(state, cards.defense)) return 'defend';
  if (!has(state, 'end_turn')) return 'end_turn';
  if (!has(state, 'resolve_rival') || !acknowledged.has('rival')) return 'rival';
  if (!played(state, cards.impact)) return 'impact';
  return 'done';
}

/** One main action per step: which card may be selected/played, and whether the turn may end. */
export function tutorialAllows(step: TutorialStepId, cards: TutorialCards, move: { kind: 'select' | 'play'; cardId: string } | { kind: 'end_turn' }) {
  if (move.kind === 'end_turn') return step === 'end_turn';
  if (step === 'select' || step === 'confirm') return move.cardId === cards.attack;
  if (step === 'defend') return move.cardId === cards.defense;
  if (step === 'impact') return move.cardId === cards.impact;
  return false;
}

export function tutorialTarget(step: TutorialStepId, cards: TutorialCards, selected: string | null): string | null {
  if (step === 'select') return cards.attack;
  if (step === 'confirm') return 'confirm';
  if (step === 'defend' || step === 'impact') return selected === (step === 'defend' ? cards.defense : cards.impact) ? 'confirm' : step === 'defend' ? cards.defense : cards.impact;
  if (step === 'end_turn') return 'end_turn';
  return null;
}

export const TUTORIAL_STEPS: TutorialStepId[] = ['intro', 'select', 'confirm', 'defend', 'end_turn', 'rival', 'impact', 'done'];
