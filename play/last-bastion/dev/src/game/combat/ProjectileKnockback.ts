import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";

/** Plans the unconstrained destination; arena collision resolution remains simulation-owned. */
export function planProjectileKnockback(input: {
  readonly enemyPosition: Vector2Data;
  readonly enemyDead: boolean;
  readonly projectileVelocity: Vector2Data;
  readonly knockbackMetres: number;
}): Vector2Data | null {
  if (input.knockbackMetres <= 0 || input.enemyDead) return null;
  const direction = normalizeVector(input.projectileVelocity);
  return {
    x: input.enemyPosition.x + direction.x * input.knockbackMetres,
    y: input.enemyPosition.y + direction.y * input.knockbackMetres,
  };
}
