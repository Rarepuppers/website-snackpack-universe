import type { WeaponRuntimeStats } from "../content/weaponCatalog";
import type { Vector2Data } from "../math/Vector2Data";

type ProjectilePayloadStats = Pick<WeaponRuntimeStats,
  | "id" | "damageType" | "projectileSpeedMetresPerSecond" | "projectileDamage"
  | "projectileLifetimeSeconds" | "pierceCount" | "explosionRadiusMetres"
  | "knockbackMetres" | "chainCount" | "chainRadiusMetres"
  | "homingTurnRateRadiansPerSecond" | "spawnsGravityWellOnImpact"
  | "pullFieldDurationSeconds" | "pullStrengthMetresPerSecond" | "pullRadiusMetres"
>;

export interface OrdinaryProjectilePayload {
  readonly weaponId: WeaponRuntimeStats["id"];
  readonly damageType: WeaponRuntimeStats["damageType"];
  readonly position: Vector2Data;
  readonly velocity: Vector2Data;
  readonly damage: number;
  readonly uraniumEligible: true;
  readonly remainingSeconds: number;
  readonly pierceRemaining: number;
  readonly explosionRadiusMetres: number;
  readonly knockbackMetres: number;
  readonly chainRemaining: number;
  readonly chainRadiusMetres: number;
  readonly homingTurnRateRadiansPerSecond: number;
  readonly spawnsGravityWellOnImpact: boolean;
  readonly pullFieldDurationSeconds: number;
  readonly pullStrengthMetresPerSecond: number;
  readonly pullRadiusMetres: number;
  readonly triggersGravityPulse: boolean;
}

/** Pure payload construction; allocation and the mutable hit set stay simulation-owned. */
export function planOrdinaryProjectilePayload(input: {
  readonly stats: ProjectilePayloadStats;
  readonly muzzlePosition: Vector2Data;
  readonly direction: Vector2Data;
  readonly projectileSpeedMultiplier: number;
  readonly damageMultiplier: number;
  readonly rangeMultiplier: number;
  readonly relicExplosionRadiusMultiplier: number;
  readonly transformationExplosionRadiusMultiplier: number;
  readonly triggersGravityPulse: boolean;
}): OrdinaryProjectilePayload {
  const { stats } = input;
  return {
    weaponId: stats.id,
    damageType: stats.damageType,
    position: { ...input.muzzlePosition },
    velocity: {
      x: input.direction.x * stats.projectileSpeedMetresPerSecond * input.projectileSpeedMultiplier,
      y: input.direction.y * stats.projectileSpeedMetresPerSecond * input.projectileSpeedMultiplier,
    },
    damage: stats.projectileDamage * input.damageMultiplier,
    uraniumEligible: true,
    remainingSeconds: stats.projectileLifetimeSeconds * input.rangeMultiplier,
    pierceRemaining: stats.pierceCount,
    explosionRadiusMetres: stats.explosionRadiusMetres
      * input.relicExplosionRadiusMultiplier * input.transformationExplosionRadiusMultiplier,
    knockbackMetres: stats.knockbackMetres,
    chainRemaining: stats.chainCount,
    chainRadiusMetres: stats.chainRadiusMetres,
    homingTurnRateRadiansPerSecond: stats.homingTurnRateRadiansPerSecond,
    spawnsGravityWellOnImpact: stats.spawnsGravityWellOnImpact,
    pullFieldDurationSeconds: stats.pullFieldDurationSeconds,
    pullStrengthMetresPerSecond: stats.pullStrengthMetresPerSecond,
    pullRadiusMetres: stats.pullRadiusMetres,
    triggersGravityPulse: input.triggersGravityPulse,
  };
}
