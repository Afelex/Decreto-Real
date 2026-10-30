import type { Difficulty } from '../game/combatEngine.ts';

/** Independent PvE campaign. This module does not change duel rules. */
export type CampaignMission = {
  id: string;
  title: string;
  description: string;
  seed: number;
  difficulty: Difficulty;
  healthGoal: number;
  turnGoal: number;
};

export const CAMPAIGN_MISSIONS: readonly CampaignMission[] = [
  { id: '01', title: 'El primer decreto', description: 'Da tus primeros pasos frente a un rival aprendiz.', seed: 1101, difficulty: 'Aprendiz', healthGoal: 12, turnGoal: 9 },
  { id: '02', title: 'Camino de los pregones', description: 'Aprende a aprovechar ataques y defensas.', seed: 2202, difficulty: 'Aprendiz', healthGoal: 12, turnGoal: 9 },
  { id: '03', title: 'El puente de piedra', description: 'Cada decisión de mando cuenta.', seed: 3303, difficulty: 'Estratega', healthGoal: 11, turnGoal: 9 },
  { id: '04', title: 'Guardia del bastión', description: 'Resiste a un rival más decidido.', seed: 4404, difficulty: 'Estratega', healthGoal: 10, turnGoal: 9 },
  { id: '05', title: 'La biblioteca real', description: 'Busca la secuencia correcta de Impactos.', seed: 5505, difficulty: 'Estratega', healthGoal: 10, turnGoal: 8 },
  { id: '06', title: 'Plaza de las banderas', description: 'La corona te exige un duelo limpio.', seed: 6606, difficulty: 'Estratega', healthGoal: 10, turnGoal: 8 },
  { id: '07', title: 'Las puertas del palacio', description: 'Prueba tu estrategia contra un maestro.', seed: 7707, difficulty: 'Maestro', healthGoal: 9, turnGoal: 8 },
  { id: '08', title: 'Audiencia del virrey', description: 'La última prueba del primer recorrido.', seed: 8808, difficulty: 'Maestro', healthGoal: 8, turnGoal: 8 },
];

export const CAMPAIGN_STORAGE_KEY = 'decreto-real.campania.v1';
export type CampaignProgress = { version: 1; stars: Record<string, number> };
export type CampaignStorage = Pick<Storage, 'getItem' | 'setItem'>;
export const emptyCampaignProgress = (): CampaignProgress => ({ version: 1, stars: {} });

export function getCampaignMission(id: string | undefined): CampaignMission | undefined {
  return CAMPAIGN_MISSIONS.find(mission => mission.id === id);
}

export function bestStars(progress: CampaignProgress, id: string): number {
  return Math.max(0, Math.min(3, progress.stars[id] ?? 0));
}

export function isMissionUnlocked(progress: CampaignProgress, id: string): boolean {
  const index = CAMPAIGN_MISSIONS.findIndex(mission => mission.id === id);
  if (index < 0) return false;
  return index === 0 || bestStars(progress, CAMPAIGN_MISSIONS[index - 1].id) > 0;
}

export function calculateMissionStars(mission: CampaignMission, result: { winner: 'player' | 'rival' | null; playerHp: number; turn: number }): number {
  if (result.winner !== 'player') return 0;
  return 1 + Number(result.playerHp >= mission.healthGoal) + Number(result.turn <= mission.turnGoal);
}

export function awardMissionStars(progress: CampaignProgress, id: string, earned: number): CampaignProgress {
  if (!getCampaignMission(id) || !Number.isInteger(earned) || earned < 0 || earned > 3) return progress;
  return { version: 1, stars: { ...progress.stars, [id]: Math.max(bestStars(progress, id), earned) } };
}

/** Corrupt, unavailable and foreign storage are treated as a fresh campaign. */
export function loadCampaignProgress(storage: CampaignStorage | null | undefined): CampaignProgress {
  try {
    const raw = storage?.getItem(CAMPAIGN_STORAGE_KEY);
    if (!raw) return emptyCampaignProgress();
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return emptyCampaignProgress();
    const value = data as { version?: unknown; stars?: unknown };
    if (value.version !== 1 || !value.stars || typeof value.stars !== 'object' || Array.isArray(value.stars)) return emptyCampaignProgress();
    const result = emptyCampaignProgress();
    for (const mission of CAMPAIGN_MISSIONS) {
      const score = (value.stars as Record<string, unknown>)[mission.id];
      if (Number.isInteger(score) && typeof score === 'number' && score >= 1 && score <= 3) result.stars[mission.id] = score;
    }
    return result;
  } catch {
    return emptyCampaignProgress();
  }
}

export function saveCampaignProgress(storage: CampaignStorage | null | undefined, progress: CampaignProgress): boolean {
  try {
    if (!storage) return false;
    storage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
