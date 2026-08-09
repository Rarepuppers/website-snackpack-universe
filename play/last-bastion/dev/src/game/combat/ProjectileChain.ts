import type { Vector2Data } from "../math/Vector2Data";

export interface ProjectileChainCandidate {
  readonly id: number;
  readonly position: Vector2Data;
  readonly dead: boolean;
}

export interface ProjectileChainHop<T extends ProjectileChainCandidate> {
  readonly target: T;
  readonly hop: number;
  readonly damage: number;
  readonly chainRemaining: number;
}

/** Plans one live chain hop; the simulation applies it before asking for the next. */
export function planProjectileChainHop<T extends ProjectileChainCandidate>(input: {
  readonly targets: readonly T[];
  readonly fromPosition: Vector2Data;
  readonly hitEnemyIds: ReadonlySet<number>;
  readonly chainRemaining: number;
  readonly chainRadiusMetres: number;
  readonly completedHops: number;
  readonly baseDamage: number;
}): ProjectileChainHop<T> | null {
  if (input.chainRemaining <= 0) return null;
  let target: T | null = null;
  let nearestDistance = input.chainRadiusMetres;
  for (const candidate of input.targets) {
    if (candidate.dead || input.hitEnemyIds.has(candidate.id)) continue;
    const candidateDistance = Math.hypot(
      input.fromPosition.x - candidate.position.x,
      input.fromPosition.y - candidate.position.y,
    );
    if (candidateDistance <= nearestDistance) {
      target = candidate;
      nearestDistance = candidateDistance;
    }
  }
  if (!target) return null;
  const hop = input.completedHops + 1;
  return {
    target,
    hop,
    damage: input.baseDamage * Math.pow(0.7, hop),
    chainRemaining: input.chainRemaining - 1,
  };
}
