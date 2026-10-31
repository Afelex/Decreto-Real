/** DR-C06: Deterministic boss styles using the existing attack, guard and Impact
 * effects only. No new damage, cards, resources, RNG or fatigue mechanics. */
import type { Difficulty } from './combatEngine.ts';

export const BOSS_IDS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;
export type BossId = typeof BOSS_IDS[number];
export type BossMove = 'attack' | 'shield' | 'impact';

export type BossStyle = Readonly<{
  id: BossId;
  name: string;
  title: string;
  hint: string;
  weights: Readonly<{ attack: number; shield: number; impact: number }>;
}>;

export const BOSS_STYLES: Readonly<Record<BossId, BossStyle>> = {
  '1': {id:'1',name:'Almirante de Hierro',title:'Baluarte naval',hint:'Refuerza su escudo antes de contraatacar.',weights:{attack:3,shield:6,impact:1}},
  '2': {id:'2',name:'Jinete Escarlata',title:'Carga veloz',hint:'Prefiere ataques y presiona la vida.',weights:{attack:8,shield:1,impact:1}},
  '3': {id:'3',name:'Señor de la Plata',title:'Pacto de plata',hint:'Busca sellar Impactos y recuperar vida.',weights:{attack:2,shield:2,impact:6}},
  '4': {id:'4',name:'Artillero del Trueno',title:'Fuego de artillería',hint:'Ataca sobre todo cuando tu escudo está bajo.',weights:{attack:7,shield:2,impact:1}},
  '5': {id:'5',name:'Fantasma de la Selva',title:'Emboscada velada',hint:'Alterna ataques y sellos; protege poco.',weights:{attack:4,shield:1,impact:5}},
  '6': {id:'6',name:'Dama del Estandarte',title:'Estandarte firme',hint:'Construye defensas y resiste el asedio.',weights:{attack:2,shield:7,impact:1}},
  '7': {id:'7',name:'Cóndor de los Andes',title:'Picado de las cumbres',hint:'Se vuelve más agresivo cuando estás herido.',weights:{attack:5,shield:2,impact:3}},
  '8': {id:'8',name:'Caballero del Juramento',title:'Juramento final',hint:'Equilibra ataque y sellos; se protege cuando peligra.',weights:{attack:3,shield:3,impact:4}},
};

/** Narrative names shown on the table, not additional playable cards. */
export const BOSS_MOVE_NAMES: Readonly<Record<BossId, Readonly<Record<BossMove, string>>>> = {
  '1': {attack:'Salva del Callao', shield:'Muralla de proa', impact:'Sello del almirantazgo'},
  '2': {attack:'Carga escarlata', shield:'Repliegue veloz', impact:'Orden del mensajero'},
  '3': {attack:'Golpe de azogue', shield:'Bóveda de plata', impact:'Pacto de plata'},
  '4': {attack:'Descarga del bastión', shield:'Cobertura del obús', impact:'Sello de artillería'},
  '5': {attack:'Emboscada de la selva', shield:'Camuflaje del sendero', impact:'Marca del fantasma'},
  '6': {attack:'Orden del estandarte', shield:'Guardia de bandera', impact:'Juramento de la dama'},
  '7': {attack:'Picado del cóndor', shield:'Nido de roca', impact:'Marca de las cumbres'},
  '8': {attack:'Espada jurada', shield:'Escudo del juramento', impact:'Sello del caballero'},
};

export function isBossId(input: unknown): input is BossId {
  return typeof input === 'string' && BOSS_IDS.some(id => id === input);
}

export type BossSnapshot = Readonly<{
  turn: number;
  playerHp: number;
  shield: number;
  enemyHp: number;
  enemyShield: number;
  enemySeals: number;
  difficulty: Difficulty;
}>;

/** Exactly one seeded random sample selects each boss move.
 * Fourth rival Impact remains the engine's existing automatic win priority. */
export function selectBossMove(id: BossId, state: BossSnapshot, sample: number): BossMove {
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error('Invalid seeded sample');
  const base = BOSS_STYLES[id].weights;
  let attack = base.attack;
  let shield = state.enemyShield >= 10 ? 0 : base.shield;
  let impact = base.impact;
  switch (id) {
    case '1': if (state.enemyShield >= 5) attack += 5; else shield += 3; break;
    case '2': if (state.playerHp <= 10) attack += 3; break;
    case '3': if (state.enemyHp <= 12) impact += 4; break;
    case '4': if (state.shield <= 3) attack += 4; else shield += 3; break;
    case '5': if (state.turn % 2 === 0) impact += 3; else attack += 2; break;
    case '6': if (state.enemyShield < 6) shield += 4; else attack += 3; break;
    case '7': if (state.playerHp <= 10) attack += 6; break;
    case '8': if (state.enemyHp <= 9) shield += 5; if (state.enemySeals >= 2) impact += 4; break;
  }
  if (state.difficulty === 'Aprendiz') { attack = Math.max(1, attack - 2); shield += 1; }
  if (state.difficulty === 'Maestro') { attack += 2; impact += 1; }
  // Guard is a waste at the existing 10-point cap, irrespective of profile.
  if (state.enemyShield >= 10) shield = 0;
  const total = attack + shield + impact;
  const pick = sample * total;
  return pick < attack ? 'attack' : pick < attack + shield ? 'shield' : 'impact';
}
