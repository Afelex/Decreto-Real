import React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { getHpMeterState, RoyalHpMeter } from '../../screens/RoyalHpMeter';

afterEach(cleanup);

test('los umbrales de color respetan 51–100 verde, 21–50 ámbar, 1–20 rojo', () => {
  const cases = [
    [20, 'healthy', 100],
    [11, 'healthy', 55],
    [10, 'warning', 50],
    [5, 'warning', 25],
    [4, 'critical', 20],
    [1, 'critical', 5],
    [0, 'critical', 0],
  ] as const;
  for (const [hp, tone, percent] of cases) {
    expect(getHpMeterState(hp, 20)).toEqual({ current: hp, percent, tone });
  }
});

test('el cálculo visual limita HP entre 0 y máximo, sin alterar las reglas', () => {
  expect(getHpMeterState(27, 20)).toEqual({ current: 20, percent: 100, tone: 'healthy' });
  expect(getHpMeterState(-3, 20)).toEqual({ current: 0, percent: 0, tone: 'critical' });
});

test.each([
  ['player', 'Tu vida'],
  ['opponent', 'Vida del rival'],
] as const)('la barra de %s conserva texto centrado y accesibilidad', (side, prefix) => {
  render(<RoyalHpMeter hp={20} maxHp={20} side={side}/>);
  const meter = screen.getByRole('progressbar', { name: `${prefix}: 20 de 20` });
  expect(meter.getAttribute('aria-valuenow')).toBe('20');
  expect(meter.getAttribute('aria-valuemin')).toBe('0');
  expect(meter.getAttribute('aria-valuemax')).toBe('20');
  expect(meter.getAttribute('data-hp-state')).toBe('healthy');
  expect((meter.querySelector('.dr-royal-hp__fill') as HTMLElement).style.width).toBe('100%');
  expect(meter.querySelector('.dr-royal-hp__label')?.textContent).toBe('HP: 20/20');
});

test.each(['player', 'opponent'] as const)(
  'el relleno de %s disminuye con daño, cambia de color y crece con curación',
  side => {
    const { rerender, container } = render(<RoyalHpMeter hp={20} maxHp={20} side={side}/>);
    const meter = container.querySelector('.dr-royal-hp') as HTMLElement;
    const fill = meter.querySelector('.dr-royal-hp__fill') as HTMLElement;

    rerender(<RoyalHpMeter hp={9} maxHp={20} side={side}/>);
    expect(fill.style.width).toBe('45%');
    expect(meter.getAttribute('data-hp-state')).toBe('warning');
    expect(meter.classList.contains('dr-royal-hp--critical')).toBe(false);
    expect(meter.querySelector('.dr-royal-hp__label')?.textContent).toBe('HP: 9/20');

    rerender(<RoyalHpMeter hp={4} maxHp={20} side={side}/>);
    expect(fill.style.width).toBe('20%');
    expect(meter.classList.contains('dr-royal-hp--critical')).toBe(true);
    expect(meter.classList.contains('dr-royal-hp--empty')).toBe(false);

    rerender(<RoyalHpMeter hp={0} maxHp={20} side={side}/>);
    expect(fill.style.width).toBe('0%');
    expect(meter.classList.contains('dr-royal-hp--empty')).toBe(true);

    rerender(<RoyalHpMeter hp={12} maxHp={20} side={side}/>);
    expect(fill.style.width).toBe('60%');
    expect(meter.getAttribute('data-hp-state')).toBe('healthy');
    expect(meter.classList.contains('dr-royal-hp--empty')).toBe(false);
  },
);
