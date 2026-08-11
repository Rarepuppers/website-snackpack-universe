import { describe, expect, it } from "vitest";
import {
  isUpgradeEligibleForRun,
  levelStatCardForLevel,
  planExperienceAward,
  planHeroLevelGrowth,
  planLevelStatDecision,
  planLevelStatGrant,
  planLevelUpAdvance,
  planLevelUpChoice,
  planUpgradeDecision,
  upgradeScanOffsets,
  usedUpgradeSlots,
} from "./LevelUpDecision";
import type { UpgradeCategory, UpgradeId } from "../content/upgradeCatalog";
import { MARINE } from "../hero/marine";

const capacities: Record<UpgradeCategory, number> = {
  offensive: 2,
  defensive: 1,
  support: 1,
  scavenger: 1,
};

describe("upgrade eligibility planning", () => {
  it("counts only owned upgrades in the requested category", () => {
    const levels = new Map<UpgradeId, number>([["rapid-cycling", 1], ["composite-plating", 1], ["twin-shot", 0]]);
    expect(usedUpgradeSlots("offensive", levels)).toBe(1);
    expect(usedUpgradeSlots("defensive", levels)).toBe(1);
  });

  it("enforces max level, exclusions, and new-upgrade slot capacity", () => {
    expect(isUpgradeEligibleForRun({ id: "rapid-cycling", upgradeLevels: new Map([["rapid-cycling", 3]]), slotCapacity: capacities })).toBe(false);
    expect(isUpgradeEligibleForRun({ id: "cryo-coating", upgradeLevels: new Map([["incendiary-rounds", 1]]), slotCapacity: capacities })).toBe(false);
    const fullOffence = new Map<UpgradeId, number>([["rapid-cycling", 1], ["twin-shot", 1]]);
    expect(isUpgradeEligibleForRun({ id: "piercing-rounds", upgradeLevels: fullOffence, slotCapacity: capacities })).toBe(false);
    expect(isUpgradeEligibleForRun({ id: "rapid-cycling", upgradeLevels: fullOffence, slotCapacity: capacities })).toBe(true);
  });
});

describe("deterministic upgrade decision", () => {
  it("keeps the spread-by-two scan and appends one stat card", () => {
    expect(upgradeScanOffsets(6)).toEqual([0, 2, 4, 1, 3, 5]);
    const decision = planUpgradeDecision({ level: 2, upgradeLevels: new Map(), slotCapacity: capacities });
    expect(decision?.kind).toBe("upgrade");
    expect(decision?.options).toHaveLength(4);
    expect(decision?.options[3]?.id).toMatch(/^lvl-/);
  });

  it("returns null when every upgrade is maxed", () => {
    const maxed = new Map<UpgradeId, number>();
    for (const id of [
      "rapid-cycling", "twin-shot", "piercing-rounds", "explosive-payload", "heavy-calibre", "field-magnet",
      "incendiary-rounds", "cryo-coating", "chain-lightning", "adrenal-servos", "composite-plating",
      "shield-capacitor", "corrosive-rounds", "catalyst-array", "marksman-barrels", "reactive-plating",
      "kinetic-buffer", "capacitor-array", "field-transfusion", "salvage-drones",
    ] as UpgradeId[]) maxed.set(id, 99);
    expect(planUpgradeDecision({ level: 2, upgradeLevels: maxed, slotCapacity: capacities })).toBeNull();
  });
});

describe("deterministic level-stat planning", () => {
  it("selects the indexed card and builds four unique cards without RNG", () => {
    expect(levelStatCardForLevel(2, 0)?.id).toBe("lvl-damage");
    const decision = planLevelStatDecision({ level: 2 });
    expect(decision.kind).toBe("level-stat");
    expect(decision.options).toHaveLength(4);
    expect(new Set(decision.options.map((option) => option.id)).size).toBe(4);
  });
});

describe("level-up transaction planning", () => {
  it("routes stat cards, advances upgrades, and rejects unknown ids", () => {
    const levels = new Map<UpgradeId, number>([["rapid-cycling", 1]]);
    expect(planLevelUpChoice("lvl-damage", levels)).toEqual({ kind: "stat-card", cardId: "lvl-damage" });
    expect(planLevelUpChoice("rapid-cycling", levels)).toEqual({
      kind: "upgrade",
      upgradeId: "rapid-cycling",
      nextLevel: 2,
    });
    expect(planLevelUpChoice("not-authored", levels)).toEqual({ kind: "none" });
  });

  it("plans an immutable stat grant and rejects unknown cards", () => {
    const currentStats = { damagePercent: 5, armourFlat: 2 };
    const plan = planLevelStatGrant({ cardId: "lvl-damage", currentStats });
    expect(plan).toEqual({
      statKey: "damagePercent",
      amount: 5,
      nextStats: { damagePercent: 10, armourFlat: 2 },
    });
    expect(currentStats.damagePercent).toBe(5);
    expect(planLevelStatGrant({ cardId: "not-authored", currentStats })).toBeNull();
  });

  it("blocks while a decision is pending or XP is short", () => {
    const base = { level: 1, experience: 10, upgradeLevels: new Map<UpgradeId, number>(), slotCapacity: capacities };
    expect(planLevelUpAdvance({ ...base, hasPendingDecision: true })).toBeNull();
    expect(planLevelUpAdvance({ ...base, experience: 9, hasPendingDecision: false })).toBeNull();
  });

  it("spends one threshold, advances one level, and queues the next-level draw", () => {
    const plan = planLevelUpAdvance({
      level: 1,
      experience: 25,
      hasPendingDecision: false,
      upgradeLevels: new Map(),
      slotCapacity: capacities,
    });
    expect(plan?.nextLevel).toBe(2);
    expect(plan?.remainingExperience).toBe(15);
    expect(plan?.decision.kind).toBe("upgrade");
    expect(plan?.decision.options[0]?.id).toBe(planUpgradeDecision({
      level: 2,
      upgradeLevels: new Map(),
      slotCapacity: capacities,
    })?.options[0]?.id);
  });
});

describe("progression value planning", () => {
  it("preserves fractional multiplied XP as carry", () => {
    const fractional = planExperienceAward({ amount: 3, currentExperience: 8, carry: 0.4, multiplier: 1.25 });
    expect(fractional).toMatchObject({
      awardedExperience: 4,
      nextExperience: 12,
    });
    expect(fractional.nextCarry).toBeCloseTo(0.15);
    expect(planExperienceAward({ amount: -5, currentExperience: 8, carry: 0.4, multiplier: 2 })).toEqual({
      awardedExperience: 0,
      nextExperience: 8,
      nextCarry: 0.4,
    });
  });

  it("plans the hero growth delta and proficiency points for the new level", () => {
    expect(planHeroLevelGrowth({ hero: MARINE, level: 2 })).toEqual({
      maxHealthBonus: 1,
      healthGain: 1,
      armourGain: 0.5,
      damageMultiplier: 1.02,
      speedMultiplier: 1.015,
      supportMultiplier: 1,
      weaponProficiencies: { light: 1, medium: 0, heavy: 0, unique: 0 },
    });
  });
});
