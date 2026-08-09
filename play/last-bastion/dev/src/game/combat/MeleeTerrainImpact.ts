import type { Vector2Data } from "../math/Vector2Data";

export interface MeleeTerrainCandidate {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface MeleeTerrainImpact<T extends MeleeTerrainCandidate> {
  readonly obstacle: T;
  readonly impactPosition: Vector2Data;
  readonly damage: number;
}

/** Plans the first cover impact in authored obstacle order for one melee sweep. */
export function planMeleeTerrainImpact<T extends MeleeTerrainCandidate>(input: {
  readonly obstacles: readonly T[];
  readonly anchor: Vector2Data;
  readonly facing: Vector2Data;
  readonly reachMetres: number;
  readonly projectileDamage: number;
  readonly weaponDamageMultiplier: () => number;
  readonly powerupDamageMultiplier: () => number;
  readonly terrainDamageMultiplier: number;
  readonly relicTerrainDamageMultiplier: number;
  readonly intersects: (from: Vector2Data, to: Vector2Data, obstacle: T) => boolean;
}): MeleeTerrainImpact<T> | null {
  const endpoint = {
    x: input.anchor.x + input.facing.x * input.reachMetres,
    y: input.anchor.y + input.facing.y * input.reachMetres,
  };
  const obstacle = input.obstacles.find((candidate) => (
    input.intersects(input.anchor, endpoint, candidate)
  ));
  if (!obstacle) return null;

  return {
    obstacle,
    damage: input.projectileDamage * input.weaponDamageMultiplier()
      * input.powerupDamageMultiplier() * input.terrainDamageMultiplier
      * input.relicTerrainDamageMultiplier,
    impactPosition: {
      x: obstacle.x + obstacle.width / 2,
      y: obstacle.y + obstacle.height / 2,
    },
  };
}
