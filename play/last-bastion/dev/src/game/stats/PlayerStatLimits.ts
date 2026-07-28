import type { PlayerStatBlock } from "./PlayerStatBlock";

export const PLAYER_STAT_LIMITS = Object.freeze({
  critChancePercent: { min: 0, max: 100 },
  critMultiplier: { min: 1, max: 4 },
  dodgePercent: { min: 0, max: 60 },
  attackSpeedFactor: { min: 0.25, max: 3 },
  finalAttackSpeedFactor: { min: 0.2, max: 4 },
  movementFactor: { min: 0.5, max: 1.75 },
  rangeFactor: { min: 0.25, max: 3 },
  lifestealPercent: { min: 0, max: 25 },
  lifestealThroughputMaxHealthFraction: 0.2,
  passiveRegenerationMaxHealthFraction: 0.1,
  outgoingDamageFactorMinimum: 0.1,
});

export interface EffectivePlayerStats {
  raw: PlayerStatBlock;
  effective: PlayerStatBlock;
  capped: readonly (keyof PlayerStatBlock)[];
}

function finiteOrFallback(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clampStat(
  raw: PlayerStatBlock,
  effective: PlayerStatBlock,
  capped: (keyof PlayerStatBlock)[],
  key: keyof PlayerStatBlock,
  min: number,
  max: number,
): void {
  const value = finiteOrFallback(effective[key], 0);
  const next = Math.min(max, Math.max(min, value));
  effective[key] = next;
  if (next !== value) capped.push(key);
}

/** Applies combat safety bounds without mutating persisted/raw build values. */
export function applyPlayerStatLimits(raw: PlayerStatBlock, maxHealth = Number.POSITIVE_INFINITY): EffectivePlayerStats {
  const effective: PlayerStatBlock = { ...raw };
  const capped: (keyof PlayerStatBlock)[] = [];

  for (const key of Object.keys(effective) as (keyof PlayerStatBlock)[]) {
    const fallback = key === "critMultiplier" ? 1.5 : 0;
    const value = finiteOrFallback(raw[key], fallback);
    effective[key] = value;
    if (value !== raw[key]) capped.push(key);
  }

  clampStat(raw, effective, capped, "critChancePercent", 0, PLAYER_STAT_LIMITS.critChancePercent.max);
  clampStat(raw, effective, capped, "critMultiplier", PLAYER_STAT_LIMITS.critMultiplier.min, PLAYER_STAT_LIMITS.critMultiplier.max);
  clampStat(raw, effective, capped, "dodgePercent", 0, PLAYER_STAT_LIMITS.dodgePercent.max);
  clampStat(raw, effective, capped, "lifestealPercent", 0, PLAYER_STAT_LIMITS.lifestealPercent.max);

  const attackSpeedFactor = Math.min(
    PLAYER_STAT_LIMITS.attackSpeedFactor.max,
    Math.max(PLAYER_STAT_LIMITS.attackSpeedFactor.min, 1 + finiteOrFallback(raw.attackSpeedPercent, 0) / 100),
  );
  effective.attackSpeedPercent = (attackSpeedFactor - 1) * 100;
  if (effective.attackSpeedPercent !== finiteOrFallback(raw.attackSpeedPercent, 0)) capped.push("attackSpeedPercent");

  const movementFactor = Math.min(
    PLAYER_STAT_LIMITS.movementFactor.max,
    Math.max(PLAYER_STAT_LIMITS.movementFactor.min, 1 + finiteOrFallback(raw.moveSpeedPercent, 0) / 100),
  );
  effective.moveSpeedPercent = (movementFactor - 1) * 100;
  if (effective.moveSpeedPercent !== finiteOrFallback(raw.moveSpeedPercent, 0)) capped.push("moveSpeedPercent");

  const rangeFactor = Math.min(
    PLAYER_STAT_LIMITS.rangeFactor.max,
    Math.max(PLAYER_STAT_LIMITS.rangeFactor.min, 1 + finiteOrFallback(raw.rangePercent, 0) / 100),
  );
  effective.rangePercent = (rangeFactor - 1) * 100;
  if (effective.rangePercent !== finiteOrFallback(raw.rangePercent, 0)) capped.push("rangePercent");

  const regenCap = Math.max(0, finiteOrFallback(maxHealth, Number.POSITIVE_INFINITY))
    * PLAYER_STAT_LIMITS.passiveRegenerationMaxHealthFraction;
  const regen = Math.min(regenCap, Math.max(0, finiteOrFallback(raw.hpRegenPerSecond, 0)));
  effective.hpRegenPerSecond = regen;
  if (regen !== finiteOrFallback(raw.hpRegenPerSecond, 0)) capped.push("hpRegenPerSecond");

  return { raw: { ...raw }, effective, capped: [...new Set(capped)] };
}

export function finalAttackSpeedFactor(value: number): number {
  return Math.min(
    PLAYER_STAT_LIMITS.finalAttackSpeedFactor.max,
    Math.max(PLAYER_STAT_LIMITS.finalAttackSpeedFactor.min, Number.isFinite(value) ? value : 1),
  );
}
