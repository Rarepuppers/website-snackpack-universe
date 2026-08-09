import { describe, expect, it } from "vitest";
import { WEAPON_CATALOG } from "../content/weaponCatalog";
import { planDeployableProjectile } from "./DeployableProjectilePayload";

describe("DeployableProjectilePayload", () => {
  it("aims from the moved unit position and carries authored projectile fields", () => {
    const stats = WEAPON_CATALOG["sentry-stake"];
    const result = planDeployableProjectile({
      stats,
      position: { x: 2, y: 3 },
      targetPosition: { x: 5, y: 7 },
      shotDamage: 6.5,
    });
    expect(result.direction).toEqual({ x: 0.6, y: 0.8 });
    expect(result.payload).toMatchObject({
      weaponId: "sentry-stake",
      position: { x: 2, y: 3 },
      velocity: {
        x: 0.6 * stats.projectileSpeedMetresPerSecond,
        y: 0.8 * stats.projectileSpeedMetresPerSecond,
      },
      damage: 6.5,
      remainingSeconds: stats.projectileLifetimeSeconds,
      pierceRemaining: stats.pierceCount,
    });
  });

  it("keeps deployable shots gravity-well-free even for a structurally compatible payload", () => {
    const result = planDeployableProjectile({
      stats: WEAPON_CATALOG["auxiliary-drone"],
      position: { x: 1, y: 1 },
      targetPosition: { x: 1, y: 1 },
      shotDamage: 2,
    });
    expect(result.direction).toEqual({ x: 0, y: 0 });
    expect(result.payload).toMatchObject({
      spawnsGravityWellOnImpact: false,
      pullFieldDurationSeconds: 0,
      pullStrengthMetresPerSecond: 0,
      pullRadiusMetres: 0,
    });
  });
});
