import React, { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { scenario } from '../scenarios';
import CombatPrototype, { TUTORIAL_KEY } from '../../screens/CombatPrototype';
import TutorialScreen from '../../screens/TutorialScreen';
import { applyCombatAction, createCombat, exportCombat, invalidAction, replayCombat, type CombatAction, type CombatState } from '../../game/combatEngine';
import { SAVE_FORMAT, SAVE_KEY } from '../../game/combatSave';
import { createTutorialCombat, tutorialCards } from '../../game/tutorial';

let seed = 0;
beforeEach(() => {
  vi.useFakeTimers(); localStorage.clear(); localStorage.setItem(TUTORIAL_KEY, 'omitido');
  vi.spyOn(crypto, 'getRandomValues').mockImplementation(array => {
    new Uint32Array(array!.buffer, array!.byteOffset, 1)[0] = seed;
    return array;
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });
function mount(path = '/duelo-v1') {
  return render(<StrictMode><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/duelo-v1" element={<CombatPrototype/>}/>
    <Route path="/duelo-v1/tutorial" element={<TutorialScreen/>}/>
    <Route path="/" element={<h1>Menú principal</h1>}/>
  </Routes></MemoryRouter></StrictMode>);
}
function cards() { return [...document.querySelectorAll<HTMLButtonElement>('.dr-card')]; }
function expectState(state: CombatState) {
  expect(document.querySelector('.dr-player .dr-person b')?.textContent?.replace(/\s/g, '')).toBe(`♥${state.playerHp}/20🛡${state.shield}`);
  expect(document.querySelector('.dr-rival .dr-person b')?.textContent?.replace(/\s/g, '')).toBe(`♥${state.enemyHp}/20🛡${state.enemyShield}`);
  expect(document.querySelector('.dr-top small')?.textContent).toContain(`TURNO ${state.turn}`);
  if (state.phase !== 'finished') {
    expect(cards().length).toBe(state.hand.length);
    expect(document.querySelector('.dr-mana strong')?.textContent).toBe(`${state.mana}/3`);
  }
}
function useCard(state: CombatState, id: string) {
  const index = state.hand.findIndex(c => c.id === id);
  fireEvent.click(cards()[index]);
  expect(cards()[index].getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Jugar carta' }));
}

describe('/duelo-v1 + real DR-01 engine', () => {
  it('selects, cancels, confirms a card and reflects hand, discard and engine counters', () => {
    seed = 0; mount(); let state = createCombat(seed); expectState(state);
    const card = state.hand.find(c => !invalidAction(state, { type: 'play', cardId: c.id }))!;
    fireEvent.click(cards()[state.hand.indexOf(card)]);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' })); expectState(state);
    expect(screen.queryByRole('button', { name: 'Jugar carta' })).toBeNull();
    useCard(state, card.id); state = applyCombatAction(state, { type: 'play', cardId: card.id }).state; expectState(state);
    fireEvent.click(screen.getByRole('button', { name: /Mazo/ }));
    fireEvent.click(screen.getByRole('button', { name: /Descarte/ }));
    expect(within(screen.getByRole('dialog')).getByText(card.name)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Volver a la partida' }));
    for (const [index, item] of state.hand.entries()) {
      if (invalidAction(state, { type: 'play', cardId: item.id })) {
        expect(cards()[index].getAttribute('aria-disabled')).toBe('true');
        fireEvent.click(cards()[index]);
        expect(screen.queryByRole('button', { name: 'Jugar carta' })).toBeNull();
      }
    }
  });

  it('shows rival turn, blocks actions and resolves exactly once at 700 ms in StrictMode', () => {
    seed = 1; mount(); let state = createCombat(seed);
    fireEvent.click(screen.getByRole('button', { name: /TERMINAR TURNO/ }));
    state = applyCombatAction(state, { type: 'end_turn' }).state;
    expect(document.querySelector('.dr-prompt')?.textContent).toContain('TURNO DEL RIVAL');
    expect((screen.getByRole('button', { name: /TERMINAR TURNO/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(cards()[0]); expect(screen.queryByRole('button', { name: 'Jugar carta' })).toBeNull();
    act(() => vi.advanceTimersByTime(699)); expectState(state);
    act(() => vi.advanceTimersByTime(1)); state = applyCombatAction(state, { type: 'resolve_rival' }).state; expectState(state);
    act(() => vi.advanceTimersByTime(3000)); expectState(state);
  });

  it('pauses/resumes without changing counters, supports backdrop close and exit', () => {
    seed = 2; mount(); const initial = createCombat(seed);
    fireEvent.click(screen.getByRole('button', { name: 'Pausar partida' }));
    expect(screen.getByRole('dialog', { name: 'Pausa' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /TERMINAR TURNO/ }));
    act(() => vi.advanceTimersByTime(5000)); expectState(initial);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar partida' }));
    expect(screen.queryByRole('dialog')).toBeNull(); expectState(initial);
    fireEvent.click(screen.getByRole('button', { name: 'Pausar partida' }));
    fireEvent.click(document.querySelector('.dr-overlay')!); expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Pausar partida' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salir al menú' }));
    expect(screen.getByRole('heading', { name: 'Menú principal' })).toBeTruthy();
  });

  it('opens help, deck tabs, history and difficulty dialogs and closes them', () => {
    seed = 3; mount();
    fireEvent.click(screen.getByRole('button', { name: 'Reglas del prototipo' }));
    expect(screen.getByRole('dialog', { name: 'Cómo se juega' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
    fireEvent.click(screen.getByRole('button', { name: /Mazo/ }));
    fireEvent.click(screen.getByRole('button', { name: /Descarte/ }));
    expect(screen.getByText('Aún no has jugado cartas.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar mazo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver historial de jugadas' }));
    expect(screen.getByRole('dialog', { name: 'Últimas jugadas' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar historial' }));
    fireEvent.click(screen.getByRole('button', { name: /IA ·/ }));
    fireEvent.click(screen.getByRole('button', { name: /Maestro/ }));
    expect(localStorage.getItem('decreto-difficulty')).toBe('Maestro');
    expect(screen.getByRole('button', { name: /IA · Maestro/ })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('contains keyboard focus in dialogs, closes with Escape and restores focus', async () => {
    seed = 4; mount();
    vi.useRealTimers();
    const user = userEvent.setup();
    const opener = screen.getByRole('button', { name: 'Reglas del prototipo' });
    opener.focus(); await user.click(opener);
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
    const buttons = within(dialog).getAllByRole('button');
    buttons.at(-1)!.focus(); await user.tab(); expect(document.activeElement).toBe(buttons[0]);
    await user.keyboard('{Escape}'); expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  for (const [buttonName, title] of [
    ['Pausar partida', 'Pausa'], ['Ver historial de jugadas', 'Últimas jugadas'],
    [/Mazo/, 'Tus cartas'], [/IA ·/, 'Rival de IA'],
  ] as const) it(`restores focus and closes ${title} with Escape`, () => {
    seed = 4; mount();
    const opener = screen.getByRole('button', { name: buttonName });
    opener.focus(); fireEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: title });
    expect(dialog.contains(document.activeElement)).toBe(true);
    const buttons = within(dialog).getAllByRole('button');
    buttons[0].focus(); fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(buttons.at(-1));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull(); expect(document.activeElement).toBe(opener);
    expectState(createCombat(seed));
  });

  it('cancels pending rival resolution when leaving the route', () => {
    seed = 1; const view = mount();
    fireEvent.click(screen.getByRole('button', { name: /TERMINAR TURNO/ }));
    expect(vi.getTimerCount()).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: /Menú/ }));
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByRole('heading', { name: 'Menú principal' })).toBeTruthy();
    view.unmount(); expect(vi.getTimerCount()).toBe(0);
  });

  for (const winner of ['player', 'rival'] as const) it(`completes a real seeded ${winner} result through UI actions and matches replay`, () => {
    const run = scenario(winner); seed = run.seed; mount(); let state = createCombat(seed);
    for (const action of run.actions) {
      if (action.type === 'play') useCard(state, action.cardId);
      else if (action.type === 'end_turn') fireEvent.click(screen.getByRole('button', { name: /TERMINAR TURNO/ }));
      else if (action.type === 'resolve_rival') act(() => vi.advanceTimersByTime(700));
      state = applyCombatAction(state, action).state; expectState(state);
    }
    expect(state).toEqual(run.state);
    expect(replayCombat(exportCombat(state))).toEqual(state);
    expect(screen.getByRole('heading', { name: winner === 'player' ? '¡Victoria!' : 'Derrota' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /TERMINAR TURNO/ })).toBeNull();
    // Focusing the result heading queues a jsdom selection task; after flushing, nothing of the duel remains.
    act(() => vi.advanceTimersByTime(5000)); expectState(state);
    expect(vi.getTimerCount()).toBe(0);
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    if (winner === 'player') {
      // Restart in place: a fresh seeded game, no document reload, nothing left of the finished one.
      seed = 12; fireEvent.click(screen.getByRole('button', { name: 'Jugar otra vez' }));
      expectState(createCombat(12));
    } else {
      fireEvent.click(screen.getByRole('button', { name: 'Volver al menú' }));
      expect(screen.getByRole('heading', { name: 'Menú principal' })).toBeTruthy();
    }
  });
});

const endTurnButton = () => screen.getByRole('button', { name: /TERMINAR TURNO/ });
function firstPlayable(state: CombatState) { return state.hand.find(c => !invalidAction(state, { type: 'play', cardId: c.id }))!; }
function apply(state: CombatState, action: CombatAction) { const result = applyCombatAction(state, action); expect(result.error).toBeNull(); return result.state; }
function savedRecord() { return JSON.parse(localStorage.getItem(SAVE_KEY)!).record; }

describe('local save and recovery', () => {
  it('saves after accepted actions and resumes the same state, RNG and difficulty after a reload', () => {
    seed = 6; const view = mount(); let state = createCombat(seed);
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    const card = firstPlayable(state);
    useCard(state, card.id); state = apply(state, { type: 'play', cardId: card.id });
    expect(screen.getByText('✓ Guardado')).toBeTruthy();
    fireEvent.click(endTurnButton()); state = apply(state, { type: 'end_turn' });
    act(() => vi.advanceTimersByTime(700)); state = apply(state, { type: 'resolve_rival' });
    fireEvent.click(screen.getByRole('button', { name: /IA ·/ })); fireEvent.click(screen.getByRole('button', { name: /Maestro/ }));
    state = apply(state, { type: 'difficulty', value: 'Maestro' });
    view.unmount();
    seed = 999; mount(); // a resumed game must not take the new seed
    expect(screen.getByRole('heading', { name: '¿Continuar el duelo?' })).toBeTruthy();
    expect(screen.getByText(new RegExp(`Turno ${state.turn} · Tu vida ${state.playerHp}/20`))).toBeTruthy();
    expect(document.activeElement?.textContent).toBe('Continuar partida');
    fireEvent.click(screen.getByRole('button', { name: 'Continuar partida' }));
    expectState(state);
    expect(screen.getByText(`Partida recuperada en el turno ${state.turn}.`)).toBeTruthy();
    expect(screen.getByRole('button', { name: /IA · Maestro/ })).toBeTruthy();
    fireEvent.click(endTurnButton()); state = apply(state, { type: 'end_turn' });
    act(() => vi.advanceTimersByTime(700)); state = apply(state, { type: 'resolve_rival' });
    expectState(state);
    expect(replayCombat(savedRecord())).toEqual(state);
  });

  it('resolves a rival response interrupted by a reload exactly once', () => {
    seed = 7; const view = mount(); let state = createCombat(seed);
    fireEvent.click(endTurnButton()); state = apply(state, { type: 'end_turn' });
    act(() => vi.advanceTimersByTime(400)); view.unmount();
    expect(vi.getTimerCount()).toBe(0);
    mount();
    expect(screen.getByText(/se resolverá una sola vez/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar partida' }));
    expect(document.querySelector('.dr-prompt')?.textContent).toContain('TURNO DEL RIVAL');
    act(() => vi.advanceTimersByTime(699)); expectState(state);
    act(() => vi.advanceTimersByTime(1)); state = apply(state, { type: 'resolve_rival' }); expectState(state);
    act(() => vi.advanceTimersByTime(3000)); expectState(state);
    const record = savedRecord();
    expect(record.journal.filter((e: { action: CombatAction }) => e.action.type === 'resolve_rival')).toHaveLength(1);
    expect(replayCombat(record)).toEqual(state);
  });

  it('a new game from the lobby keeps the saved one until the first accepted move', () => {
    seed = 8; const first = mount(); const state = createCombat(seed);
    fireEvent.click(endTurnButton()); first.unmount();
    const before = localStorage.getItem(SAVE_KEY);
    seed = 9; const second = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva partida' }));
    expectState(createCombat(9));
    expect(localStorage.getItem(SAVE_KEY)).toBe(before);
    second.unmount(); mount();
    expect(screen.getByRole('button', { name: 'Continuar partida' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Nueva partida' }));
    fireEvent.click(endTurnButton());
    expect(savedRecord().seed).toBe(9);
    expect(savedRecord().seed).not.toBe(state.seed);
  });

  it('corrupt saves get a clear message and discarding removes only the game key', () => {
    localStorage.setItem('otra-aplicacion', 'conservar');
    localStorage.setItem(SAVE_KEY, '{"format":1,"record":{"version":"dr-combat-2","seed":3,"difficulty":"Estratega","journal":[{"action":{"type":"play","cardId":"carta-0"},"events":[]}]}}');
    seed = 10; mount();
    expect(screen.getByRole('alert').textContent).toMatch(/dañada o incompleta/);
    fireEvent.click(screen.getByRole('button', { name: 'Descartar y empezar una nueva' }));
    expectState(createCombat(10));
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(localStorage.getItem('otra-aplicacion')).toBe('conservar');
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('omitido');
  });

  it('incompatible versions are reported as such, not as corruption', () => {
    const record = exportCombat(applyCombatAction(createCombat(1), { type: 'end_turn' }).state);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ format: SAVE_FORMAT, record: { ...record, version: 'dr-combat-9' } }));
    mount();
    expect(screen.getByRole('alert').textContent).toMatch(/versión incompatible/);
  });

  it('plays normally when storage is unavailable (regression: reading the difficulty threw on mount)', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')!;
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('denied', 'SecurityError'); } });
    try {
      seed = 11; mount(); let state = createCombat(seed);
      expect(screen.getByText(/no permite guardar/)).toBeTruthy();
      const card = firstPlayable(state);
      useCard(state, card.id); state = apply(state, { type: 'play', cardId: card.id }); expectState(state);
      fireEvent.click(screen.getByRole('button', { name: 'Entendido' }));
      expect(screen.queryByText(/no permite guardar/)).toBeNull();
      expect(screen.getByText('⚠ Sin guardar')).toBeTruthy();
    } finally { Object.defineProperty(window, 'localStorage', descriptor); }
  });

  it('keeps playing when the storage quota is exhausted', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError'); });
    seed = 13; mount(); let state = createCombat(seed);
    fireEvent.click(endTurnButton()); state = apply(state, { type: 'end_turn' });
    expect(screen.getByText(/No hay espacio de almacenamiento/)).toBeTruthy();
    act(() => vi.advanceTimersByTime(700)); state = apply(state, { type: 'resolve_rival' });
    const card = firstPlayable(state);
    useCard(state, card.id); state = apply(state, { type: 'play', cardId: card.id }); expectState(state);
  });
});

describe('blocked cards and messages', () => {
  it('explains why a blocked card cannot be played instead of ignoring the tap', () => {
    seed = [...Array(200).keys()].find(n => createCombat(n).hand.some(c => c.effect.type === 'impact' && c.effect.rank > 1))!;
    mount(); const state = createCombat(seed);
    const index = state.hand.findIndex(c => c.effect.type === 'impact' && c.effect.rank > 1);
    const card = cards()[index];
    expect(card.getAttribute('aria-disabled')).toBe('true');
    expect(card.querySelector('.dr-lock')?.textContent).toBe('Fuera de orden');
    expect(card.getAttribute('aria-label')).toContain('Bloqueada: Primero debes sellar el Impacto I.');
    fireEvent.click(card);
    expect(document.querySelector('.dr-prompt')?.textContent).toBe(`${state.hand[index].name}: Primero debes sellar el Impacto I.`);
    expect(screen.queryByRole('button', { name: 'Jugar carta' })).toBeNull();
    expectState(state);
  });

  it('shows both players’ Impacts on the board at all times', () => {
    seed = 0; mount();
    expect(document.querySelector('.dr-player .dr-seals')?.getAttribute('aria-label')).toBe('Tus Impactos: 0 de 4');
    expect(document.querySelector('.dr-rival .dr-seals')?.getAttribute('aria-label')).toBe('Impactos del rival: 0 de 4');
  });
});

describe('first visit and guided tutorial', () => {
  const coach = () => screen.getByRole('heading', { level: 2 }).textContent;
  const tutorialCard = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}, coste`) });
  function playGuided(name: string) {
    fireEvent.click(tutorialCard(name));
    expect(document.querySelector('.dr-confirm')?.classList.contains('dr-guide-target')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Jugar carta' }));
  }
  function walkToDone() {
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    expect(coach()).toBe('Elige una carta');
    expect(tutorialCard('Golpe preciso').classList.contains('dr-guide-target')).toBe(true);
    fireEvent.click(tutorialCard('Golpe preciso'));
    expect(coach()).toBe('Confirma la jugada');
    fireEvent.click(screen.getByRole('button', { name: 'Jugar carta' }));
    expect(coach()).toBe('Ataca y defiéndete');
    playGuided('Bastión');
    expect(coach()).toBe('Mando e Impactos');
    expect(tutorialCard('Impacto I').getAttribute('aria-label')).toContain('Bloqueada: Te faltan 1 de mando.');
    fireEvent.click(endTurnButton());
    expect(coach()).toBe('Turno del rival');
    act(() => vi.advanceTimersByTime(700));
    expect(coach()).toBe('Respuesta del rival');
    expect(document.querySelector('.dr-coach')?.textContent).toContain('El rival ataca por 3. Tu escudo bloquea 3 y pierdes 0 de vida.');
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(coach()).toBe('Sella un Impacto');
    playGuided('Impacto I');
    expect(coach()).toBe('Tutorial completado');
  }

  it('offers the tutorial on a first visit and can go straight to the duel', () => {
    localStorage.removeItem(TUTORIAL_KEY); seed = 14; const view = mount();
    expect(screen.getByRole('heading', { name: '¿Primera vez en el duelo?' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ir directamente al duelo' }));
    expectState(createCombat(14));
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('omitido');
    view.unmount(); localStorage.removeItem(TUTORIAL_KEY); mount();
    fireEvent.click(screen.getByRole('button', { name: 'Aprender a jugar' }));
    expect(coach()).toBe('Bienvenida al duelo');
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('visto');
  });

  it('completes through the real engine, never writes the duel save and leads to a fresh duel', () => {
    mount('/duelo-v1/tutorial');
    expect(coach()).toBe('Bienvenida al duelo');
    expect(document.querySelector('.dr-top small')?.textContent).toBe('TUTORIAL · TURNO 1');
    walkToDone();
    const initial = createTutorialCombat(); const ids = tutorialCards(initial);
    let state = initial;
    for (const action of [{ type: 'play', cardId: ids.attack }, { type: 'play', cardId: ids.defense }, { type: 'end_turn' }, { type: 'resolve_rival' }, { type: 'play', cardId: ids.impact }] as CombatAction[]) state = apply(state, action);
    expectState(state);
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    seed = 15; fireEvent.click(screen.getByRole('button', { name: 'Jugar un duelo' }));
    expectState(createCombat(15));
    expect(document.querySelector('.dr-top small')?.textContent).toBe('DUELO DE PRUEBA · TURNO 1');
  });

  it('refuses off-guide moves with a clear message and without touching the engine state', () => {
    mount('/duelo-v1/tutorial');
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    fireEvent.click(tutorialCard('Guardia real'));
    expect(document.querySelector('.dr-prompt')?.textContent).toBe('Sigue el paso indicado en la guía.');
    expect(screen.queryByRole('button', { name: 'Jugar carta' })).toBeNull();
    fireEvent.click(endTurnButton());
    expectState(createTutorialCombat());
    expect(coach()).toBe('Elige una carta');
  });

  it('can be skipped, abandoned during the rival response and reopened from scratch', () => {
    localStorage.removeItem(TUTORIAL_KEY);
    const view = mount('/duelo-v1/tutorial');
    fireEvent.click(screen.getByRole('button', { name: 'Omitir' }));
    expect(localStorage.getItem(TUTORIAL_KEY)).toBe('omitido');
    expect(document.querySelector('.dr-top small')?.textContent).toBe('DUELO DE PRUEBA · TURNO 1');
    view.unmount(); mount('/duelo-v1/tutorial');
    fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    fireEvent.click(tutorialCard('Golpe preciso')); fireEvent.click(screen.getByRole('button', { name: 'Jugar carta' }));
    playGuided('Bastión'); fireEvent.click(endTurnButton());
    expect(vi.getTimerCount()).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: /Salir/ }));
    expect(vi.getTimerCount()).toBe(0);
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Reglas del prototipo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver tutorial guiado' }));
    expect(coach()).toBe('Bienvenida al duelo');
    expectState(createTutorialCombat());
  });

  it('restarts from the final step with an identical fresh situation', () => {
    mount('/duelo-v1/tutorial');
    walkToDone();
    fireEvent.click(screen.getByRole('button', { name: 'Repetir tutorial' }));
    expect(coach()).toBe('Bienvenida al duelo');
    expectState(createTutorialCombat());
    walkToDone();
  });
});
