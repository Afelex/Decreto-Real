import type { CampaignMission } from './campaign.ts';
import type { OriginalBattleOutcome } from '../screens/GameBoard';

/** The original battle now has the campaign's 20 HP. */
export function classicHealthGoal(mission: CampaignMission): number {
  return Math.max(1, Math.min(20, mission.healthGoal));
}

export function classicRoundCount(turns: number): number {
  return Math.ceil(Math.max(0, turns) / 2);
}

export function calculateClassicMissionStars(mission: CampaignMission, outcome: OriginalBattleOutcome): number {
  if (!outcome.won) return 0;
  return 1 +
    Number(outcome.health >= classicHealthGoal(mission)) +
    Number(classicRoundCount(outcome.turns) <= mission.turnGoal);
}
