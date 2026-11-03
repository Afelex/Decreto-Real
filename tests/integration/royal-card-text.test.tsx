import { expect, test } from 'vitest';
import { getRoyalCardText } from '../../game/royalCardText';

test('cartas ordinarias muestran solo nombre y efecto corto', () => {
  expect(getRoyalCardText({ type: 'ATTACK' })).toEqual({ title: 'Ataque', effect: '-2 Vida rival' });
  expect(getRoyalCardText({ type: 'DEFENSE' })).toEqual({ title: 'Defensa', effect: '+1 Vida' });
  expect(getRoyalCardText({ type: 'ORDER' })).toEqual({ title: 'Orden', effect: 'Roba 1 carta' });
});

test('los cuatro impactos conservan rango, eliminan Sello y usan dos líneas', () => {
  const expected = [
    ['Impacto I', 'Drena 1'],
    ['Impacto II', 'Drena 1'],
    ['Impacto III', 'Drena 1'],
    ['Impacto FINAL', 'Victoria'],
  ];
  for (let rank = 1; rank <= 4; rank += 1) {
    const value = getRoyalCardText({ type: 'IMPACT', rank });
    expect([value.title, value.effect]).toEqual(expected[rank - 1]);
    expect(value.effect.toLowerCase()).not.toContain('sello');
  }
});
