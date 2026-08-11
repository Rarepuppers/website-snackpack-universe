import {
  resolvePlayerStats,
  type PlayerStatBlock,
  type PlayerStatSources,
} from "../stats/PlayerStatBlock";
import { applyPlayerStatLimits } from "../stats/PlayerStatLimits";
import { foldRunItemStats } from "./ItemRewardPlanning";

export function resolveRunPlayerStats(input: {
  readonly perk: PlayerStatSources["perk"];
  readonly relic: PlayerStatSources["relic"];
  readonly transformation: PlayerStatSources["transformation"];
  readonly baseItemStats: Readonly<Partial<PlayerStatBlock>>;
  readonly ownedItemIds: readonly string[];
}): PlayerStatBlock {
  return resolvePlayerStats({
    perk: input.perk,
    relic: input.relic,
    transformation: input.transformation,
    itemStats: foldRunItemStats({
      baseItemStats: input.baseItemStats,
      ownedItemIds: input.ownedItemIds,
    }),
  });
}

export interface ArmourReconciliationPlan {
  readonly changed: boolean;
  readonly nextArmour: number;
  readonly nextAppliedItemArmour: number;
}

export function planArmourReconciliation(input: {
  readonly currentArmour: number;
  readonly appliedItemArmour: number;
  readonly effectiveItemArmour: number;
}): ArmourReconciliationPlan {
  const delta = input.effectiveItemArmour - input.appliedItemArmour;
  if (delta === 0) {
    return {
      changed: false,
      nextArmour: input.currentArmour,
      nextAppliedItemArmour: input.appliedItemArmour,
    };
  }
  return {
    changed: true,
    nextArmour: Math.max(0, input.currentArmour + delta),
    nextAppliedItemArmour: input.effectiveItemArmour,
  };
}

export function calculateRewardAdjustedMaxHealth(input: {
  readonly heroBaseMaxHealth: number;
  readonly growthBonus: number;
  readonly rewardMaxHealthBonus: number;
  readonly maxHpFlat: number;
  readonly maxHpPercent: number;
}): number {
  const base = input.heroBaseMaxHealth + input.growthBonus + input.rewardMaxHealthBonus + input.maxHpFlat;
  return Math.max(3, Math.round(base * (1 + input.maxHpPercent / 100)));
}

export interface HealthReconciliationPlan {
  readonly nextMaxHealth: number;
  readonly nextHealth: number;
}

export function planHealthReconciliation(input: {
  readonly heroBaseMaxHealth: number;
  readonly growthBonus: number;
  readonly rewardMaxHealthBonus: number;
  readonly maxHpFlat: number;
  readonly maxHpPercent: number;
  readonly transformationMaxHealthMultiplier: number;
  readonly previousMaxHealth: number;
  readonly currentHealth: number;
}): HealthReconciliationPlan {
  const rewardAdjusted = calculateRewardAdjustedMaxHealth(input);
  const nextMaxHealth = Math.max(3, Math.round(rewardAdjusted * input.transformationMaxHealthMultiplier));
  const gained = nextMaxHealth - input.previousMaxHealth;
  const healthWithGain = gained > 0 ? input.currentHealth + gained : input.currentHealth;
  return {
    nextMaxHealth,
    nextHealth: Math.max(0.1, Math.min(healthWithGain, nextMaxHealth)),
  };
}

export interface PlayerStatRefreshPlan {
  readonly rawStats: PlayerStatBlock;
  readonly effectiveStats: PlayerStatBlock;
  readonly cappedStatKeys: readonly (keyof PlayerStatBlock)[];
  readonly armour: ArmourReconciliationPlan;
  readonly nextMaxHealth: number;
  readonly nextHealth: number;
}

export function planPlayerStatRefresh(input: {
  readonly perk: PlayerStatSources["perk"];
  readonly relic: PlayerStatSources["relic"];
  readonly transformation: PlayerStatSources["transformation"];
  readonly baseItemStats: Readonly<Partial<PlayerStatBlock>>;
  readonly ownedItemIds: readonly string[];
  readonly currentArmour: number;
  readonly appliedItemArmour: number;
  readonly heroBaseMaxHealth: number;
  readonly growthBonus: number;
  readonly rewardMaxHealthBonus: number;
  readonly transformationMaxHealthMultiplier: number;
  readonly previousMaxHealth: number;
  readonly currentHealth: number;
}): PlayerStatRefreshPlan {
  const rawStats = resolveRunPlayerStats(input);
  const preliminaryStats = applyPlayerStatLimits(rawStats).effective;
  const armour = planArmourReconciliation({
    currentArmour: input.currentArmour,
    appliedItemArmour: input.appliedItemArmour,
    effectiveItemArmour: preliminaryStats.armourFlat,
  });
  const health = planHealthReconciliation({
    heroBaseMaxHealth: input.heroBaseMaxHealth,
    growthBonus: input.growthBonus,
    rewardMaxHealthBonus: input.rewardMaxHealthBonus,
    maxHpFlat: preliminaryStats.maxHpFlat,
    maxHpPercent: preliminaryStats.maxHpPercent,
    transformationMaxHealthMultiplier: input.transformationMaxHealthMultiplier,
    previousMaxHealth: input.previousMaxHealth,
    currentHealth: input.currentHealth,
  });
  const limited = applyPlayerStatLimits(rawStats, health.nextMaxHealth);
  return {
    rawStats,
    effectiveStats: limited.effective,
    cappedStatKeys: limited.capped,
    armour,
    nextMaxHealth: health.nextMaxHealth,
    nextHealth: health.nextHealth,
  };
}
