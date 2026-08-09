import type { Vector2Data } from "../math/Vector2Data";

export interface HomingTargetCandidate {
  readonly position: Vector2Data;
  readonly dead: boolean;
}

/** Turns velocity toward the nearest live target without changing projectile speed. */
export function steerProjectileVelocity<T extends HomingTargetCandidate>(input: {
  readonly position: Vector2Data;
  readonly velocity: Vector2Data;
  readonly targets: readonly T[];
  readonly turnRateRadiansPerSecond: number;
  readonly deltaSeconds: number;
}): Vector2Data {
  let nearest: T | null = null;
  let nearestDistance = Infinity;
  for (const target of input.targets) {
    if (target.dead) continue;
    const candidateDistance = Math.hypot(
      input.position.x - target.position.x,
      input.position.y - target.position.y,
    );
    if (candidateDistance < nearestDistance) {
      nearest = target;
      nearestDistance = candidateDistance;
    }
  }
  if (!nearest) return input.velocity;

  const speed = Math.hypot(input.velocity.x, input.velocity.y);
  if (speed <= 0) return input.velocity;
  const currentAngle = Math.atan2(input.velocity.y, input.velocity.x);
  const desiredAngle = Math.atan2(
    nearest.position.y - input.position.y,
    nearest.position.x - input.position.x,
  );
  let angleDifference = desiredAngle - currentAngle;
  while (angleDifference > Math.PI) angleDifference -= Math.PI * 2;
  while (angleDifference < -Math.PI) angleDifference += Math.PI * 2;
  const maximumTurn = input.turnRateRadiansPerSecond * input.deltaSeconds;
  const turn = Math.max(-maximumTurn, Math.min(maximumTurn, angleDifference));
  const nextAngle = currentAngle + turn;
  return { x: Math.cos(nextAngle) * speed, y: Math.sin(nextAngle) * speed };
}
