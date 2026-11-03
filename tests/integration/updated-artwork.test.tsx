import { existsSync, statSync, readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

test('local artwork for all four Impact ranks, Order and both turn ribbons exists', () => {
  const files = [
    'public/cartas/decreto-impacto.webp',
    'public/cartas/decreto-orden.webp',
    'public/interfaz/banner-tu-turno.webp',
    'public/interfaz/banner-turno-rival.webp',
  ];
  for (const path of files) {
    expect(existsSync(path), path).toBe(true);
    expect(statSync(path).size, path).toBeGreaterThan(2048);
  }
  const board = readFileSync('screens/GameBoard.tsx', 'utf8');
  expect(board).toContain('cartas/decreto-impacto.webp');
  expect(board).toContain('cartas/decreto-orden.webp');
  const status = readFileSync('screens/royal-battle-status.css', 'utf8');
  const cinematic = readFileSync('screens/combat-events.css', 'utf8');
  for (const name of ['banner-tu-turno.webp','banner-turno-rival.webp']) {
    expect(status).toContain(name);
    expect(cinematic).toContain(name);
  }
});
