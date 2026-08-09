import { describe, expect, it } from "vitest";
import { composeWeaponHitDamage } from "./WeaponHitDamage";

describe("WeaponHitDamage", () => {
  it("composes every runtime hit modifier in authored order", () => {
    expect(composeWeaponHitDamage({
      baseDamage: 10,
      weaponDamageMultiplier: 1.5,
      powerupDamageMultiplier: 2,
      eliteMarkDamageMultiplier: 1.25,
      rangeDamageMultiplier: 0.8,
      critMultiplier: 2,
    })).toBe(60);
  });

  it("accepts beam tick and chain-falloff work in the caller-derived base", () => {
    const beamTickOrFallenChainDamage = 24 * 0.7;
    expect(composeWeaponHitDamage({
      baseDamage: beamTickOrFallenChainDamage,
      weaponDamageMultiplier: 1,
      powerupDamageMultiplier: 1,
      eliteMarkDamageMultiplier: 1,
      rangeDamageMultiplier: 1,
      critMultiplier: 1,
    })).toBe(beamTickOrFallenChainDamage);
  });
});
