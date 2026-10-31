import type { CampaignMission } from './campaign.ts';
import type { OriginalBattleOutcome } from '../screens/GameBoard';

/** Score the original 10-HP, alternating-turn game without changing its
 * rules. Existing campaign goals were authored for 20 HP and player rounds.
 * Translate only their thresholds, not the game itself. */
export function classicHealthGoal(mission: CampaignMission): number {
  return Math.max(1, Math.min(10, Math.ceil(mission.healthGoal / 2)));
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
