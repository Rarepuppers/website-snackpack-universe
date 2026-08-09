import { describe, expect, it } from "vitest";
import { WEAPON_CATALOG } from "../content/weaponCatalog";
import { planStructurePlacement } from "./DeployablePlacement";

describe("DeployablePlacement", () => {
  it("scales structure durability, lifetime, damage, and forward placement", () => {
    const stats = WEAPON_CATALOG["sentry-stake"];
    expect(planStructurePlacement({
      stats,
      existingDeployables: [],
      anchor: { x: 4, y: 5 },
      direction: { x: 1, y: 0 },
      widthMetres: 20,
      heightMetres: 12,
      engineeringScale: 1.5,
      weaponDamageMultiplier: 1.25,
    })).toEqual({
      retireDeployableId: null,
      position: { x: 5.2, y: 5 },
      health: stats.deployHealth * 1.5,
      remainingSeconds: stats.deployLifetimeSeconds * 1.5,
      shotDamage: stats.projectileDamage * 1.25,
    });
  });

  it("retires the oldest live same-weapon unit at cap and clamps arena edges", () => {
    const stats = WEAPON_CATALOG["sentry-stake"];
    const result = planStructurePlacement({
      stats,
      existingDeployables: [
        { id: 8, weaponId: "sentry-stake", dead: true },
        { id: 9, weaponId: "auxiliary-drone", dead: false },
        { id: 10, weaponId: "sentry-stake", dead: false },
        { id: 11, weaponId: "sentry-stake", dead: false },
      ],
      anchor: { x: 9.8, y: 0.2 },
      direction: { x: 1, y: -1 },
      widthMetres: 10,
      heightMetres: 8,
      engineeringScale: 1,
      weaponDamageMultiplier: 1,
    });
    expect(result.retireDeployableId).toBe(10);
    expect(result.position).toEqual({ x: 9.4, y: 0.6 });
  });
});
