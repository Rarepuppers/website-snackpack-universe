import type { Vector2Data } from "../math/Vector2Data";

/**
 * What an extracted enemy behaviour wants to do this tick, without knowing how
 * movement resolves. The simulation owns collision, separation steering, status
 * speed multipliers, and the arena — a behaviour module states intent only.
 *
 * The distinction between `toward-player` and `fixed` is load-bearing:
 * `toward-player` blends in separation steering from the enemy's steering
 * profile, `fixed` does not. Collapsing them would quietly change how packs
 * bunch up.
 */
export type EnemyMovementIntent =
  | { readonly kind: "none" }
  | { readonly kind: "toward-player"; readonly speedMetresPerSecond: number }
  | {
      readonly kind: "fixed";
      readonly direction: Vector2Data;
      readonly speedMetresPerSecond: number;
    };

export const NO_MOVEMENT: EnemyMovementIntent = Object.freeze({ kind: "none" });

export function towardPlayer(speedMetresPerSecond: number): EnemyMovementIntent {
  return { kind: "toward-player", speedMetresPerSecond };
}

export function fixedDirection(
  direction: Vector2Data,
  speedMetresPerSecond: number,
): EnemyMovementIntent {
  return { kind: "fixed", direction, speedMetresPerSecond };
}
