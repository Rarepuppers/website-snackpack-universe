import type { Vector2Data } from "../math/Vector2Data";

export interface OrbitBladeMotion {
  readonly angleRadians: number;
  readonly bladePosition: Vector2Data;
  readonly direction: Vector2Data;
}

/** Pure Sawblade angular integration and world-space geometry. Angles intentionally do not wrap. */
export function advanceOrbitBladeMotion(input: {
  readonly currentAngleRadians: number;
  readonly angularSpeedRadiansPerSecond: number;
  readonly deltaSeconds: number;
  readonly orbitRadiusMetres: number;
  readonly playerPosition: Vector2Data;
}): OrbitBladeMotion {
  const angleRadians = input.currentAngleRadians
    + input.angularSpeedRadiansPerSecond * input.deltaSeconds;
  const direction = { x: Math.cos(angleRadians), y: Math.sin(angleRadians) };
  return {
    angleRadians,
    bladePosition: {
      x: input.playerPosition.x + direction.x * input.orbitRadiusMetres,
      y: input.playerPosition.y + direction.y * input.orbitRadiusMetres,
    },
    direction,
  };
}
