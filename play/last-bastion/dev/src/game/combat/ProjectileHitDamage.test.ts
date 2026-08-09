import { describe, expect, it } from "vitest";
import { composeProjectileHitDamage } from "./ProjectileHitDamage";

describe("ProjectileHitDamage", () => {
  it("composes armour, uranium, mark, range, and crit modifiers in authored order", () => {
    expect(composeProjectileHitDamage({
      baseDamage: 20,
      projectileDamageMultiplier: 0.25,
      powerupDamageMultiplier: 1.5,
      eliteMarkDamageMultiplier: 1.2,
      rangeDamageMultiplier: 0.8,
      critMultiplier: 2,
    })).toBeCloseTo(14.4);
  });

  it("preserves an unmodified direct hit", () => {
    expect(composeProjectileHitDamage({
      baseDamage: 17,
      projectileDamageMultiplier: 1,
      powerupDamageMultiplier: 1,
      eliteMarkDamageMultiplier: 1,
      rangeDamageMultiplier: 1,
      critMultiplier: 1,
    })).toBe(17);
  });
});
