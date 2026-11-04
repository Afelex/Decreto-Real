import React from 'react';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CAMPAIGN_MISSIONS } from '../../campaign/campaign.ts';
import { GENERAL_MYSTICS, mysticDisplayName } from '../../game/mysticCards.ts';
import BossConfrontation, { CONFRONTATION_MISSIONS } from '../../screens/BossConfrontation';

beforeEach(() => cleanup());
afterEach(() => cleanup());

const mount = (missionId: string, options: { defeated?: boolean; awakened?: boolean } = {}) => {
  const mission = CAMPAIGN_MISSIONS.find(item => item.id === missionId)!;
  const onBeginBattle = vi.fn();
  const onBack = vi.fn();
  render(<BossConfrontation
    mission={mission} alreadyDefeated={!!options.defeated}
    legacyAwakened={!!options.awakened}
    onBeginBattle={onBeginBattle} onBack={onBack} />);
  return { onBeginBattle, onBack };
};

test('each of the eight bosses presents their exact mystical card and a two-part exchange', () => {
  expect(CONFRONTATION_MISSIONS).toHaveLength(9);
  for (const mystic of GENERAL_MYSTICS) {
    const { onBeginBattle } = mount(mystic.missionId);
    expect(screen.getByRole('heading', { name: 'Enfrentamiento con el general' })).toBeTruthy();
    expect(screen.getByText(mysticDisplayName(mystic.id))).toBeTruthy();
    expect(screen.getByText(/Carta sellada|carta sellada|carta sellada\./i)).toBeTruthy();
    expect(document.querySelector('.dcb-scenery')?.getAttribute('src')).toContain('region-');
    expect(screen.getByRole('button', { name: 'Responder ›' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Responder ›' }));
    expect(screen.getByText('Xervias', { exact: true })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Comenzar duelo/ }));
    expect(onBeginBattle).toHaveBeenCalledTimes(1);
    cleanup();
  }
});

test('skipping the confrontation reaches the unchanged battle and returning keeps the mission briefing', () => {
  const callbacks = mount('22');
  fireEvent.click(screen.getByRole('button', { name: 'Omitir presentación' }));
  expect(callbacks.onBeginBattle).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: '‹ Volver a misión' }));
  expect(callbacks.onBack).toHaveBeenCalledTimes(1);
});

test('the card is already collected on a replay and the legacy changes its availability', () => {
  mount('06', { defeated: true, awakened: true });
  expect(screen.getByText('Carta conseguida en una victoria anterior.')).toBeTruthy();
  cleanup();
  mount('06', { awakened: true });
  expect(screen.getByText('Obtendrás esta carta si lo derrotas.')).toBeTruthy();
});

test('the Sigumán finale unveils his three named cards without claiming they are collectible', () => {
  const callbacks = mount('38', { awakened: true });
  expect(screen.getByRole('heading', { name: 'El Señor de la Falsa Luz' })).toBeTruthy();
  expect(screen.getByText(/Renacimiento Solar/)).toBeTruthy();
  expect(screen.getByText(/Juicio del Eclipse/)).toBeTruthy();
  expect(screen.getByText(/Decreto del Sol Negro/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Omitir presentación' }));
  expect(callbacks.onBeginBattle).toHaveBeenCalledTimes(1);
});
