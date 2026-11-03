import React from 'react';
import { test, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StorySpeechPanel from '../../screens/StorySpeechPanel.tsx';

test('muestra el interlocutor, su frase y permite avanzar sin tocar el tablero', () => {
  const onContinue = vi.fn();
  render(<StorySpeechPanel
    speech={{ speaker: 'opponent', text: 'Nadie cruza mi puerto sin obedecer.' }}
    rivalName="Baltasar de Fierro"
    playerPortrait="/player.webp"
    rivalPortrait="/enemy.webp"
    step={1} total={4} onContinue={onContinue}/>);
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Baltasar de Fierro' })).toBeTruthy();
  expect(screen.getByText('Nadie cruza mi puerto sin obedecer.')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Siguiente/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }));
  expect(onContinue).toHaveBeenCalledOnce();
});

test('la última escena anuncia exactamente Inicia el combate', () => {
  render(<StorySpeechPanel
    speech={{ speaker: 'system', text: 'Inicia el combate' }}
    rivalName="Rival"
    playerPortrait="/player.webp" rivalPortrait="/enemy.webp"
    step={4} total={4} onContinue={() => {}}/>);
  expect(screen.getByText('Inicia el combate')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Continuar/ })).toBeTruthy();
});
