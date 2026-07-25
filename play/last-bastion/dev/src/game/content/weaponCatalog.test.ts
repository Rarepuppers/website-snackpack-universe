import { describe, expect, it } from "vitest";
import { HELD_WEAPONS_IN_POOL, shouldWeaponFire, VERTICAL_SLICE_WEAPON_IDS, WEAPON_CATALOG, WEAPON_CHEST_POOL } from "./weaponCatalog";

describe("weaponCatalog", () => {
  it("locks the three vertical-slice weapon families", () => {
    expect(VERTICAL_SLICE_WEAPON_IDS).toEqual([
      "bastion-service-rifle", "scattergun", "arc-carbine",
    ]);
    expect(Object.keys(WEAPON_CATALOG)).toHaveLength(15);
  });

  it("keeps each Phase 4 weapon's contract, and its pool membership in step with the art gate", () => {
    // Flag-aware on purpose: this used to hard-assert "held", which meant art
    // day required editing the test as well as the flag. Now the flip really is
    // one constant, and the tripwire still fires if the pool drifts from it.
    const expectPoolMembership = (id: Parameters<typeof WEAPON_CHEST_POOL.includes>[0]): void => {
      if (HELD_WEAPONS_IN_POOL) expect(WEAPON_CHEST_POOL).toContain(id);
      else expect(WEAPON_CHEST_POOL).not.toContain(id);
    };
    expect(WEAPON_CATALOG.railspike).toBeDefined();
    expect(WEAPON_CATALOG.railspike.pierceCount).toBeGreaterThanOrEqual(6);
    expectPoolMembership("railspike");

    expect(WEAPON_CATALOG["seeker-swarm"]).toBeDefined();
    expect(WEAPON_CATALOG["seeker-swarm"].homingTurnRateRadiansPerSecond).toBeGreaterThan(0);
    expectPoolMembership("seeker-swarm");

    expect(WEAPON_CATALOG["cryo-lance"]).toBeDefined();
    expect(WEAPON_CATALOG["cryo-lance"].attackPattern).toBe("beam");
    expect(WEAPON_CATALOG["cryo-lance"].beamDamagePerSecond).toBeGreaterThan(0);
    expectPoolMembership("cryo-lance");

    expect(WEAPON_CATALOG["tesla-coil"]).toBeDefined();
    expect(WEAPON_CATALOG["tesla-coil"].attackPattern).toBe("orbit");
    expect(WEAPON_CATALOG["tesla-coil"].chainCount).toBeGreaterThan(0);
    expectPoolMembership("tesla-coil");

    expect(WEAPON_CATALOG.flamethrower).toBeDefined();
    expect(WEAPON_CATALOG.flamethrower.attackPattern).toBe("beam");
    expect(WEAPON_CATALOG.flamethrower.meleeArcRadians).toBeGreaterThan(WEAPON_CATALOG["cryo-lance"].meleeArcRadians);
    expectPoolMembership("flamethrower");

    expect(WEAPON_CATALOG.sawblade).toBeDefined();
    expect(WEAPON_CATALOG.sawblade.attackPattern).toBe("orbit-blade");
    expect(WEAPON_CATALOG.sawblade.orbitRadiusMetres).toBeGreaterThan(0);
    expectPoolMembership("sawblade");

    expect(WEAPON_CATALOG["event-horizon"]).toBeDefined();
    expect(WEAPON_CATALOG["event-horizon"].weaponClass).toBe("unique");
    expect(WEAPON_CATALOG["event-horizon"].spawnsGravityWellOnImpact).toBe(true);
    // Stays out in BOTH states: there is still no Unique-slot acquisition path.
    expect(WEAPON_CHEST_POOL).not.toContain("event-horizon");
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
