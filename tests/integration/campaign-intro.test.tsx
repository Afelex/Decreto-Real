import React from 'react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CampaignIntro, { CAMPAIGN_INTRO_KEY } from '../../screens/CampaignIntro';

beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

test('the new campaign introduction uses exactly three short paragraphs', () => {
  render(<MemoryRouter initialEntries={['/campania/inicio']}>
    <Routes><Route path="/campania/inicio" element={<CampaignIntro />} /></Routes>
  </MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'El reino escucha dos verdades' })).toBeTruthy();
  expect(document.querySelectorAll('.dci-story p')).toHaveLength(3);
  expect(screen.getByRole('button', { name: '⌂ Volver al Menú' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Continuar al prólogo ›' })).toBeTruthy();
});

test('continue stores the premise acknowledgment and enters the two-mission prologue', () => {
  render(<MemoryRouter initialEntries={['/campania/inicio']}>
    <Routes>
      <Route path="/campania/inicio" element={<CampaignIntro />} />
      <Route path="/campania" element={<h1>Mapa del prólogo</h1>} />
    </Routes>
  </MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: /Continuar al prólogo/ }));
  expect(window.localStorage.getItem(CAMPAIGN_INTRO_KEY)).toBe('1');
  expect(screen.getByRole('heading', { name: 'Mapa del prólogo' })).toBeTruthy();
});
