import type { CardData } from '../types';

/** Text is generated from the actual played card, not baked into the video. */
export function cardActivationCopy(card: Pick<CardData, 'type' | 'name' | 'description' | 'rank'>, isPlayer: boolean) {
  const title = `¡${card.name.toLocaleUpperCase('es')}!`;
  const kicker = isPlayer ? 'HAS ACTIVADO' : 'EL RIVAL ACTIVÓ';
  const value = Number(card.description.match(/\d+/)?.[0] ?? 1);
  const points = value === 1 ? 'punto' : 'puntos';
  let effect = card.description;
  switch (card.type) {
    case 'ATTACK':
      effect = isPlayer ? `Infliges ${value} ${points} de daño` : `Recibes ${value} ${points} de daño`;
      break;
    case 'DEFENSE':
      effect = isPlayer ? `Recuperas ${value} ${points} de vida` : `El rival recupera ${value} ${points} de vida`;
      break;
    case 'ORDER':
      effect = isPlayer ? 'Robas 1 carta extra' : 'El rival roba 1 carta extra';
      break;
    case 'MYSTIC':
      effect = isPlayer ? 'Poder provisional: infliges 2 de daño' : 'Poder provisional: recibes 2 de daño';
      break;
    case 'IMPACT':
      effect = card.rank === 4 ? '¡Cuarto Impacto: victoria!' : 'Sella un Impacto, drena 1 de vida y recupera 1';
      break;
  }
  return { title, kicker, effect };
}
