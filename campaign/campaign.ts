import type { Difficulty } from '../game/combatEngine.ts';
import { STORY_STAGES, type StoryStage } from './story.ts';

/** Future balance parameters; no duel rule is changed by mission metadata. */
export type CampaignMission = StoryStage & {
  seed: number;
  difficulty: Difficulty;
  healthGoal: number;
  turnGoal: number;
};

export const CAMPAIGN_MISSIONS: readonly CampaignMission[] = STORY_STAGES.map((stage, index) => ({
  ...stage,
  seed: (1101 * (index + 1)) >>> 0,
  difficulty: (index < 7 ? 'Aprendiz' : index < 25 ? 'Estratega' : 'Maestro') as Difficulty,
  healthGoal: Math.max(7, 12 - Math.floor(index / 8)),
  turnGoal: Math.max(7, 10 - Math.floor(index / 12)),
}));

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
  // Every earlier challenge must be won: a malformed or nonsequential save
  // cannot unlock a later region or skip the story.
  return CAMPAIGN_MISSIONS.slice(0, index).every(mission => bestStars(progress, mission.id) > 0);
}

export function calculateMissionStars(mission: CampaignMission, result: { winner: 'player' | 'rival' | null; playerHp: number; turn: number }): number {
  if (result.winner !== 'player') return 0;
  return 1 + Number(result.playerHp >= mission.healthGoal) + Number(result.turn <= mission.turnGoal);
}

export function awardMissionStars(progress: CampaignProgress, id: string, earned: number): CampaignProgress {
  if (!getCampaignMission(id) || !isMissionUnlocked(progress, id) || !Number.isInteger(earned) || earned < 0 || earned > 3) return progress;
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
