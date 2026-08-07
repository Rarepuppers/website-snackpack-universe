export interface Vector2Data {
  x: number;
  y: number;
}

export const ZERO_VECTOR: Readonly<Vector2Data> = Object.freeze({ x: 0, y: 0 });

/**
 * Euclidean distance. Identical private copies of this already exist in
 * `CombatSimulation` and `AbominationPrimeBehavior`; new code should use this
 * one, and those can migrate to it whenever they are next touched.
 */
export function distance(left: Readonly<Vector2Data>, right: Readonly<Vector2Data>): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

export function normalizeVector(vector: Vector2Data): Vector2Data {
  const length = Math.hypot(vector.x, vector.y);

  if (length === 0) {
    return { ...ZERO_VECTOR };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
}
