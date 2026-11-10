import type { CardData } from '../types.ts';

/** Ids estables: actualizar nombre/arte/efecto no borra recompensas guardadas. */
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
  id: 'legado-zhinchi', missionId: '35', owner: 'Zhinchi',
} as const;

export const VANDALO_MYSTIC = { id: 'vandalo-carmesi', owner: 'Vándalo Rojo', missionId: '35' } as const;
export const GASPAR_MYSTIC = { id: 'gaspar-leon', owner: 'Gaspar de Armenta', missionId: '36' } as const;

export const SIGUMAN_MYSTICS = [
  { id: 'siguman-1', owner: 'Sigumán', missionId: '38' },
  { id: 'siguman-2', owner: 'Sigumán', missionId: '38' },
  { id: 'siguman-3', owner: 'Sigumán', missionId: '38' },
] as const;

export const MYSTIC_CATALOG = [...GENERAL_MYSTICS, ZHINCHI_MYSTIC, VANDALO_MYSTIC, GASPAR_MYSTIC, ...SIGUMAN_MYSTICS] as const;
export type MysticId = typeof MYSTIC_CATALOG[number]['id'];
export type ReplaceableKind = 'ATTACK' | 'DEFENSE' | 'ORDER';
export type MysticSlot = Readonly<{ mysticId: MysticId; replace: ReplaceableKind }>;
export const MAX_MYSTIC_SLOTS = 3;
export const MYSTIC_MAX_HP = 20;

/** Efectos sumados a la activación original; los combos NO reemplazan la carta básica.
 * healEnemy es una concesión al contrario; selfDamage no puede matar al lanzador.
 * steal mueve de la mano contraria a la propia (nunca genera cartas nuevas).
 */
export type MysticPower = Readonly<{
  damage?: number; heal?: number; selfDamage?: number;
  healEnemy?: number; draw?: number; steal?: number;
  fullHeal?: boolean; halveEnemy?: boolean; impact?: boolean;
  /** Durante el turno de la activación, bonifica cada Ataque/Defensa posterior. */
  attackBoost?: number; defenseBoost?: number;
  /** Invocación que permanece en el campo con PV y ataque propios. */
  summon?: Readonly<{ hp: number; attack: number }>;
}>;

export type MysticAbility = Readonly<{
  name: string;
  theme: string;
  base: MysticPower;
  combo2: MysticPower;
  combo3: MysticPower;
}>;

/** Primera propuesta jugable de balance. Los números pueden ajustarse después de QA. */
export const MYSTIC_ABILITIES: Readonly<Record<MysticId, MysticAbility>> = {
  'general-1': {
    name: 'Marea de Hierro', theme: 'Resistir y contraatacar',
    base: { heal: 2 }, combo2: { damage: 2, heal: 1 }, combo3: { damage: 3, heal: 2 },
  },
  'general-2': {
    name: 'Carga Sangrante', theme: 'Rapidez con sacrificio',
    base: { damage: 3, selfDamage: 1 }, combo2: { damage: 2 }, combo3: { damage: 4, selfDamage: 1 },
  },
  'general-3': {
    name: 'Pacto de Azogue', theme: 'Curación con un precio',
    base: { heal: 4, healEnemy: 1 }, combo2: { heal: 2, draw: 1 }, combo3: { damage: 3, heal: 2, healEnemy: 1 },
  },
  'general-4': {
    name: 'Descarga del Trueno', theme: 'Artillería devastadora',
    base: { damage: 3 }, combo2: { damage: 4 }, combo3: { damage: 5, selfDamage: 2 },
  },
  'general-5': {
    name: 'Velo de la Selva', theme: 'Información y sigilo',
    base: { damage: 1, draw: 1 }, combo2: { steal: 1 }, combo3: { damage: 3, steal: 1 },
  },
  'general-6': {
    name: 'Estandarte Sagrado', theme: 'Resistencia y solidaridad',
    base: { heal: 3, healEnemy: 1 }, combo2: { heal: 2, draw: 1 }, combo3: { heal: 3, damage: 2 },
  },
  'general-7': {
    name: 'Picado Celestial', theme: 'Ataque arriesgado',
    base: { damage: 4, selfDamage: 1 }, combo2: { damage: 3, selfDamage: 1 }, combo3: { damage: 5, selfDamage: 2 },
  },
  'general-8': {
    name: 'Juramento Eterno', theme: 'Justicia y equilibrio',
    base: { damage: 2, heal: 2 }, combo2: { heal: 2, draw: 1 }, combo3: { damage: 3, heal: 3 },
  },
  'legado-zhinchi': {
    name: 'Decreto del Legado', theme: 'El legado de un maestro',
    base: { attackBoost: 2, defenseBoost: 2 },
    combo2: { damage: 2 }, combo3: { damage: 3, heal: 2 },
  },
  'vandalo-carmesi': {
    name: 'Mandato Carmesí', theme: 'Poder sin principios',
    base: { damage: 2, steal: 1 }, combo2: { damage: 2 }, combo3: { damage: 3, steal: 1 },
  },
  'gaspar-leon': {
    name: 'León del Edicto', theme: 'Invocación persistente',
    base: { summon: { hp: 4, attack: 2 } }, combo2: { damage: 2 }, combo3: { heal: 2 },
  },
  'siguman-1': {
    name: 'Renacimiento Solar', theme: 'Regeneración absoluta',
    base: { fullHeal: true }, combo2: { heal: 3, steal: 1 }, combo3: { damage: 3, draw: 1 },
  },
  'siguman-2': {
    name: 'Juicio del Eclipse', theme: 'Reducir la vida rival a la mitad',
    base: { halveEnemy: true }, combo2: { steal: 2 }, combo3: { damage: 3, heal: 3, draw: 1 },
  },
  'siguman-3': {
    name: 'Decreto del Sol Negro', theme: 'Impacto y ofensiva solar',
    base: { summon: { hp: 6, attack: 2 } }, combo2: { damage: 3, draw: 1 },
    combo3: { damage: 5, selfDamage: 2 },
  },
};

export function mysticDefinition(id: string) {
  return MYSTIC_CATALOG.find(card => card.id === id);
}

export function mysticDisplayName(id: MysticId): string {
  return MYSTIC_ABILITIES[id].name;
}

export function mysticPower(id: MysticId, level: 1 | 2 | 3): MysticPower {
  const ability = MYSTIC_ABILITIES[id];
  return level === 1 ? ability.base : level === 2 ? ability.combo2 : ability.combo3;
}

export function mysticPowerText(power: MysticPower): string {
  const effects: string[] = [];
  if (power.fullHeal) effects.push('Restaura toda tu vida');
  if (power.halveEnemy) effects.push('Reduce a la mitad la vida rival');
  if (power.damage) effects.push(`−${power.damage} vida rival`);
  if (power.heal) effects.push(`+${power.heal} vida propia`);
  if (power.healEnemy) effects.push(`+${power.healEnemy} vida rival`);
  if (power.selfDamage) effects.push(`−${power.selfDamage} vida propia`);
  if (power.impact) effects.push('Sella 1 Impacto');
  if (power.attackBoost) effects.push(`+${power.attackBoost} a cada Ataque este turno`);
  if (power.defenseBoost) effects.push(`+${power.defenseBoost} a cada Defensa este turno`);
  if (power.summon) effects.push(`Invoca guardián: ${power.summon.hp} PV y ${power.summon.attack} de ataque por turno`);
  if (power.draw) effects.push(`Roba ${power.draw} ${power.draw === 1 ? 'carta' : 'cartas'}`);
  if (power.steal) effects.push(`Arrebata ${power.steal} ${power.steal === 1 ? 'carta' : 'cartas'} de la mano rival`);
  return effects.join(' · ');
}

/** El impacto de Sol Negro mantiene la regla de solo un Impacto por turno. */
export function canActivateMystic(id: string | undefined, impactPlayedThisTurn: boolean): boolean {
  return id !== 'siguman-3' || !impactPlayedThisTurn;
}

export type MysticSnapshot = Readonly<{
  selfHp: number; enemyHp: number; selfSeals: number; impactPlayedThisTurn: boolean;
}>;
export type MysticResolution = Readonly<{
  selfHp: number; enemyHp: number; selfSeals: number; impactPlayedThisTurn: boolean;
  draw: number; steal: number; accepted: boolean;
}>;

/** Resolución pura y comprobable; nunca mezcla efectos visuales con reglas. */
export function resolveMysticPower(power: MysticPower, state: MysticSnapshot): MysticResolution {
  if (power.impact && (state.impactPlayedThisTurn || state.selfSeals >= 4)) {
    return { ...state, draw: 0, steal: 0, accepted: false };
  }
  const clamp = (hp: number) => Math.max(0, Math.min(MYSTIC_MAX_HP, hp));
  let selfHp = power.fullHeal ? MYSTIC_MAX_HP : state.selfHp;
  selfHp = clamp(selfHp + (power.heal ?? 0));
  // El retroceso no mata al lanzador: evita una derrota simultánea ambigua.
  if (power.selfDamage) selfHp = Math.max(1, selfHp - power.selfDamage);
  let enemyHp = power.halveEnemy ? Math.floor(state.enemyHp / 2) : state.enemyHp;
  enemyHp = clamp(enemyHp + (power.healEnemy ?? 0) - (power.damage ?? 0));
  return {
    selfHp, enemyHp, selfSeals: state.selfSeals + (power.impact ? 1 : 0),
    impactPlayedThisTurn: state.impactPlayedThisTurn || Boolean(power.impact),
    draw: power.draw ?? 0, steal: power.steal ?? 0, accepted: true,
  };
}

export function mysticCard(id: MysticId, instanceId: string): CardData {
  const ability = MYSTIC_ABILITIES[id];
  return {
    id: instanceId, type: 'MYSTIC', mysticId: id,
    name: ability.name, description: mysticPowerText(ability.base),
    cost: 0, img: '/Decreto-Real/cartas/decreto-orden.webp?v=20261103',
  };
}

/** Sustitución uno a uno: Impacto nunca se reemplaza. El resultado tiene 28 cartas. */
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

export function bossMysticSlots(missionId: string): MysticSlot[] {
  if (missionId === '35') return Array.from({ length: 3 }, () => ({ mysticId: VANDALO_MYSTIC.id, replace: 'ATTACK' as const }));
  if (missionId === '36') return Array.from({ length: 3 }, () => ({ mysticId: GASPAR_MYSTIC.id, replace: 'ATTACK' as const }));
  if (missionId === '37') return [SIGUMAN_MYSTICS[0], SIGUMAN_MYSTICS[1], SIGUMAN_MYSTICS[0]].map(card => ({ mysticId: card.id, replace: 'ATTACK' as const }));
  if (missionId === '38') return SIGUMAN_MYSTICS.map(card => ({ mysticId: card.id, replace: 'ATTACK' as const }));
  const general = GENERAL_MYSTICS.find(card => card.missionId === missionId);
  return general ? Array.from({ length: 3 }, () => ({ mysticId: general.id, replace: 'ATTACK' as const })) : [];
}
