import type { WeaponRuntimeStats } from "../content/weaponCatalog";
import { normalizeVector, type Vector2Data } from "../math/Vector2Data";

type DeployableProjectileStats = Pick<WeaponRuntimeStats,
  | "id" | "damageType" | "projectileSpeedMetresPerSecond" | "projectileLifetimeSeconds"
  | "pierceCount" | "explosionRadiusMetres" | "knockbackMetres"
  | "chainCount" | "chainRadiusMetres" | "homingTurnRateRadiansPerSecond"
>;

export interface DeployableProjectilePlan {
  readonly direction: Vector2Data;
  readonly payload: {
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
    readonly spawnsGravityWellOnImpact: false;
    readonly pullFieldDurationSeconds: 0;
    readonly pullStrengthMetresPerSecond: 0;
    readonly pullRadiusMetres: 0;
  };
}

/** Pure deployable aim and shot payload. Mutable hit tracking and allocation stay simulation-owned. */
export function planDeployableProjectile(input: {
  readonly stats: DeployableProjectileStats;
  readonly position: Vector2Data;
  readonly targetPosition: Vector2Data;
  readonly shotDamage: number;
}): DeployableProjectilePlan {
  const direction = normalizeVector({
    x: input.targetPosition.x - input.position.x,
    y: input.targetPosition.y - input.position.y,
  });
  return {
    direction,
    payload: {
      weaponId: input.stats.id,
      damageType: input.stats.damageType,
      position: { ...input.position },
      velocity: {
        x: direction.x * input.stats.projectileSpeedMetresPerSecond,
        y: direction.y * input.stats.projectileSpeedMetresPerSecond,
      },
      damage: input.shotDamage,
      uraniumEligible: true,
      remainingSeconds: input.stats.projectileLifetimeSeconds,
      pierceRemaining: input.stats.pierceCount,
      explosionRadiusMetres: input.stats.explosionRadiusMetres,
      knockbackMetres: input.stats.knockbackMetres,
      chainRemaining: input.stats.chainCount,
      chainRadiusMetres: input.stats.chainRadiusMetres,
      homingTurnRateRadiansPerSecond: input.stats.homingTurnRateRadiansPerSecond,
      spawnsGravityWellOnImpact: false,
      pullFieldDurationSeconds: 0,
      pullStrengthMetresPerSecond: 0,
      pullRadiusMetres: 0,
    },
  };
}
