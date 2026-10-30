import {
  CAMPAIGN_MISSIONS, bestStars, type CampaignMission, type CampaignProgress,
} from './campaign.ts';

export type CampaignOverview = {
  completed: number;
  total: number;
  stars: number;
  maximumStars: number;
  percentage: number;
  nextMission: CampaignMission | null;
  completedCampaign: boolean;
};

/** Only count the contiguous sequence of victories. A corrupt, imported or
 * out-of-order save must never imply progress beyond an undefeated challenge. */
export function campaignOverview(progress: CampaignProgress): CampaignOverview {
  let completed = 0;
  let stars = 0;
  for (const mission of CAMPAIGN_MISSIONS) {
    const score = bestStars(progress, mission.id);
    if (score < 1) break;
    completed++;
    stars += score;
  }

  const total = CAMPAIGN_MISSIONS.length;
  return {
    completed,
    total,
    stars,
    maximumStars: total * 3,
    percentage: Math.round(completed / total * 100),
    nextMission: CAMPAIGN_MISSIONS[completed] ?? null,
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
    { id: 'victory', label: 'Gana el duelo' },
    { id: 'health', label: `Conserva al menos ${mission.healthGoal} de vida` },
    { id: 'turns', label: `Vence hasta el turno ${mission.turnGoal}` },
  ];
}
