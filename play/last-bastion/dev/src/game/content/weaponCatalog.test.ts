import { describe, expect, it } from "vitest";
import { shouldWeaponFire, VERTICAL_SLICE_WEAPON_IDS, WEAPON_CATALOG, WEAPON_CHEST_POOL } from "./weaponCatalog";

describe("weaponCatalog", () => {
  it("locks the three vertical-slice weapon families", () => {
    expect(VERTICAL_SLICE_WEAPON_IDS).toEqual([
      "bastion-service-rifle", "scattergun", "arc-carbine",
    ]);
    expect(Object.keys(WEAPON_CATALOG)).toHaveLength(14);
  });

  it("holds every Phase 4 weapon out of the chest pool until its art batch lands (24 July 2026)", () => {
    expect(WEAPON_CATALOG.railspike).toBeDefined();
    expect(WEAPON_CATALOG.railspike.pierceCount).toBeGreaterThanOrEqual(6);
    expect(WEAPON_CHEST_POOL).not.toContain("railspike");

    expect(WEAPON_CATALOG["seeker-swarm"]).toBeDefined();
    expect(WEAPON_CATALOG["seeker-swarm"].homingTurnRateRadiansPerSecond).toBeGreaterThan(0);
    expect(WEAPON_CHEST_POOL).not.toContain("seeker-swarm");

    expect(WEAPON_CATALOG["cryo-lance"]).toBeDefined();
    expect(WEAPON_CATALOG["cryo-lance"].attackPattern).toBe("beam");
    expect(WEAPON_CATALOG["cryo-lance"].beamDamagePerSecond).toBeGreaterThan(0);
    expect(WEAPON_CHEST_POOL).not.toContain("cryo-lance");

    expect(WEAPON_CATALOG["tesla-coil"]).toBeDefined();
    expect(WEAPON_CATALOG["tesla-coil"].attackPattern).toBe("orbit");
    expect(WEAPON_CATALOG["tesla-coil"].chainCount).toBeGreaterThan(0);
    expect(WEAPON_CHEST_POOL).not.toContain("tesla-coil");

    expect(WEAPON_CATALOG.flamethrower).toBeDefined();
    expect(WEAPON_CATALOG.flamethrower.attackPattern).toBe("beam");
    expect(WEAPON_CATALOG.flamethrower.meleeArcRadians).toBeGreaterThan(WEAPON_CATALOG["cryo-lance"].meleeArcRadians);
    expect(WEAPON_CHEST_POOL).not.toContain("flamethrower");

    expect(WEAPON_CATALOG.sawblade).toBeDefined();
    expect(WEAPON_CATALOG.sawblade.attackPattern).toBe("orbit-blade");
    expect(WEAPON_CATALOG.sawblade.orbitRadiusMetres).toBeGreaterThan(0);
    expect(WEAPON_CHEST_POOL).not.toContain("sawblade");
  });

  it("gives each family a distinct attack contract", () => {
    expect(WEAPON_CATALOG["bastion-service-rifle"].attackPattern).toBe("projectile");
    expect(WEAPON_CATALOG.scattergun.projectileCount).toBe(5);
    expect(WEAPON_CATALOG.scattergun.knockbackMetres).toBeGreaterThan(0);
    expect(WEAPON_CATALOG["arc-carbine"].targetingMode).toBe("nearest-enemy");
    expect(WEAPON_CATALOG["arc-carbine"].chainCount).toBe(1);
    expect(WEAPON_CATALOG["arc-carbine"].firesAutomatically).toBe(true);
    expect(WEAPON_CATALOG["patrol-blade"].attackPattern).toBe("melee-sweep");
    expect(WEAPON_CATALOG["patrol-blade"].firesAutomatically).toBe(true);
    expect(WEAPON_CATALOG["patrol-blade"].fireIntervalSeconds).toBe(2.5);
    expect(WEAPON_CATALOG["bolt-carbine"].targetingMode).toBe("cursor");
    expect(WEAPON_CATALOG["bolt-carbine"].pierceCount).toBe(1);
    expect(WEAPON_CATALOG["bolt-carbine"].fireIntervalSeconds).toBe(1.8);
    expect(WEAPON_CATALOG["bulwark-rotary-cannon"].fireIntervalSeconds).toBe(0.08);
    expect(WEAPON_CATALOG["bulwark-rotary-cannon"].weaponClass).toBe("heavy");
    expect(WEAPON_CATALOG["grenade-tube"].explosionRadiusMetres).toBe(2.2);
    expect(WEAPON_CATALOG["grenade-tube"].projectileSpeedMetresPerSecond).toBe(8);
    expect(WEAPON_CATALOG["grenade-tube"].fireIntervalSeconds).toBe(4);
  });

  it("makes Manual mode trigger-owned except for autonomous support weapons", () => {
    const rifle = WEAPON_CATALOG["bastion-service-rifle"];
    const arc = WEAPON_CATALOG["arc-carbine"];
    expect(shouldWeaponFire(rifle, true, false)).toBe(true);
    expect(shouldWeaponFire(rifle, false, false)).toBe(false);
    expect(shouldWeaponFire(rifle, false, true)).toBe(true);
    expect(shouldWeaponFire(arc, false, false)).toBe(true);
  });
});
