import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DuelBoard } from '../../screens/DuelBoard';
import { createCombat, type CombatState } from '../../game/combatEngine.ts';

afterEach(() => { cleanup(); vi.useRealTimers(); });

test('campaign table restores the original visual zones without pretending the rival owns a hand', () => {
  const initial = createCombat(42);
  initial.seals = 1;
  initial.enemySeals = 2;
  const { container } = render(<MemoryRouter>
    <DuelBoard initial={initial} immersive generalChapterId="1" opponentName="Almirante de Hierro"/>
  </MemoryRouter>);
  expect(container.querySelector('.dr-original-table')).toBeTruthy();
  expect(container.querySelectorAll('.dr-classic-table .dr-table-impact-rail')).toHaveLength(2);
  expect(container.querySelectorAll('.dr-table-impact-rail.rival i.charged')).toHaveLength(2);
  expect(container.querySelectorAll('.dr-table-impact-rail.player i.charged')).toHaveLength(1);
  expect(container.querySelectorAll('.dr-table-open-field .dr-table-empty-slot')).toHaveLength(2);
  expect(container.querySelector('.dr-arena .dr-drop-label')).toBeTruthy();
  expect(container.querySelector('.dr-hand')).toBeTruthy();
  expect(screen.getByRole('button', { name: /TERMINAR TURNO/ })).toBeTruthy();
  expect(screen.getByText('Baluarte naval')).toBeTruthy();
  expect(container.querySelector('.dr-rival svg[data-general-portrait="1"]')).toBeTruthy();
});

test('only campaign bosses use the tactical/ornamental table; tutorial and free duel are untouched', () => {
  const { container } = render(<MemoryRouter><DuelBoard initial={createCombat(1)} /></MemoryRouter>);
  expect(container.querySelector('.dr-classic-table')).toBeNull();
  expect(container.querySelector('.dr-boss-tactic')).toBeNull();
  expect(container.querySelector('.dr-original-table')).toBeNull();
});

test('the boss timer submits one journaled, replayable boss response on a real turn', () => {
  vi.useFakeTimers();
  const states: CombatState[] = [];
  const { container } = render(<MemoryRouter>
    <DuelBoard initial={createCombat(12)} immersive generalChapterId="7"
      opponentName="Cóndor de los Andes" onStateChange={s => states.push(s)}/>
  </MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /TERMINAR TURNO/ }));
  expect(states.at(-1)?.phase).toBe('rival');
  act(() => { vi.advanceTimersByTime(701); });
  const state = states.at(-1);
  expect(state?.phase).toMatch(/player|finished/);
  const response = state?.journal.filter(entry => entry.action.type === 'resolve_rival') ?? [];
  expect(response).toHaveLength(1);
  expect(response[0].action).toEqual({ type: 'resolve_rival', bossId: '7' });
  expect(container.querySelector('.dr-original-table')).toBeTruthy();
});
