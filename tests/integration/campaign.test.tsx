import React from 'react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CampaignMap from '../../screens/CampaignMap';
import { CAMPAIGN_STORAGE_KEY } from '../../campaign/campaign.ts';

function openMap() {
  return render(<MemoryRouter initialEntries={['/campania']}>
    <Routes>
      <Route path="/campania" element={<CampaignMap />} />
      <Route path="/campania/mision/:missionId" element={<h1>Duelo de misión</h1>} />
    </Routes>
  </MemoryRouter>);
}
beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

test('first chapter shows eight stages and only first mission is available', () => {
  openMap();
  expect(screen.getByText('Camino a la Corona')).toBeTruthy();
  const first = screen.getByRole('button', { name: /Misión 1:/ });
  const second = screen.getByRole('button', { name: /Misión 2:/ });
  expect(first.hasAttribute('disabled')).toBe(false);
  expect(second.hasAttribute('disabled')).toBe(true);
  expect(document.querySelectorAll('.dc-node-button').length).toBe(8);
});

test('mission preview shows three explicit star goals and opens the duel route', () => {
  openMap();
  fireEvent.click(screen.getByRole('button', { name: /Misión 1:/ }));
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.getByText('Gana el duelo')).toBeTruthy();
  expect(screen.getByText(/Conserva 12 de vida o más/)).toBeTruthy();
  expect(screen.getByText(/Gana antes o durante el turno 9/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Comenzar duelo' }));
  expect(screen.getByText('Duelo de misión')).toBeTruthy();
});

test('earned stars unlock exactly the next level and display best result', () => {
  window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify({ version: 1, stars: { '01': 2 } }));
  openMap();
  expect(screen.getByRole('button', { name: /Misión 2:/ }).hasAttribute('disabled')).toBe(false);
  expect(screen.getByRole('button', { name: /Misión 3:/ }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByText('★ 2/24')).toBeTruthy();
});

test('invalid saved campaign state fails closed without unlocking levels', () => {
  window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, 'bad JSON');
  openMap();
  expect(screen.getByRole('button', { name: /Misión 2:/ }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: /Misión 1:/ }));
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
});
