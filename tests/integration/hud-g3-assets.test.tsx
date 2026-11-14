import React from 'react';
import { existsSync, readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ComboChoicePanel } from '../../screens/CombatEventUI';
import { LastDecreeIndicator } from '../../screens/LastDecreeIndicator';
import type { CardType } from '../../types';

afterEach(cleanup);

const root = 'public/interfaz/hud-g3/';
const assets = [
  'retrato_marco.webp', 'combo_panel.webp', 'fin_turno.webp', 'mazo.webp',
  'menu.webp', 'sonido_activado.webp', 'sonido_silenciado.webp',
  'decreto_ataque.png', 'decreto_defensa.png', 'decreto_orden.png',
  'decreto_impacto.png', 'decreto_mistico.png',
];
test('los 12 recursos aprobados existen y no son enlaces rotos', () => {
  for (const path of assets) {
    const full = root + path;
    expect(existsSync(full), full).toBe(true);
    const bytes = readFileSync(full);
    expect(bytes.length).toBeGreaterThan(100);
    if (path.endsWith('.webp')) {
      expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
      expect(bytes.toString('ascii', 8, 12)).toBe('WEBP');
    } else {
      expect(Array.from(bytes.subarray(0, 8))).toEqual([137,80,78,71,13,10,26,10]);
    }
  }
});

test('combo ×2 y ×3 usan solo la nueva imagen y conservan ambas acciones', () => {
  const onDamage = vi.fn(), onHeal = vi.fn();
  const { rerender } = render(<ComboChoicePanel level={2} onDamage={onDamage} onHeal={onHeal} />);
  const dialog = screen.getByRole('dialog', { name: 'Combo ×2' });
  expect(dialog.querySelector('img.dr-event-choice__art')?.getAttribute('src'))
    .toContain('interfaz/hud-g3/combo_panel.webp');
  fireEvent.click(within(dialog).getByRole('button', { name: /Furia Real/ }));
  expect(onDamage).toHaveBeenCalledOnce();
  rerender(<ComboChoicePanel level={3} onDamage={onDamage} onHeal={onHeal} />);
  expect(screen.getByRole('dialog', { name: 'Combo ×3' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Gracia Divina/ }));
  expect(onHeal).toHaveBeenCalledOnce();
});

test('cada tipo de decreto usa el icono aprobado de la galería', () => {
  const variants: Record<CardType, string> = {
    ATTACK: 'decreto_ataque.png',
    DEFENSE: 'decreto_defensa.png',
    ORDER: 'decreto_orden.png',
    IMPACT: 'decreto_impacto.png',
    MYSTIC: 'decreto_mistico.png',
  };
  for (const [kind, file] of Object.entries(variants)) {
    const { container, unmount } = render(<>
      <LastDecreeIndicator type={kind as CardType} side="player" />
      <LastDecreeIndicator type={kind as CardType} side="opponent" />
    </>);
    expect(container.querySelectorAll('img.dr-g3-decree-visual')).toHaveLength(2);
    expect([...container.querySelectorAll('img.dr-g3-decree-visual')].every(img =>
      img.getAttribute('src')?.endsWith('interfaz/hud-g3/' + file))).toBe(true);
    unmount();
  }
});

test('los fondos de batalla, reglas e interacciones no se sustituyen por el arte', () => {
  const styles = readFileSync('screens/hud-g3.css','utf8');
  expect(styles).toContain('.dr-royal-deck-back .dr-g3-deck-art');
  expect(styles).toContain('.dr-royal-finish:disabled img.dr-royal-finish-art-image');
  expect(styles).toContain('.dr-event-choice.dr-event-choice--3 h2 {top:13.6%;}');
  expect(styles).toContain('mask-image:none');
});
