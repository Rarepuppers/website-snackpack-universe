import { describe, expect, it } from "vitest";
import {
  calculateRewardAdjustedMaxHealth,
  planArmourReconciliation,
  planHealthReconciliation,
  planPlayerStatRefresh,
  resolveRunPlayerStats,
} from "./PlayerStatRefreshPlanning";

describe("resolved player-stat source planning", () => {
  it("folds raw grants and stacked owned items into the canonical block", () => {
    const resolved = resolveRunPlayerStats({
      perk: null,
      relic: null,
      transformation: null,
      baseItemStats: { damagePercent: 5, luck: 2 },
      ownedItemIds: ["whetstone", "whetstone", "plate-fragment"],
    });
    expect(resolved.damagePercent).toBe(21);
    expect(resolved.armourFlat).toBe(2);
    expect(resolved.luck).toBe(2);
    expect(resolved.critMultiplier).toBe(1.5);
  });
});

describe("armour reconciliation planning", () => {
  it("preserves the exact zero-delta no-op", () => {
    expect(planArmourReconciliation({ currentArmour: -2, appliedItemArmour: 3, effectiveItemArmour: 3 })).toEqual({
      changed: false,
      nextArmour: -2,
      nextAppliedItemArmour: 3,
    });
  });

  it("applies the item delta and clamps live armour at zero", () => {
    expect(planArmourReconciliation({ currentArmour: 1, appliedItemArmour: 3, effectiveItemArmour: -2 })).toEqual({
      changed: true,
      nextArmour: 0,
      nextAppliedItemArmour: -2,
    });
  });
});

describe("health reconciliation planning", () => {
  it("keeps authored max-health ordering and heals by a positive ceiling gain", () => {
    expect(calculateRewardAdjustedMaxHealth({
      heroBaseMaxHealth: 10,
      growthBonus: 2,
      rewardMaxHealthBonus: 3,
      maxHpFlat: 5,
      maxHpPercent: 25,
    })).toBe(25);
    expect(planHealthReconciliation({
      heroBaseMaxHealth: 10,
      growthBonus: 2,
      rewardMaxHealthBonus: 3,
      maxHpFlat: 5,
      maxHpPercent: 25,
      transformationMaxHealthMultiplier: 1.2,
      previousMaxHealth: 20,
      currentHealth: 12,
    })).toEqual({ nextMaxHealth: 30, nextHealth: 22 });
  });

  it("does not damage for a lower ceiling but clamps health into the new range", () => {
    expect(planHealthReconciliation({
      heroBaseMaxHealth: 10,
      growthBonus: 0,
      rewardMaxHealthBonus: 0,
      maxHpFlat: -20,
      maxHpPercent: 0,
      transformationMaxHealthMultiplier: 0.5,
      previousMaxHealth: 20,
      currentHealth: 18,
    })).toEqual({ nextMaxHealth: 3, nextHealth: 3 });
  });
});

describe("player-stat refresh transaction planning", () => {
  it("returns one immutable commit plan for stats, armour, and health", () => {
    const plan = planPlayerStatRefresh({
      perk: null,
      relic: null,
      transformation: null,
      baseItemStats: { armourFlat: 2, maxHpFlat: 8, hpRegenPerSecond: 99 },
      ownedItemIds: [],
      currentArmour: 1,
      appliedItemArmour: 0,
      heroBaseMaxHealth: 10,
      growthBonus: 0,
      rewardMaxHealthBonus: 0,
      transformationMaxHealthMultiplier: 1,
      previousMaxHealth: 10,
      currentHealth: 6,
    });
    expect(plan.armour).toEqual({ changed: true, nextArmour: 3, nextAppliedItemArmour: 2 });
    expect(plan.nextMaxHealth).toBe(18);
    expect(plan.nextHealth).toBe(14);
    expect(plan.effectiveStats.hpRegenPerSecond).toBe(1.8);
    expect(plan.cappedStatKeys).toContain("hpRegenPerSecond");
  });
});
