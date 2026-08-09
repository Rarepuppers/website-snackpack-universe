import { describe, expect, it } from "vitest";
import { WEAPON_CATALOG } from "../content/weaponCatalog";
import { planOrdinaryProjectilePayload } from "./WeaponProjectilePayload";

describe("WeaponProjectilePayload", () => {
  it("applies runtime speed, damage, range, and explosion multipliers once", () => {
    const stats = WEAPON_CATALOG["grenade-tube"];
    const payload = planOrdinaryProjectilePayload({
      stats,
      muzzlePosition: { x: 2, y: 3 },
      direction: { x: 0.6, y: 0.8 },
      projectileSpeedMultiplier: 1.25,
      damageMultiplier: 1.5,
      rangeMultiplier: 0.8,
      relicExplosionRadiusMultiplier: 1.1,
      transformationExplosionRadiusMultiplier: 1.2,
      triggersGravityPulse: true,
    });
    expect(payload).toMatchObject({
      weaponId: "grenade-tube",
      position: { x: 2, y: 3 },
      damage: stats.projectileDamage * 1.5,
      remainingSeconds: stats.projectileLifetimeSeconds * 0.8,
      explosionRadiusMetres: stats.explosionRadiusMetres * 1.1 * 1.2,
      triggersGravityPulse: true,
    });
    expect(payload.velocity).toEqual({
      x: 0.6 * stats.projectileSpeedMetresPerSecond * 1.25,
      y: 0.8 * stats.projectileSpeedMetresPerSecond * 1.25,
    });
  });

  it("carries homing, chain, and gravity-well authored fields without mutation", () => {
    const stats = WEAPON_CATALOG["event-horizon"];
    const payload = planOrdinaryProjectilePayload({
      stats,
      muzzlePosition: { x: 0, y: 0 },
      direction: { x: 1, y: 0 },
      projectileSpeedMultiplier: 1,
      damageMultiplier: 1,
      rangeMultiplier: 1,
      relicExplosionRadiusMultiplier: 1,
      transformationExplosionRadiusMultiplier: 1,
      triggersGravityPulse: false,
    });
    expect(payload).toMatchObject({
      chainRemaining: stats.chainCount,
      chainRadiusMetres: stats.chainRadiusMetres,
      homingTurnRateRadiansPerSecond: stats.homingTurnRateRadiansPerSecond,
      spawnsGravityWellOnImpact: true,
      pullFieldDurationSeconds: stats.pullFieldDurationSeconds,
      pullStrengthMetresPerSecond: stats.pullStrengthMetresPerSecond,
      pullRadiusMetres: stats.pullRadiusMetres,
    });
  });
});
