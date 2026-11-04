import {
  CAMPAIGN_MISSIONS, bestStars, validatedCampaignProgress, type CampaignMission, type CampaignProgress,
} from './campaign.ts';
import { classicHealthGoal } from './classicScoring.ts';

export type CampaignOverview = {
  completed: number;
  total: number;
  stars: number;
  maximumStars: number;
  percentage: number;
  nextMission: CampaignMission | null;
  completedCampaign: boolean;
};

/** Count verified victories across independent chapters, not only a contiguous
 * global list. The prologue and each region remain internally sequential. */
export function campaignOverview(progress: CampaignProgress): CampaignOverview {
  const verified = validatedCampaignProgress(progress);
  let completed = 0;
  let stars = 0;
  for (const mission of CAMPAIGN_MISSIONS) {
    const score = bestStars(verified, mission.id);
    if (score > 0) { completed++; stars += score; }
  }
  const next = CAMPAIGN_MISSIONS.find(mission => bestStars(verified, mission.id) === 0) ?? null;
  const total = CAMPAIGN_MISSIONS.length;
  return {
    completed,
    total,
    stars,
    maximumStars: total * 3,
    percentage: Math.round(completed / total * 100),
    nextMission: next,
    completedCampaign: completed === total,
  };
}

export type MissionStarGoal = {
  id: 'victory' | 'health' | 'turns';
  label: string;
};

/** Copy shown on the map and briefing matches calculateMissionStars. */
export function missionStarGoals(mission: CampaignMission): readonly MissionStarGoal[] {
  return [
    { id: 'victory', label: 'Gana el combate' },
    { id: 'health', label: `Conserva al menos ${classicHealthGoal(mission)} de vida` },
    { id: 'turns', label: `Gana en ${mission.turnGoal} rondas o menos` },
  ];
}
