export interface Vector2Data {
  x: number;
  y: number;
}

export const ZERO_VECTOR: Readonly<Vector2Data> = Object.freeze({ x: 0, y: 0 });

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
