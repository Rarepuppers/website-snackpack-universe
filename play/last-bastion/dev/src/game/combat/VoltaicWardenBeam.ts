import type { ArenaObstacle } from "../arena/ArenaDefinition";
import type { Vector2Data } from "../math/Vector2Data";
import { lockArcWardenLane, type ArcWardenLane } from "./ArcWardenBeam";

export const VOLTAIC_CHAIN_OFFSET_METRES = 2.2;

/** A second clipped lane fans from the primary target, making the warning readable and dodgeable. */
export function lockVoltaicSecondaryLane(
  origin: Readonly<Vector2Data>,
  primaryTarget: Readonly<Vector2Data>,
  obstacles: readonly ArenaObstacle[],
  side: -1 | 1,
): ArcWardenLane | null {
  const dx = primaryTarget.x - origin.x;
  const dy = primaryTarget.y - origin.y;
  const length = Math.hypot(dx, dy);
  if (length <= Number.EPSILON) return null;
  const target = {
    x: primaryTarget.x - dy / length * VOLTAIC_CHAIN_OFFSET_METRES * side,
    y: primaryTarget.y + dx / length * VOLTAIC_CHAIN_OFFSET_METRES * side,
  };
  return lockArcWardenLane(origin, target, obstacles);
}
