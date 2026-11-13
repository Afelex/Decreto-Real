import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const css = (path: string) => readFileSync(path, 'utf8');

test('COMBO ×3 se eleva sobre la placa roja sin mover COMBO ×2', () => {
  const styles=css('screens/combat-events.css');
  expect(styles).toMatch(/\.dr-royal-screen \.dr-event-choice\.dr-event-choice--3 h2 \{\s*top:8\.3%;\s*z-index:4;/);
  expect(styles).toContain('.dr-event-choice.dr-event-choice--2 h2,');
});

test('la máscara recorta el borde negro sobre el rombo, no el panel gris interior', () => {
  const art=css('public/interfaz/recorte-marco-combo.svg');
  const styles=css('screens/combat-events.css');
  expect(art).toContain('L 489 0');
  expect(art).toContain('L 526 12');
  expect(art).toContain('<path fill="white"');
  expect(art).not.toContain('<rect');
  expect(styles).toContain('mask-image:url(\'/Decreto-Real/interfaz/recorte-marco-combo.svg\')');
});

test('el fondo dinámico del retrato es azul arriba y rojo abajo, sin cubrir la vida', () => {
  const styles=css('screens/royal-hud-art.css');
  expect(styles).toContain('--dr-portrait-mid:#2563b1');
  expect(styles).toContain('--dr-portrait-mid:#9b273a');
  expect(styles).toContain('@keyframes dr-portrait-ambient');
  expect(styles).toContain('@keyframes dr-portrait-shimmer');
  expect(styles).toContain('.dr-royal-character-frame > img:first-child { z-index:1; }');
  expect(styles).toContain('.dr-royal-portrait-ornament { z-index:3; }');
  expect(styles).toContain('.dr-royal-character-frame .dr-royal-hp { z-index:4; }');
  expect(styles).toContain('@media (prefers-reduced-motion:reduce)');
});
