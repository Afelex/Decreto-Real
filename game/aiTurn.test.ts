import assert from 'node:assert/strict';
import test from 'node:test';
import { AI_OPENING_DELAY_MS, AiTurnController, runOpponentTurn } from './aiTurn.ts';

const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const card = (id: string, type: 'ATTACK' | 'DEFENSE' | 'IMPACT', rank?: number) => ({ id, type, rank });

test('consecutive turns read the current hand, health and Impact level', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const played: string[] = [];
  let state = { hand: [card('impact1', 'IMPACT', 1)], health: 5, impactLevel: 0 };
  let finished = 0;
  const play = (c: ReturnType<typeof card>) => {
    played.push(c.id);
    state.hand = state.hand.filter(item => item.id !== c.id);
    if (c.type === 'IMPACT') { state.impactLevel++; state.health++; }
    if (c.type === 'DEFENSE') state.health++;
  };
  const first = runOpponentTurn(new AiTurnController(), () => state, play, () => finished++);
  t.mock.timers.tick(AI_OPENING_DELAY_MS); await flush();
  await first;
  state = { hand: [card('impact2', 'IMPACT', 2), card('heal', 'DEFENSE'), card('attack', 'ATTACK')], health: 4, impactLevel: 1 };
  const second = runOpponentTurn(new AiTurnController(), () => state, play, () => finished++);
  t.mock.timers.tick(AI_OPENING_DELAY_MS); await flush();
  await second;
  // Impact raised health to five: an obsolete snapshot would play defense.
  assert.deepEqual(played, ['impact1', 'impact2', 'attack']);
  assert.equal(finished, 2);
  assert.equal(state.hand[0].id, 'heal');
});

test('pause preserves the remaining opening delay and resumes the AI once', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const controller = new AiTurnController();
  const state = { hand: [card('a', 'ATTACK'), card('b', 'ATTACK')], health: 10, impactLevel: 0 };
  const played: string[] = [];
  let finished = 0;
  const run = runOpponentTurn(controller, () => state, c => {
    played.push(c.id); state.hand = state.hand.filter(item => item.id !== c.id);
  }, () => finished++);
  t.mock.timers.tick(150); controller.pause();
  t.mock.timers.tick(10000); await flush();
  assert.deepEqual(played, []);
  controller.resume(); t.mock.timers.tick(AI_OPENING_DELAY_MS - 151); await flush();
  assert.deepEqual(played, []);
  t.mock.timers.tick(1); await flush();
  await run;
  assert.deepEqual(played, ['a', 'b']);
  assert.equal(finished, 1);
});

test('cancelling a paused turn cancels cards, deferred abilities and turn completion', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const controller = new AiTurnController();
  let actions = 0;
  const run = runOpponentTurn(controller, () => ({ hand: [card('a', 'ATTACK')], health: 10, impactLevel: 0 }), () => { actions++; }, () => { actions++; });
  const ability = controller.wait(800).then(active => { if (active) actions++; });
  controller.pause(); controller.cancel(); controller.resume();
  t.mock.timers.tick(20000); await Promise.all([run, ability]);
  assert.equal(actions, 0);
  assert.equal(await controller.wait(1), false);
});

test('cancellation during an asynchronous card prevents further cards and finishing', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const controller = new AiTurnController();
  const state = { hand: [card('a', 'ATTACK'), card('b', 'ATTACK')], health: 10, impactLevel: 0 };
  let releaseVisual: () => void = () => {};
  const visual = new Promise<void>(resolve => { releaseVisual = resolve; });
  const played: string[] = [];
  let finished = 0;
  const run = runOpponentTurn(controller, () => state, async c => {
    played.push(c.id);
    state.hand = state.hand.filter(item => item.id !== c.id);
    if (c.id === 'a') await visual;
  }, () => finished++);
  t.mock.timers.tick(AI_OPENING_DELAY_MS); await flush();
  assert.deepEqual(played, ['a']);
  controller.cancel();
  releaseVisual();
  await run;
  assert.deepEqual(played, ['a']);
  assert.equal(finished, 0);
});

test('AI waits for the complete visual card cue but adds no silent 1.5 s afterward', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const controller = new AiTurnController();
  const state = { hand: [card('a', 'ATTACK'), card('b', 'ATTACK')], health: 10, impactLevel: 0 };
  let releaseVisual: () => void = () => {};
  const visual = new Promise<void>(resolve => { releaseVisual = resolve; });
  const played: string[] = [];
  let finished = 0;
  const run = runOpponentTurn(controller, () => state, async c => {
    played.push(c.id);
    state.hand = state.hand.filter(item => item.id !== c.id);
    if (c.id === 'a') await visual;
  }, () => finished++);
  t.mock.timers.tick(AI_OPENING_DELAY_MS); await flush();
  assert.deepEqual(played, ['a']);
  t.mock.timers.tick(4000); await flush(); // first card is still animating
  assert.deepEqual(played, ['a']);
  assert.equal(finished, 0);
  releaseVisual();
  await flush();
  await run; // must finish without advancing a further 1.5-second timer
  assert.deepEqual(played, ['a', 'b']);
  assert.equal(finished, 1);
});

test('AI plays Orders, draws their replacements and then attacks', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  type C = { id: string; type: 'ATTACK' | 'DEFENSE' | 'IMPACT' | 'ORDER'; rank?: number };
  const state = { hand: [{ id: 'order1', type: 'ORDER' } as C], health: 20, impactLevel: 0 };
  const played: string[] = [];
  let draws = 0;
  const run = runOpponentTurn(new AiTurnController(), () => state, current => {
    played.push(current.id);
    state.hand = state.hand.filter(item => item.id !== current.id);
    if (current.type === 'ORDER') state.hand.push(++draws === 1 ? { id: 'order2', type: 'ORDER' } : { id: 'attack', type: 'ATTACK' });
  }, () => played.push('finished'));
  t.mock.timers.tick(AI_OPENING_DELAY_MS); await flush();
  await run;
  assert.deepEqual(played, ['order1', 'order2', 'attack', 'finished']);
});

test('IA reserva Sol Negro para un turno sin Impacto y no entra en bucle', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  type C = { id: string; type: 'MYSTIC' | 'ATTACK'; mysticId?: string };
  const state = { hand: [{ id: 'sun', type: 'MYSTIC', mysticId: 'siguman-3' }, { id: 'atk', type: 'ATTACK' }] as C[],
    health: 10, impactLevel: 2, impactPlayedThisTurn: true };
  const used: string[] = [];
  const run = runOpponentTurn(new AiTurnController(), () => state, c => {
    used.push(c.id);
    state.hand = state.hand.filter(current => current.id !== c.id);
  }, () => used.push('end'));
  t.mock.timers.tick(AI_OPENING_DELAY_MS); await flush();
  await run;
  assert.deepEqual(used, ['atk', 'end']);
  assert.equal(state.hand.length, 1);
});
