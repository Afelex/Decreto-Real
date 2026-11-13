import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (file: string) => readFileSync(file, 'utf8');

test('combo art masks the outside black matte without hiding the grey interior', () => {
  const css = read('screens/combat-events.css');
  const mask = read('public/interfaz/recorte-marco-combo.svg');
  expect(css).toContain("mask-image:url('/Decreto-Real/interfaz/recorte-marco-combo.svg')");
  expect(css).toContain("-webkit-mask-image:url('/Decreto-Real/interfaz/recorte-marco-combo.svg')");
  expect(mask).toContain('<path fill="white"');
  expect(mask).not.toContain('<rect');
  expect(css).toContain('mask-size:100% 100%');
});

test('blue enemy caption corrects the slope shown in mobile screenshots', () => {
  const css=read('screens/card-activation-banner.css');
  expect(css).toMatch(/\.dr-cinematic-overlay\.rival \.dr-cinematic-copy[\s\S]*?transform:translate\(-50%,-50%\) rotate\(-12deg\);/);
  expect(css).toContain('animation:dr-decree-readable var(--dr-cue-duration,1000ms)');
});

test('the last-decree stack is slightly lower but stays by Fin de turno', () => {
  const css=read('screens/last-decree-indicator.css');
  expect(css).toContain('bottom:calc(100% - 14px)');
  expect(css).toContain('bottom:calc(100% - 12px)');
});
