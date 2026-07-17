import { describe, expect, it } from "vitest";
import {
  MAX_EQUIPPED_WEAPONS,
  clampWeaponCount,
  createServiceRifleLoadout,
  createWeaponLoadout,
} from "./WeaponLoadout";

describe("WeaponLoadout", () => {
  it.each([0, 1, 4, 6, 12])("creates a stable %i-weapon loadout", (count) => {
    const loadout = createServiceRifleLoadout(count);

    expect(loadout).toHaveLength(count);
    expect(loadout.map((weapon) => weapon.instanceId)).toEqual(
      Array.from({ length: count }, (_, index) => index + 1),
    );
  });

  it("gives duplicate rifles independent runtime stats", () => {
    const loadout = createServiceRifleLoadout(2);
    loadout[0]!.stats.projectileDamage = 99;

    expect(loadout[1]!.stats.projectileDamage).not.toBe(99);
  });

  it("rejects loadouts beyond the twelve-weapon capacity", () => {
    expect(() => createServiceRifleLoadout(MAX_EQUIPPED_WEAPONS + 1)).toThrow(RangeError);
  });

  it("creates mixed weapon instances with isolated runtime stats", () => {
    const loadout = createWeaponLoadout(["bastion-service-rifle", "scattergun", "arc-carbine"]);
    expect(loadout.map((weapon) => weapon.weaponId)).toEqual([
      "bastion-service-rifle", "scattergun", "arc-carbine",
    ]);
    loadout[1]!.stats.projectileDamage = 999;
    expect(loadout[0]!.stats.projectileDamage).not.toBe(999);
    expect(loadout[2]!.stats.projectileDamage).not.toBe(999);
  });

  it("creates a standalone Patrol Blade behavior-lab loadout", () => {
    const loadout = createWeaponLoadout(["patrol-blade"]);
    expect(loadout[0]?.stats.attackPattern).toBe("melee-sweep");
    expect(loadout[0]?.stats.firesAutomatically).toBe(true);
  });

  it("creates a standalone Bolt Carbine behavior-lab loadout", () => {
    const loadout = createWeaponLoadout(["bolt-carbine"]);
    expect(loadout[0]?.stats.pierceCount).toBe(1);
    expect(loadout[0]?.stats.firesAutomatically).toBe(false);
  });

  it("creates production behavior-lab loadouts for rotary and explosive weapons", () => {
    const loadout = createWeaponLoadout(["bulwark-rotary-cannon", "grenade-tube"]);
    expect(loadout[0]?.stats.fireIntervalSeconds).toBeLessThan(0.1);
    expect(loadout[1]?.stats.explosionRadiusMetres).toBeGreaterThan(2);
  });

  it("clamps review parameters to the supported range", () => {
    expect(clampWeaponCount(-4)).toBe(0);
    expect(clampWeaponCount(99)).toBe(12);
    expect(clampWeaponCount(Number.NaN)).toBe(1);
  });
});
