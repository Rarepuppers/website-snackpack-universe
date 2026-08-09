import type { Vector2Data } from "../math/Vector2Data";

export interface ProjectileObstacleCandidate {
  readonly id: string;
}

export interface ProjectileChestCandidate {
  readonly id: number;
  readonly variant: string;
  readonly position: Vector2Data;
  readonly resolved: boolean;
}

export type ProjectileWorldCollision<
  TObstacle extends ProjectileObstacleCandidate,
  TChest extends ProjectileChestCandidate,
> =
  | { readonly kind: "obstacle"; readonly obstacle: TObstacle }
  | { readonly kind: "armored-chest"; readonly chest: TChest };

/** Resolves obstacle precedence, then the first unresolved armored chest in encounter order. */
export function planProjectileWorldCollision<
  TObstacle extends ProjectileObstacleCandidate,
  TChest extends ProjectileChestCandidate,
>(input: {
  readonly position: Vector2Data;
  readonly obstacles: readonly TObstacle[];
  readonly chests: readonly TChest[];
  readonly chestRadiusMetres: number;
  readonly hitsObstacle: (position: Vector2Data, obstacle: TObstacle) => boolean;
}): ProjectileWorldCollision<TObstacle, TChest> | null {
  const obstacle = input.obstacles.find((candidate) => input.hitsObstacle(input.position, candidate));
  if (obstacle) return { kind: "obstacle", obstacle };

  for (const chest of input.chests) {
    if (chest.resolved || chest.variant !== "armored") continue;
    if (Math.hypot(
      input.position.x - chest.position.x,
      input.position.y - chest.position.y,
    ) <= input.chestRadiusMetres) {
      return { kind: "armored-chest", chest };
    }
  }
  return null;
}
