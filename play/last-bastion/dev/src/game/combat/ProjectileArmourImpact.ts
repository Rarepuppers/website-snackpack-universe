import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";

export interface ProjectileArmourImpactPlan {
  readonly damageMultiplier: number;
  readonly emitsArmourHit: boolean;
}

/** Plans Carapace Scuttler frontal armour response without emitting presentation events. */
export function planProjectileArmourImpact(input: {
  readonly eliteKind: string | null | undefined;
  readonly carapacePhase: string | undefined;
  readonly projectileVelocity: Vector2Data;
  readonly enemyFacingDirection: Vector2Data;
}): ProjectileArmourImpactPlan {
  if (input.eliteKind !== "carapace-scuttler" || input.carapacePhase === "recovery") {
    return { damageMultiplier: 1, emitsArmourHit: false };
  }
  const directionToShooter = normalizeVector({
    x: -input.projectileVelocity.x,
    y: -input.projectileVelocity.y,
  });
  const frontalDot = directionToShooter.x * input.enemyFacingDirection.x
    + directionToShooter.y * input.enemyFacingDirection.y;
  return frontalDot > 0.25
    ? { damageMultiplier: 0.25, emitsArmourHit: true }
    : { damageMultiplier: 1, emitsArmourHit: false };
}
