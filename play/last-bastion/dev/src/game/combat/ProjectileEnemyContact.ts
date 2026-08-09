import type { Vector2Data } from "../math/Vector2Data";

export interface ProjectileContactCandidate {
  readonly id: number;
  readonly position: Vector2Data;
  readonly dead: boolean;
}

/** Tests one target at its live encounter-order turn against the projectile contact circle. */
export function projectileContactsEnemy<T extends ProjectileContactCandidate>(input: {
  readonly projectilePosition: Vector2Data;
  readonly target: T;
  readonly hitEnemyIds: ReadonlySet<number>;
  readonly contactRadiusMetres: () => number;
}): boolean {
  if (input.target.dead || input.hitEnemyIds.has(input.target.id)) return false;
  return Math.hypot(
    input.projectilePosition.x - input.target.position.x,
    input.projectilePosition.y - input.target.position.y,
  ) <= input.contactRadiusMetres();
}
