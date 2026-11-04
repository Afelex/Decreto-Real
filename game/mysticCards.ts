import type { CardData } from '../types.ts';

/** Identificadores estables: los nombres y efectos definitivos se aprobarán después. */
export const GENERAL_MYSTICS = [
  { id: 'general-1', missionId: '06', owner: 'Almirante de Hierro' },
  { id: 'general-2', missionId: '10', owner: 'Jinete Escarlata' },
  { id: 'general-3', missionId: '14', owner: 'Señor de la Plata' },
  { id: 'general-4', missionId: '18', owner: 'Artillero del Trueno' },
  { id: 'general-5', missionId: '22', owner: 'Nayisa de Sombras' },
  { id: 'general-6', missionId: '26', owner: 'Dama del Estandarte' },
  { id: 'general-7', missionId: '30', owner: 'Cóndor de los Andes' },
  { id: 'general-8', missionId: '34', owner: 'Caballero del Juramento' },
] as const;

export const ZHINCHI_MYSTIC = {
  id: 'legado-zhinchi', missionId: '36', owner: 'Zhinchi',
} as const;

/** Exclusivas del jefe final. Sigumán lleva tres habilidades distintas, aún sin efecto definitivo. */
export const SIGUMAN_MYSTICS = [
  { id: 'siguman-1', owner: 'Sigumán', missionId: '38' },
  { id: 'siguman-2', owner: 'Sigumán', missionId: '38' },
  { id: 'siguman-3', owner: 'Sigumán', missionId: '38' },
] as const;

export const MYSTIC_CATALOG = [...GENERAL_MYSTICS, ZHINCHI_MYSTIC, ...SIGUMAN_MYSTICS] as const;
export type MysticId = typeof MYSTIC_CATALOG[number]['id'];
export type ReplaceableKind = 'ATTACK' | 'DEFENSE' | 'ORDER';
export type MysticSlot = Readonly<{ mysticId: MysticId; replace: ReplaceableKind }>;
export const MAX_MYSTIC_SLOTS = 3;

/** Temporal hasta diseñar cada habilidad individual con el usuario: nunca usar como balance final. */
export const PROVISIONAL_MYSTIC_DAMAGE = 2;

export function mysticDefinition(id: string) {
  return MYSTIC_CATALOG.find(card => card.id === id);
}

export function mysticDisplayName(id: MysticId): string {
  const card = mysticDefinition(id)!;
  if (id.startsWith('siguman-')) return `Mística de Sigumán ${id.slice(-1)}`;
  return `Mística de ${card.owner}`;
}

export function mysticCard(id: MysticId, instanceId: string): CardData {
  return {
    id: instanceId,
    type: 'MYSTIC',
    mysticId: id,
    name: mysticDisplayName(id),
    description: 'Efecto provisional: inflige 2 de daño',
    cost: 0,
    img: '/Decreto-Real/cartas/decreto-orden.webp?v=20261103',
  };
}

/** Sustitución uno a uno: Impacto nunca se reemplaza. El resultado siempre tiene 28 cartas. */
export function insertMystics(deck: readonly CardData[], slots: readonly MysticSlot[], prefix: string): CardData[] {
  if (slots.length > MAX_MYSTIC_SLOTS) throw new Error('Solo pueden equiparse tres cartas místicas');
  const next = [...deck];
  slots.forEach((slot, index) => {
    if (!mysticDefinition(slot.mysticId)) throw new Error('Carta mística desconocida');
    if (!['ATTACK', 'DEFENSE', 'ORDER'].includes(slot.replace)) throw new Error('Solo puede reemplazarse ataque, defensa u orden');
    const position = next.findIndex(card => card.type === slot.replace);
    if (position === -1) throw new Error('No quedan cartas del tipo seleccionado');
    next.splice(position, 1, mysticCard(slot.mysticId, `${prefix}-mystic-${index}`));
  });
  return next;
}

/** Un general lleva tres copias de SU carta; Sigumán, una de cada una de sus tres cartas. */
export function bossMysticSlots(missionId: string): MysticSlot[] {
  if (missionId === '38') return SIGUMAN_MYSTICS.map(card => ({ mysticId: card.id, replace: 'ATTACK' as const }));
  const general = GENERAL_MYSTICS.find(card => card.missionId === missionId);
  return general ? Array.from({ length: 3 }, () => ({ mysticId: general.id, replace: 'ATTACK' as const })) : [];
}
