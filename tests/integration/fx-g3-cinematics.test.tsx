import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { CardDrawFX } from '../../screens/CardDrawFX';
import { ComboEffectOverlay } from '../../screens/ComboEffectOverlay';
import { ResultCinematicFX } from '../../screens/ResultCinematicFX';

const engine = vi.hoisted(() => ({
  play: vi.fn(() => ({ stop: vi.fn() })),
  clear: vi.fn(),
}));
vi.mock('../../screens/DecretoFXOverlay', () => ({
  preloadDecretoFX: () => Promise.resolve({
    playFX: engine.play,
    clear: engine.clear,
  }),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  engine.play.mockClear();
  engine.clear.mockClear();
});

test('A10 roba desde el mazo real de cada facción hacia su propia mano', async () => {
  vi.useFakeTimers();
  const onFinish = vi.fn();
  const { container } = render(
    <div className="dr-royal-screen">
      <div className="dr-royal-player-deck"><div className="dr-royal-deck-back"/></div>
      <div className="dr-royal-rival-deck"><div className="dr-royal-deck-back"/></div>
      <div className="dr-royal-player-fan"/>
      <div className="dr-royal-rival-fan"/>
      <CardDrawFX side="PLAYER" count={1} cueId={31} paused={false} onFinish={onFinish}/>
      <CardDrawFX side="OPPONENT" count={1} cueId={32} paused={false} onFinish={onFinish}/>
    </div>
  );
  await act(async () => { await Promise.resolve(); });
  const calls = engine.play.mock.calls.filter(([id]) => id === 'A10');
  expect(calls).toHaveLength(2);
  expect(calls[0][1].from).toBe(container.querySelector('.dr-royal-player-deck .dr-royal-deck-back'));
  expect(calls[0][1].to).toBe(container.querySelector('.dr-royal-player-fan'));
  expect(calls[1][1].from).toBe(container.querySelector('.dr-royal-rival-deck .dr-royal-deck-back'));
  expect(calls[1][1].to).toBe(container.querySelector('.dr-royal-rival-fan'));
  await act(async () => { vi.advanceTimersByTime(951); });
  expect(onFinish.mock.calls.map(args => args[0])).toEqual([31, 32]);
});

test('combo x3 exhibe B06 y luego ataque A01 sin añadir esperas al motor', async () => {
  vi.useFakeTimers();
  const { container } = render(<ComboEffectOverlay level={3} ability="DAMAGE" isPlayer paused={false}/>);
  await act(async () => { await Promise.resolve(); });
  expect(container.querySelector('[data-fx-id="B06"]')).toBeTruthy();
  expect(engine.play.mock.calls[0][0]).toBe('B06');
  await act(async () => { vi.advanceTimersByTime(391); });
  expect(engine.play.mock.calls.map(call => call[0])).toEqual(['B06', 'A01']);
  expect(container.querySelector('video')).toBeNull();
});

test('combo curativo rival tiene pulso A04 con +1 y no ataque', async () => {
  vi.useFakeTimers();
  render(<ComboEffectOverlay level={2} ability="HEAL" isPlayer={false} paused={false}/>);
  await act(async () => { await Promise.resolve(); });
  await act(async () => { vi.advanceTimersByTime(391); });
  expect(engine.play.mock.calls.map(call => call[0])).toEqual(['B05', 'A04']);
  expect(engine.play.mock.calls[1][1].params.amount).toBe(1);
  expect(engine.play.mock.calls[1][1].side).toBe('rival');
});

test('C06 y C07 muestran cinematica segun el resultado y sin audio sintetico', async () => {
  const { rerender, container } = render(<ResultCinematicFX won={true}/>);
  await act(async () => { await Promise.resolve(); });
  expect(container.querySelector('[data-fx-id="C06"]')).toBeTruthy();
  expect(engine.play.mock.calls[0][0]).toBe('C06');
  expect(engine.play.mock.calls[0][1].silent).toBe(true);
  rerender(<ResultCinematicFX won={false}/>);
  await act(async () => { await Promise.resolve(); });
  expect(container.querySelector('[data-fx-id="C07"]')).toBeTruthy();
  expect(engine.play.mock.calls[1][0]).toBe('C07');
});
