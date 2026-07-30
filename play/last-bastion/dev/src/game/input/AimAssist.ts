import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";

/**
 * Aim assist bends the player's aim vector toward a nearby enemy. It never
 * acquires a target the player was not already pointing at: a candidate must
 * fall inside `MAX_ASSIST_CONE_RADIANS` of the raw aim, so the setting softens
 * precision rather than aiming for you.
 *
 * Strength 0 is a no-op and must stay one — the default is 0, so the untouched
 * game plays exactly as it did before this existed.
 */

/** Half-angle of the acquisition cone. Beyond this the player is aiming elsewhere. */
export const MAX_ASSIST_CONE_RADIANS = 0.32;
/** Targets past this are ignored; assist should not reach across the arena. */
export const MAX_ASSIST_RANGE_METRES = 24;
/** Strength 1 still leaves a sliver of player authority rather than snapping. */
export const MAX_ASSIST_FRACTION = 0.85;

export interface AimAssistTarget {
  position: Vector2Data;
}

/**
 * Returns the aim vector to use. `aim` is expected normalized; the result is
 * normalized too. Falls back to `aim` unchanged whenever assist cannot or
 * should not apply.
 */
export function applyAimAssist(
  aim: Vector2Data,
  playerPosition: Vector2Data,
  targets: readonly AimAssistTarget[],
  strength: number,
): Vector2Data {
  const clampedStrength = Math.min(1, Math.max(0, strength));
  if (clampedStrength <= 0) return aim;

  const aimMagnitude = Math.hypot(aim.x, aim.y);
  if (aimMagnitude <= 0) return aim;
  const aimAngle = Math.atan2(aim.y, aim.x);

  const best = bestTargetAngle(aimAngle, playerPosition, targets);
  if (best === null) return aim;

  // Rotate toward the target by a fraction of the offset. Using the signed
  // delta keeps the shortest path and avoids wrapping artefacts at ±π.
  const delta = signedAngleDelta(aimAngle, best);
  const assisted = aimAngle + delta * clampedStrength * MAX_ASSIST_FRACTION;
  return normalizeVector({ x: Math.cos(assisted), y: Math.sin(assisted) });
}

/** Angle of the in-cone target with the smallest angular offset, or null. */
function bestTargetAngle(
  aimAngle: number,
  playerPosition: Vector2Data,
  targets: readonly AimAssistTarget[],
): number | null {
  let bestAngle: number | null = null;
  let bestOffset = MAX_ASSIST_CONE_RADIANS;

  for (const target of targets) {
    const offsetX = target.position.x - playerPosition.x;
    const offsetY = target.position.y - playerPosition.y;
    const distance = Math.hypot(offsetX, offsetY);
    if (distance <= 0 || distance > MAX_ASSIST_RANGE_METRES) continue;

    const targetAngle = Math.atan2(offsetY, offsetX);
    const offset = Math.abs(signedAngleDelta(aimAngle, targetAngle));
    if (offset < bestOffset) {
      bestOffset = offset;
      bestAngle = targetAngle;
    }
  }

  return bestAngle;
}

/** Shortest signed rotation from `from` to `to`, in (-π, π]. */
function signedAngleDelta(from: number, to: number): number {
  let delta = (to - from) % (Math.PI * 2);
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta <= -Math.PI) delta += Math.PI * 2;
  return delta;
}
