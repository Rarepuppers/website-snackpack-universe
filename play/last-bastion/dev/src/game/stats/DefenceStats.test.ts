import { describe, expect, it } from "vitest";
import {
  absorbWithShield,
  armourDamageMultiplier,
  mitigateDamage,
  resolveSlowedMultiplier,
} from "./DefenceStats";

describe("DefenceStats", () => {
  it("gives percentage armour diminishing returns worth ~6% per early point", () => {
    expect(armourDamageMultiplier(0)).toBe(1);
    expect(1 - armourDamageMultiplier(1)).toBeCloseTo(0.0625);
    expect(1 - armourDamageMultiplier(15)).toBeCloseTo(0.5);
    expect(1 - armourDamageMultiplier(45)).toBeCloseTo(0.75);
    // Each additional point is worth less than the one before it.
    const firstPoint = armourDamageMultiplier(0) - armourDamageMultiplier(1);
    const tenthPoint = armourDamageMultiplier(9) - armourDamageMultiplier(10);
    expect(tenthPoint).toBeLessThan(firstPoint);
  });

  it("never lets negative armour amplify damage", () => {
    expect(armourDamageMultiplier(-5)).toBe(1);
  });

  it("applies flat reduction after percentage armour", () => {
    // 20 raw → 50% armour → 10 → flat 3 → 7.
    expect(mitigateDamage(20, 15, 3)).toBeCloseTo(7);
  });

  it("never reduces a positive hit below 1 damage", () => {
    expect(mitigateDamage(4, 15, 10)).toBe(1);
    expect(mitigateDamage(0, 15, 10)).toBe(0);
  });

  it("pulls slow multipliers back toward 1 with slow resistance", () => {
    expect(resolveSlowedMultiplier(0.55, 0)).toBeCloseTo(0.55);
    expect(resolveSlowedMultiplier(0.55, 0.5)).toBeCloseTo(0.775);
    expect(resolveSlowedMultiplier(0.55, 1)).toBeCloseTo(1);
  });

  it("absorbs raw damage with shields before health", () => {
    expect(absorbWithShield(25, 10)).toEqual({ remainingShield: 15, remainingDamage: 0 });
    expect(absorbWithShield(6, 10)).toEqual({ remainingShield: 0, remainingDamage: 4 });
    expect(absorbWithShield(0, 10)).toEqual({ remainingShield: 0, remainingDamage: 10 });
  });
});
