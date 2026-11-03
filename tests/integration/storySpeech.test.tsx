import React from 'react';
import { test, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import StorySpeechPanel from '../../screens/StorySpeechPanel.tsx';

test('muestra el interlocutor, su frase y permite avanzar sin tocar el tablero', () => {
  const onContinue = vi.fn();
  render(<StorySpeechPanel
    speech={{ speaker: 'opponent', text: 'Nadie cruza mi puerto sin obedecer.' }}
    rivalName="Baltasar de Fierro" rivalRole="General"
    playerPortrait="/player.webp"
    rivalPortrait="/enemy.webp"
    step={1} total={4} onContinue={onContinue}/>);
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Baltasar de Fierro' })).toBeTruthy();
  expect(screen.getByText('Nadie cruza mi puerto sin obedecer.')).toBeTruthy();
  expect(screen.getByText('General')).toBeTruthy();
  expect(screen.queryByText(/protagonista|adversario/i)).toBeNull();
  expect(screen.getByRole('button', { name: /Siguiente/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Siguiente/ }));
  expect(onContinue).toHaveBeenCalledOnce();
});

test('la última escena anuncia exactamente Inicia el combate', () => {
  render(<StorySpeechPanel
    speech={{ speaker: 'system', text: 'Inicia el combate' }}
    rivalName="Sigumán" rivalRole="Comandante"
    playerPortrait="/player.webp" rivalPortrait="/enemy.webp"
    step={4} total={4} onContinue={() => {}}/>);
  expect(screen.getByText('Inicia el combate')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Continuar/ })).toBeTruthy();
});


test('Xervias se identifica como Soldado y nunca como Protagonista', () => {
  render(<StorySpeechPanel
    speech={{ speaker: 'player', text: 'Seguiré la pista sin poner a nadie en peligro.' }}
    rivalName="Domingo Quispe" rivalRole="Guardia"
    playerPortrait="/player.webp" rivalPortrait="/enemy.webp"
    step={2} total={4} onContinue={() => {}}/>);
  expect(screen.getByText('Soldado')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Xervias' })).toBeTruthy();
  expect(screen.queryByText(/protagonista|adversario/i)).toBeNull();
});
