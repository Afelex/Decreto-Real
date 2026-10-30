export const GAME_RULES = {
  maxHealth: 20,
  maxShield: 12,
  maxHand: 6,
  startingMana: 3,
  comboLength: 3,
  comboBonus: 2,
  impactCount: 4,
  impactHealing: 1,
  impactDamage: 1,
} as const;

export type AttackResolution = {
  damageDealt: number;
  damageBlocked: number;
  remainingShield: number;
};

export function resolveAttack(
  baseDamage: number,
  shield: number,
  comboBonus = 0,
): AttackResolution {
  const totalDamage = Math.max(0, baseDamage) + Math.max(0, comboBonus);
  const damageBlocked = Math.min(Math.max(0, shield), totalDamage);
  return {
    damageDealt: totalDamage - damageBlocked,
    damageBlocked,
    remainingShield: Math.max(0, shield - damageBlocked),
  };
}

export function drawFromPile<T>(hand: T[], drawPile: T[], count: number, maxHand: number) {
  const drawCount = Math.min(
    Math.max(0, Math.floor(count)),
    Math.max(0, Math.floor(maxHand) - hand.length),
    drawPile.length,
  );
  const drawn = drawPile.slice(0, drawCount);
  return {
    drawn,
    hand: [...hand, ...drawn],
    drawPile: drawPile.slice(drawCount),
  };
}

export function resolveImpact(seals: number, health: number) {
  const finalImpact = seals >= GAME_RULES.impactCount - 1;
  return {
    seals: finalImpact ? GAME_RULES.impactCount : seals + 1,
    health: finalImpact
      ? health
      : Math.min(GAME_RULES.maxHealth, health + GAME_RULES.impactHealing),
    damage: finalImpact ? 0 : GAME_RULES.impactDamage,
    wins: finalImpact,
  };
}

export function nextComboStreak(previousKind: string | null, previousCount: number, nextKind: string) {
  const count = previousKind === nextKind ? previousCount + 1 : 1;
  const triggered = count === GAME_RULES.comboLength;
  return { count: triggered ? 0 : count, triggered };
}
