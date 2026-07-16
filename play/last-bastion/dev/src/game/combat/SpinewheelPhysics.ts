import type { ArenaDefinition } from "../arena/ArenaDefinition";
import { collidesWithObstacle } from "../arena/ArenaDefinition";
import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";

export interface SpinewheelReflectionStep {
  position: Vector2Data;
  direction: Vector2Data;
  bounced: boolean;
  hitAxis: "x" | "y" | "corner" | null;
}

/**
 * Advances a rolling Spinewheel and reflects its locked heading when the next
 * fixed step reaches an arena boundary or active obstacle. Keeping this pure
 * makes bounce outcomes deterministic and independently testable.
 */
export function stepSpinewheelReflection(
  position: Vector2Data,
  direction: Vector2Data,
  distanceMetres: number,
  radiusMetres: number,
  arena: ArenaDefinition,
): SpinewheelReflectionStep {
  const heading = normalizeVector(direction);
  const desired = {
    x: position.x + heading.x * distanceMetres,
    y: position.y + heading.y * distanceMetres,
  };
  const hitBoundaryX = desired.x < radiusMetres || desired.x > arena.widthMetres - radiusMetres;
  const hitBoundaryY = desired.y < radiusMetres || desired.y > arena.heightMetres - radiusMetres;
  const boundedDesired = {
    x: clamp(desired.x, radiusMetres, arena.widthMetres - radiusMetres),
    y: clamp(desired.y, radiusMetres, arena.heightMetres - radiusMetres),
  };
  const obstacleHit = collidesWithObstacle(boundedDesired, radiusMetres, arena.obstacles);

  if (!hitBoundaryX && !hitBoundaryY && !obstacleHit) {
    return { position: boundedDesired, direction: heading, bounced: false, hitAxis: null };
  }

  let hitX = hitBoundaryX;
  let hitY = hitBoundaryY;
  if (obstacleHit) {
    const xOnly = { x: boundedDesired.x, y: position.y };
    const yOnly = { x: position.x, y: boundedDesired.y };
    hitX ||= collidesWithObstacle(xOnly, radiusMetres, arena.obstacles);
    hitY ||= collidesWithObstacle(yOnly, radiusMetres, arena.obstacles);
    if (!hitX && !hitY) {
      hitX = true;
      hitY = true;
    }
  }

  const reflected = normalizeVector({
    x: hitX ? -heading.x : heading.x,
    y: hitY ? -heading.y : heading.y,
  });
  return {
    position: { ...position },
    direction: reflected,
    bounced: true,
    hitAxis: hitX && hitY ? "corner" : hitX ? "x" : "y",
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
