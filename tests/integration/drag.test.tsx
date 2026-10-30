import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DuelBoard } from '../../screens/DuelBoard';
import { createCombat, invalidAction, type CombatState } from '../../game/combatEngine';

let initial: CombatState;
const arenaBox = {
  left: 0, right: 390, top: 0, bottom: 210, width: 390, height: 210, x: 0, y: 0,
  toJSON: () => ({}),
} as DOMRect;

beforeEach(() => {
  initial = createCombat(42);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return this.classList.contains('dr-arena') ? arenaBox : ({
      left: 0, right: 100, top: 300, bottom: 475, width: 100, height: 175, x: 0, y: 300, toJSON: () => ({}),
    } as DOMRect);
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function mount() {
  render(<MemoryRouter><DuelBoard initial={initial} immersive opponentName="Almirante de Hierro" /></MemoryRouter>);
  const legal = initial.hand.find(card => invalidAction(initial, { type: 'play', cardId: card.id }) === null)!;
  const index = initial.hand.findIndex(card => card.id === legal.id);
  const button = document.querySelectorAll<HTMLButtonElement>('.dr-hand .dr-card')[index];
  return { legal, button };
}

test('the campaign renders a physical hand and the canonical opponent name', () => {
  mount();
  expect(document.querySelector('.dr-game.immersive')).toBeTruthy();
  expect(screen.getByText('Almirante de Hierro')).toBeTruthy();
  expect(document.querySelector('.dr-drop-label')?.textContent).toContain('Arrastra');
});

test('dragging upward into the table plays exactly one legal card', () => {
  const { legal, button } = mount();
  fireEvent.pointerDown(button, { pointerId: 3, pointerType: 'mouse', button: 0, clientX: 120, clientY: 350 });
  fireEvent.pointerMove(button, { pointerId: 3, pointerType: 'mouse', clientX: 120, clientY: 130 });
  expect(document.querySelector('.dr-drag-ghost')).toBeTruthy();
  expect(document.querySelector('.dr-arena.drop-ready')).toBeTruthy();
  fireEvent.pointerUp(button, { pointerId: 3, pointerType: 'mouse', clientX: 120, clientY: 100 });
  expect(document.querySelector('.dr-drag-ghost')).toBeNull();
  expect(document.querySelectorAll('.dr-hand .dr-card').length).toBe(initial.hand.length - 1);
  expect(document.querySelector('.dr-log')?.textContent).toContain(legal.name);
  fireEvent.pointerUp(button, { pointerId: 3, pointerType: 'mouse', clientX: 120, clientY: 100 });
  expect(document.querySelectorAll('.dr-hand .dr-card').length).toBe(initial.hand.length - 1);
});

test('dropping outside the table returns the card without playing it', () => {
  const { button } = mount();
  fireEvent.pointerDown(button, { pointerId: 4, pointerType: 'mouse', button: 0, clientX: 120, clientY: 350 });
  fireEvent.pointerMove(button, { pointerId: 4, pointerType: 'mouse', clientX: 120, clientY: 230 });
  fireEvent.pointerUp(button, { pointerId: 4, pointerType: 'mouse', clientX: 120, clientY: 230 });
  expect(document.querySelectorAll('.dr-hand .dr-card').length).toBe(initial.hand.length);
  expect(document.querySelector('.dr-drag-ghost')).toBeNull();
  expect(document.querySelector('.dr-notice')?.textContent).toContain('volvió a tu mano');
});

test('pointer cancellation does not consume a card', () => {
  const { button } = mount();
  fireEvent.pointerDown(button, { pointerId: 5, pointerType: 'touch', button: 0, clientX: 110, clientY: 380 });
  fireEvent.pointerMove(button, { pointerId: 5, pointerType: 'touch', clientX: 110, clientY: 125 });
  fireEvent.pointerCancel(button, { pointerId: 5, pointerType: 'touch', clientX: 110, clientY: 125 });
  expect(document.querySelectorAll('.dr-hand .dr-card').length).toBe(initial.hand.length);
  expect(document.querySelector('.dr-drag-ghost')).toBeNull();
});

test('the original select-and-confirm interaction remains functional', () => {
  const { button } = mount();
  fireEvent.click(button);
  const confirm = screen.getByRole('button', { name: 'Jugar carta' });
  expect(confirm).toBeTruthy();
  fireEvent.click(confirm);
  expect(document.querySelectorAll('.dr-hand .dr-card').length).toBe(initial.hand.length - 1);
});
