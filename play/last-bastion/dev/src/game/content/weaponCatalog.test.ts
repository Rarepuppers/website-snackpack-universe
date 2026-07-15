import { describe, expect, it } from "vitest";
import { VERTICAL_SLICE_WEAPON_IDS, WEAPON_CATALOG } from "./weaponCatalog";

describe("weaponCatalog", () => {
  it("locks the three vertical-slice weapon families", () => {
    expect(VERTICAL_SLICE_WEAPON_IDS).toEqual([
      "bastion-service-rifle", "scattergun", "arc-carbine",
    ]);
    expect(Object.keys(WEAPON_CATALOG)).toHaveLength(3);
  });

  it("gives each family a distinct attack contract", () => {
    expect(WEAPON_CATALOG["bastion-service-rifle"].attackPattern).toBe("projectile");
    expect(WEAPON_CATALOG.scattergun.projectileCount).toBe(5);
    expect(WEAPON_CATALOG.scattergun.knockbackMetres).toBeGreaterThan(0);
    expect(WEAPON_CATALOG["arc-carbine"].targetingMode).toBe("nearest-enemy");
    expect(WEAPON_CATALOG["arc-carbine"].chainCount).toBe(1);
  });
});
