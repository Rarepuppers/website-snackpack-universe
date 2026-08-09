import type { Vector2Data } from "../math/Vector2Data";

export interface ProjectileVolleyShot {
  readonly direction: Vector2Data;
  readonly muzzlePosition: Vector2Data;
}

/**
 * Pure geometry for the ordinary projectile branch of fireWeapon. Runtime
 * mutation, projectile allocation, gravity-pulse cadence, damage modifiers,
 * and event emission deliberately remain with CombatSimulation.
 */
export function planProjectileVolley(input: {
  readonly anchor: Vector2Data;
  readonly aimDirection: Vector2Data;
  readonly projectileCount: number;
  readonly spreadRadians: number;
  readonly muzzleOffsetMetres?: number;
}): readonly ProjectileVolleyShot[] {
  const baseAngle = Math.atan2(input.aimDirection.y, input.aimDirection.x);
  const centre = (input.projectileCount - 1) / 2;
  const muzzleOffsetMetres = input.muzzleOffsetMetres ?? 0.55;
  return Array.from({ length: input.projectileCount }, (_, index) => {
    const angle = baseAngle + (index - centre) * input.spreadRadians;
    const direction = { x: Math.cos(angle), y: Math.sin(angle) };
    return {
      direction,
      muzzlePosition: {
        x: input.anchor.x + direction.x * muzzleOffsetMetres,
        y: input.anchor.y + direction.y * muzzleOffsetMetres,
      },
    };
  });
}
