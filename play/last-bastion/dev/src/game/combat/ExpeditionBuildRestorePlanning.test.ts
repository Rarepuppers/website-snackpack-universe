import { describe, expect, it } from "vitest";
import { MARINE } from "../hero/marine";
import {
  planCarriedUpgradeRestores,
  planExpeditionProgressionRestore,
  planWeaponAndSurvivalRestore,
} from "./ExpeditionBuildRestorePlanning";

describe("expedition progression restoration", () => {
  it("normalizes persisted progression and plans total hero growth", () => {
    expect(planExpeditionProgressionRestore({ hero: MARINE, level: 2.9, experience: -4 })).toEqual({
      level: 2,
      experience: 0,
      maxHealthGrowthBonus: 1,
      armourBonus: 0.5,
      damageMultiplier: 1.02,
      speedMultiplier: 1.015,
      supportMultiplier: 1,
      weaponProficiencies: { light: 1, medium: 0, heavy: 0, unique: 0 },
    });
  });
});

describe("carried-upgrade restoration", () => {
  it("rejects unknown/zero entries and clamps authored levels", () => {
    expect(planCarriedUpgradeRestores([
      { upgradeId: "not-authored", level: 2 },
      { upgradeId: "rapid-cycling", level: 99 },
      { upgradeId: "twin-shot", level: 0.9 },
    ])).toEqual([{
      upgradeId: "rapid-cycling",
      targetLevel: 3,
      levelsToApply: [1, 2, 3],
    }]);
  });

  it("preserves ordered duplicate entries for exact replay semantics", () => {
    expect(planCarriedUpgradeRestores([
      { upgradeId: "field-magnet", level: 1 },
      { upgradeId: "field-magnet", level: 1 },
    ])).toHaveLength(2);
  });
});

describe("weapon-tier and survival restoration", () => {
  it("clamps carried tiers, supplies defaults, and maps damage multipliers", () => {
    expect(planWeaponAndSurvivalRestore({
      weapons: [{ weaponId: "a", tier: -2 }, { weaponId: "b", tier: 2.9 }, { weaponId: "c", tier: 99 }],
      rackTileCount: 4,
      equippedWeaponCount: 3,
      maxHealth: 20,
      health: 12,
      shield: 4,
    })).toMatchObject({
      rackTiers: [1, 2, 3, 1],
      weaponDamageMultipliers: [1, 1.6, 2.56],
    });
  });

  it("clamps survival state and clears bonus health", () => {
    expect(planWeaponAndSurvivalRestore({
      weapons: [],
      rackTileCount: 0,
      equippedWeaponCount: 0,
      maxHealth: 10,
      health: 99,
      shield: -5,
    })).toMatchObject({ health: 10, bonusHealth: 0, shield: 0 });
  });
});
