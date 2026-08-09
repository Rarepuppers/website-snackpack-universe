import { normalizeVector, type Vector2Data } from "../math/Vector2Data";

export interface WeaponGeometryTarget {
  readonly id: number;
  readonly position: Vector2Data;
  readonly dead: boolean;
}

export function pointInsideWeaponArc(
  origin: Vector2Data,
  direction: Vector2Data,
  point: Vector2Data,
  reachMetres: number,
  halfAngleRadians = Math.PI * 0.32,
): boolean {
  return pointInsideNormalizedWeaponArc(
    origin,
    normalizeVector(direction),
    point,
    reachMetres,
    halfAngleRadians,
  );
}

/**
 * Selects melee/beam targets in encounter order. The caller supplies the
 * already-normalized facing and the simulation-owned obstruction query.
 */
export function selectForwardArcTargets<T extends WeaponGeometryTarget>(input: {
  readonly targets: readonly T[];
  readonly origin: Vector2Data;
  readonly facing: Vector2Data;
  readonly reachMetres: number;
  readonly halfAngleRadians: number;
  readonly isPathBlocked: (target: T) => boolean;
}): readonly T[] {
  return input.targets.filter((target) => (
    !target.dead
    && pointInsideNormalizedWeaponArc(
      input.origin,
      input.facing,
      target.position,
      input.reachMetres,
      input.halfAngleRadians,
    )
    && !input.isPathBlocked(target)
  ));
}

function pointInsideNormalizedWeaponArc(
  origin: Vector2Data,
  facing: Vector2Data,
  point: Vector2Data,
  reachMetres: number,
  halfAngleRadians: number,
): boolean {
  const offset = { x: point.x - origin.x, y: point.y - origin.y };
  const magnitude = Math.hypot(offset.x, offset.y);
  if (magnitude > reachMetres) return false;
  if (magnitude === 0) return true;
  const dot = (offset.x / magnitude) * facing.x + (offset.y / magnitude) * facing.y;
  return dot >= Math.cos(halfAngleRadians);
}
