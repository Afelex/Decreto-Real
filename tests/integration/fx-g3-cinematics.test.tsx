import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { CardDrawFX } from '../../screens/CardDrawFX';
import { ComboEffectOverlay } from '../../screens/ComboEffectOverlay';
import { ResultCinematicFX } from '../../screens/ResultCinematicFX';
import { DuelEntrance } from '../../screens/DuelEntrance';

const engine = vi.hoisted(() => ({
  play: vi.fn((_id: string, _options: Record<string, unknown>) => ({ stop: vi.fn() })),
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

test('combo x3 muestra ruptura B02 sobre el retablo rival que recibe daño', async () => {
  vi.useFakeTimers();
  const { container } = render(<div className="dr-royal-screen">
    <div className="dr-royal-rival-area"><div className="dr-royal-character-frame"/></div>
    <div className="dr-royal-player-area"><div className="dr-royal-character-frame"/></div>
    <ComboEffectOverlay level={3} ability="DAMAGE" isPlayer paused={false}/>
  </div>);
  await act(async () => { await Promise.resolve(); });
  expect(container.querySelector('[data-fx-id="B06"]')).toBeTruthy();
  expect(engine.play.mock.calls[0][0]).toBe('B06');
  await act(async () => { vi.advanceTimersByTime(391); });
  expect(engine.play.mock.calls.map(call => call[0])).toEqual(['B06', 'B02']);
  expect(engine.play.mock.calls[1][1].at).toBe(container.querySelector('.dr-royal-rival-area .dr-royal-character-frame'));
  expect(engine.play.mock.calls[1][1].target).toBe(container.querySelector('.dr-royal-rival-area .dr-royal-character-frame'));
  expect((engine.play.mock.calls[1][1].params as { amount: number }).amount).toBe(3);
  expect(container.querySelector('video')).toBeNull();
});

test('cuando ataca la IA, la ruptura B01 queda sobre el retablo del jugador', async () => {
  vi.useFakeTimers();
  const { container } = render(<div className="dr-royal-screen">
    <div className="dr-royal-rival-area"><div className="dr-royal-character-frame"/></div>
    <div className="dr-royal-player-area"><div className="dr-royal-character-frame"/></div>
    <ComboEffectOverlay level={2} ability="DAMAGE" isPlayer={false} paused={false}/>
  </div>);
  await act(async () => { await Promise.resolve(); });
  await act(async () => { vi.advanceTimersByTime(391); });
  expect(engine.play.mock.calls.map(call => call[0])).toEqual(['B05', 'B01']);
  expect(engine.play.mock.calls[1][1].at).toBe(container.querySelector('.dr-royal-player-area .dr-royal-character-frame'));
  expect((engine.play.mock.calls[1][1].params as { amount: number }).amount).toBe(1);
});

test('combo curativo rival aplica A04 al RETRATO del beneficiado', async () => {
  vi.useFakeTimers();
  const { container } = render(<div className="dr-royal-screen">
    <div className="dr-royal-rival-area"><div className="dr-royal-character-frame"/></div>
    <div className="dr-royal-player-area"><div className="dr-royal-character-frame"/></div>
    <ComboEffectOverlay level={2} ability="HEAL" isPlayer={false} paused={false}/>
  </div>);
  await act(async () => { await Promise.resolve(); });
  await act(async () => { vi.advanceTimersByTime(391); });
  expect(engine.play.mock.calls.map(call => call[0])).toEqual(['B05', 'A04']);
  expect((engine.play.mock.calls[1][1].params as { amount: number }).amount).toBe(1);
  expect(engine.play.mock.calls[1][1].side).toBe('rival');
  expect(engine.play.mock.calls[1][1].at).toBe(container.querySelector('.dr-royal-rival-area .dr-royal-character-frame'));
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

test('retablos VS: nombres dentro del MISMO marco de cada retrato', () => {
  const { container } = render(<DuelEntrance
    playerPortrait="/xervias.webp" rivalPortrait="/rival.webp" onFinish={() => {}}/>);
  const frames = Array.from(container.querySelectorAll('.dr-duel-entrance__portrait-wrap'));
  expect(frames).toHaveLength(2);
  for (const frame of frames) {
    expect(frame.querySelector('.dr-duel-entrance__portrait')).toBeTruthy();
    expect(frame.querySelector('.dr-duel-entrance__portrait-ornament')).toBeTruthy();
    expect(frame.querySelector('figcaption')).toBeTruthy();
  }
  expect(container.querySelectorAll('.dr-duel-entrance__fighter > figcaption')).toHaveLength(0);
});
