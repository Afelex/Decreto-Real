import React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GeneralPortrait, GENERAL_PORTRAIT_IDS } from '../../screens/GeneralPortrait';
import { DuelBoard } from '../../screens/DuelBoard';
import { applyCombatAction, createCombat, invalidAction } from '../../game/combatEngine';
import { battleCue } from '../../game/combatPresentation';

afterEach(cleanup);

test('each of the eight generals has a separate decorative vector portrait', () => {
  for (const chapterId of GENERAL_PORTRAIT_IDS) {
    const { unmount, container } = render(<GeneralPortrait chapterId={chapterId}/>);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('data-general-portrait')).toBe(chapterId);
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.querySelector('path')).toBeTruthy();
    unmount();
  }
});

test('unrecognized chapter never displays an unrelated boss portrait', () => {
  const { container } = render(<GeneralPortrait chapterId="p"/>);
  expect(container.querySelector('svg')).toBeNull();
});

test('story duel displays the general but never changes the free duel portrait', () => {
  const initial = createCombat(42);
  const { container, rerender } = render(<MemoryRouter>
    <DuelBoard initial={initial} immersive generalChapterId="1" opponentName="Almirante de Hierro"/>
  </MemoryRouter>);
  expect(container.querySelector('.dr-rival svg[data-general-portrait="1"]')).toBeTruthy();
  rerender(<MemoryRouter><DuelBoard initial={initial} immersive={false} opponentName="Virrey estratega"/></MemoryRouter>);
  expect(container.querySelector('.dr-rival svg[data-general-portrait]')).toBeNull();
});

test('playing a legal card shows only the engine-derived effect; ending turn does not invent another', () => {
  const initial = createCombat(42);
  const card = initial.hand.find(item => !invalidAction(initial, { type: 'play', cardId: item.id }))!;
  const expected = applyCombatAction(initial, { type: 'play', cardId: card.id });
  const cue = battleCue(expected.state)!;
  const { container } = render(<MemoryRouter>
    <DuelBoard initial={initial} immersive opponentName="Almirante de Hierro" generalChapterId="1"/>
  </MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: new RegExp('^' + card.name + ', coste') }));
  fireEvent.click(screen.getByRole('button', { name: 'Jugar carta' }));
  const badge = container.querySelector('.dr-battle-cue');
  expect(badge?.classList.contains(cue.kind)).toBe(true);
  expect(badge?.textContent).toBe(cue.label);
  expect(badge?.getAttribute('aria-hidden')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: /TERMINAR TURNO/ }));
  expect(container.querySelector('.dr-battle-cue')).toBeNull();
});
