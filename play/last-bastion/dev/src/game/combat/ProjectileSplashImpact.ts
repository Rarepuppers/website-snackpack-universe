import type { Vector2Data } from "../math/Vector2Data";

export interface ProjectileSplashCandidate {
  readonly id: number;
  readonly position: Vector2Data;
  readonly dead: boolean;
}

/** Plans one live encounter-order splash impact, or excludes the candidate. */
export function planProjectileSplashImpact<T extends ProjectileSplashCandidate>(input: {
  readonly candidate: T;
  readonly directEnemyId: number | undefined;
  readonly explosionPosition: Vector2Data;
  readonly explosionRadiusMetres: number;
  readonly projectileDamage: number;
  readonly splashDamageMultiplier: () => number;
}): { readonly target: T; readonly damage: number } | null {
  if (input.candidate.id === input.directEnemyId || input.candidate.dead) return null;
  const separation = Math.hypot(
    input.candidate.position.x - input.explosionPosition.x,
    input.candidate.position.y - input.explosionPosition.y,
  );
  if (separation > input.explosionRadiusMetres) return null;
  return {
    target: input.candidate,
    damage: input.projectileDamage * input.splashDamageMultiplier(),
  };
}
