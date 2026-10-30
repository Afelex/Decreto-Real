/** Timed AI work belongs to one turn. Pausing preserves the remaining delay. */
export class AiTurnController {
  private paused = false;
  private cancelled = false;
  private waits = new Set<{ remaining: number; started: number; timer?: ReturnType<typeof setTimeout>; resolve: (active: boolean) => void }>();

  get active() { return !this.cancelled; }

  wait(duration: number): Promise<boolean> {
    if (this.cancelled) return Promise.resolve(false);
    return new Promise(resolve => {
      const work = { remaining: duration, started: 0, resolve };
      this.waits.add(work);
      if (!this.paused) this.arm(work);
    });
  }

  private arm(work: { remaining: number; started: number; timer?: ReturnType<typeof setTimeout>; resolve: (active: boolean) => void }) {
    work.started = Date.now();
    work.timer = setTimeout(() => {
      this.waits.delete(work);
      work.resolve(!this.cancelled);
    }, work.remaining);
  }

  pause() {
    if (this.paused || this.cancelled) return;
    this.paused = true;
    for (const work of this.waits) {
      clearTimeout(work.timer);
      work.remaining = Math.max(0, work.remaining - (Date.now() - work.started));
    }
  }

  resume() {
    if (!this.paused || this.cancelled) return;
    this.paused = false;
    for (const work of this.waits) this.arm(work);
  }

  cancel() {
    this.cancelled = true;
    for (const work of this.waits) {
      clearTimeout(work.timer);
      work.resolve(false);
    }
    this.waits.clear();
  }
}

type AiCard = { id: string; type: 'ATTACK' | 'DEFENSE' | 'IMPACT'; rank?: number };
type AiSnapshot<C extends AiCard> = { hand: C[]; health: number; impactLevel: number };

/** Keep the existing priority: one legal Impact, defenses below 5 HP, then attacks. */
export async function runOpponentTurn<C extends AiCard>(
  controller: AiTurnController,
  read: () => AiSnapshot<C>,
  play: (card: C) => void,
  finish: () => void,
) {
  if (!await controller.wait(1000)) return;
  const perform = async (card: C) => {
    if (!controller.active) return false;
    play(card);
    return controller.wait(1500);
  };
  let state = read();
  const impact = state.hand.find(card => card.type === 'IMPACT' && card.rank === state.impactLevel + 1);
  if (impact && !await perform(impact)) return;
  state = read();
  if (state.health < 5) {
    let defense: C | undefined;
    while ((defense = read().hand.find(card => card.type === 'DEFENSE'))) {
      if (!await perform(defense)) return;
    }
  }
  let attack: C | undefined;
  while ((attack = read().hand.find(card => card.type === 'ATTACK'))) {
    if (!await perform(attack)) return;
  }
  if (controller.active) finish();
}
