import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ComboChoicePanel, CoinTossPanel, TurnAnnouncement, TurnIndicator } from '../../screens/CombatEventUI';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('turn cues announce the active side without a full-screen dark modal', () => {
  const { rerender } = render(<>
    <TurnIndicator side="PLAYER" />
    <TurnAnnouncement variant="player" turn={2} />
  </>);
  expect(screen.getByRole('status', { name: 'Turno actual: tu turno' })).toBeTruthy();
  expect(screen.getByRole('status', { name: /Tu Turno. Juega una carta/ })).toBeTruthy();
  expect(document.querySelector('.dr-event-turn__ribbon')).toBeTruthy();
  expect(document.querySelector('.dr-event-indicator__label')?.textContent).toBe('Tu Turno');
  expect(document.querySelector('.dr-event-indicator__laurel')).toBeNull();
  expect(document.querySelector('.dr-event-stage__veil')).toBeNull();
  rerender(<><TurnIndicator side="OPPONENT" /><TurnAnnouncement variant="opponent" turn={3} /></>);
  expect(screen.getByRole('status', { name: 'Turno actual: turno del oponente' })).toBeTruthy();
  expect(screen.getByRole('status', { name: /Turno del Rival/ })).toBeTruthy();
});

test('compact combo choices preserve the damage/heal decisions', () => {
  const onDamage = vi.fn(), onHeal = vi.fn();
  const { rerender } = render(<ComboChoicePanel level={2} onDamage={onDamage} onHeal={onHeal} />);
  const dialog = screen.getByRole('dialog', { name: 'Combo ×2' });
  const art = dialog.querySelector('.dr-event-choice__art') as HTMLImageElement;
  expect(art.getAttribute('src')).toContain('interfaz/combo-estandartes-nuevo.webp');
  expect(art.getAttribute('aria-hidden')).toBe('true');
  expect(dialog.querySelectorAll('.dr-event-ability')).toHaveLength(2);
  expect(within(dialog).getByText('1 Daño al Rival')).toBeTruthy();
  fireEvent.click(within(dialog).getByRole('button', { name: /Furia Real/ }));
  expect(onDamage).toHaveBeenCalledOnce();
  rerender(<ComboChoicePanel level={3} onDamage={onDamage} onHeal={onHeal} />);
  expect(screen.getByText('3 Daño al Rival')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Gracia Divina/ }));
  expect(onHeal).toHaveBeenCalledOnce();
});

test('coin ritual starts with a single touch and announces its result', () => {
  const onToss = vi.fn();
  const { rerender } = render(<CoinTossPanel coinSide={null} isFlipping={false} onToss={onToss} />);
  const coin = screen.getByRole('button', { name: 'Lanzar Moneda' });
  fireEvent.click(coin);
  expect(onToss).toHaveBeenCalledOnce();
  rerender(<CoinTossPanel coinSide={null} isFlipping onToss={onToss} />);
  expect((screen.getByRole('button', { name: 'Lanzar Moneda' }) as HTMLButtonElement).disabled).toBe(true);
  rerender(<CoinTossPanel coinSide="CARA" isFlipping={false} onToss={onToss} />);
  expect(screen.getByText('Empiezas tú')).toBeTruthy();
});
