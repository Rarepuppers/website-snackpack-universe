import { describe, expect, it } from "vitest";
import type { WeaponAttackPattern } from "../content/weaponCatalog";
import { planWeaponFire } from "./WeaponFirePlan";

describe("WeaponFirePlan", () => {
  it("places a single weapon ring anchor on the current aim angle", () => {
    const plan = planWeaponFire({
      equippedWeaponCount: 1,
      weaponIndex: 0,
      playerPosition: { x: 4, y: 5 },
      aimDirection: { x: 0, y: 1 },
      attackPattern: "projectile",
    });
    expect(plan.kind).toBe("ordinary-projectile");
    expect(plan.anchor.x).toBeCloseTo(4);
    expect(plan.anchor.y).toBeCloseTo(5.82);
  });

  it("uses the indexed multi-weapon ring slot and safely falls back for a missing index", () => {
    expect(planWeaponFire({
      equippedWeaponCount: 4,
      weaponIndex: 1,
      playerPosition: { x: 2, y: 3 },
      aimDirection: { x: 1, y: 0 },
      attackPattern: "beam",
    }).anchor).toEqual({ x: 2.82, y: 3 });
    expect(planWeaponFire({
      equippedWeaponCount: 0,
      weaponIndex: -1,
      playerPosition: { x: 2, y: 3 },
      aimDirection: { x: 1, y: 0 },
      attackPattern: "beam",
    }).anchor).toEqual({ x: 2, y: 3 });
  });

  it.each<[WeaponAttackPattern, string]>([
    ["scatter", "ordinary-projectile"],
    ["chain-projectile", "ordinary-projectile"],
    ["melee-sweep", "melee-sweep"],
    ["beam", "beam"],
    ["orbit", "orbit"],
    ["orbit-blade", "orbit-blade"],
    ["deployable", "deployable"],
  ])("routes %s to %s", (attackPattern, expected) => {
    expect(planWeaponFire({
      equippedWeaponCount: 1,
      weaponIndex: 0,
      playerPosition: { x: 0, y: 0 },
      aimDirection: { x: 1, y: 0 },
      attackPattern,
    }).kind).toBe(expected);
  });
});
