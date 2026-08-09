import type { Vector2Data } from "../math/Vector2Data";

export type ProjectileKinematicOutcome = "active" | "expired" | "out-of-bounds";

export interface ProjectileKinematicStep {
  readonly position: Vector2Data;
  readonly remainingSeconds: number;
  readonly outcome: ProjectileKinematicOutcome;
}

/** Advances movement and lifetime, then resolves expiry before arena bounds. */
export function stepProjectileKinematics(input: {
  readonly position: Vector2Data;
  readonly velocity: Vector2Data;
  readonly remainingSeconds: number;
  readonly deltaSeconds: number;
  readonly widthMetres: number;
  readonly heightMetres: number;
}): ProjectileKinematicStep {
  const position = {
    x: input.position.x + input.velocity.x * input.deltaSeconds,
    y: input.position.y + input.velocity.y * input.deltaSeconds,
  };
  const remainingSeconds = input.remainingSeconds - input.deltaSeconds;
  if (remainingSeconds <= 0) return { position, remainingSeconds, outcome: "expired" };
  if (
    position.x < 0
    || position.y < 0
    || position.x > input.widthMetres
    || position.y > input.heightMetres
  ) {
    return { position, remainingSeconds, outcome: "out-of-bounds" };
  }
  return { position, remainingSeconds, outcome: "active" };
}
