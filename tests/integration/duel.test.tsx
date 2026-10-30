import React, { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { scenario } from '../scenarios';
import CombatPrototype from '../../screens/CombatPrototype';
import { applyCombatAction, createCombat, exportCombat, invalidAction, replayCombat, type CombatState } from '../../game/combatEngine';

let seed = 0;
beforeEach(() => {
  vi.useFakeTimers(); localStorage.clear();
  vi.spyOn(crypto, 'getRandomValues').mockImplementation(array => {
    new Uint32Array(array!.buffer, array!.byteOffset, 1)[0] = seed;
    return array;
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });
function mount() {
  return render(<StrictMode><MemoryRouter initialEntries={['/duelo-v1']}><Routes>
    <Route path="/duelo-v1" element={<CombatPrototype/>}/>
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
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Volver al menú' }));
    expect(screen.getByRole('heading', { name: 'Menú principal' })).toBeTruthy();
  });
});
