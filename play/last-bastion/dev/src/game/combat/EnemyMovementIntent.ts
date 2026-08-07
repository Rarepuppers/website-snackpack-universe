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
    }
  /**
   * Hold a preferred engagement band — advance when too far, back off when too
   * close, stand still (and just face the player) when comfortable. The band,
   * the speed, and the 1.15x retreat bonus all come from the enemy's steering
   * profile, so only the simulation can resolve it.
   */
  | { readonly kind: "range-band" };

/**
 * The two-phase contract every extracted behaviour follows.
 *
 * Most of these state machines move first and only then test the resulting
 * position — "did the charge reach the player", "is the mite close enough to
 * arm", "am I far enough away to warp". Folding that into one function forces
 * the test onto the *pre*-movement position, which changes transitions by a
 * tick and, because the simulation shares one seeded generator, shifts the RNG
 * sequence for the rest of the run.
 *
 * So each module exports:
 *   1. `stepX(state, input)` — advance timers, decide movement intent. No
 *      position-dependent transitions.
 *   2. `resolveXAfterMovement(state, ...)` — the position-dependent part, which
 *      the simulation calls once it has applied the movement.
 *
 * A behaviour with no position-dependent transition exports only the first.
 * Any RNG the behaviour needs arrives as a `() => number` callback so draws
 * happen on exactly the ticks they happened on before, never every tick.
 */
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

export const HOLD_RANGE_BAND: EnemyMovementIntent = Object.freeze({ kind: "range-band" });
