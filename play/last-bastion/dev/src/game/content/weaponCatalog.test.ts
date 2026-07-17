import { describe, expect, it } from "vitest";
import { VERTICAL_SLICE_WEAPON_IDS, WEAPON_CATALOG } from "./weaponCatalog";

describe("weaponCatalog", () => {
  it("locks the three vertical-slice weapon families", () => {
    expect(VERTICAL_SLICE_WEAPON_IDS).toEqual([
      "bastion-service-rifle", "scattergun", "arc-carbine",
    ]);
    expect(Object.keys(WEAPON_CATALOG)).toHaveLength(7);
  });

  it("gives each family a distinct attack contract", () => {
    expect(WEAPON_CATALOG["bastion-service-rifle"].attackPattern).toBe("projectile");
    expect(WEAPON_CATALOG.scattergun.projectileCount).toBe(5);
    expect(WEAPON_CATALOG.scattergun.knockbackMetres).toBeGreaterThan(0);
    expect(WEAPON_CATALOG["arc-carbine"].targetingMode).toBe("nearest-enemy");
    expect(WEAPON_CATALOG["arc-carbine"].chainCount).toBe(1);
    expect(WEAPON_CATALOG["patrol-blade"].attackPattern).toBe("melee-sweep");
    expect(WEAPON_CATALOG["patrol-blade"].firesAutomatically).toBe(true);
    expect(WEAPON_CATALOG["patrol-blade"].fireIntervalSeconds).toBe(2.5);
    expect(WEAPON_CATALOG["bolt-carbine"].targetingMode).toBe("cursor");
    expect(WEAPON_CATALOG["bolt-carbine"].pierceCount).toBe(1);
    expect(WEAPON_CATALOG["bolt-carbine"].fireIntervalSeconds).toBe(1.8);
    expect(WEAPON_CATALOG["bulwark-rotary-cannon"].fireIntervalSeconds).toBe(0.09);
    expect(WEAPON_CATALOG["bulwark-rotary-cannon"].weaponClass).toBe("heavy");
    expect(WEAPON_CATALOG["grenade-tube"].explosionRadiusMetres).toBe(2.2);
    expect(WEAPON_CATALOG["grenade-tube"].projectileSpeedMetresPerSecond).toBe(8);
  });
});
