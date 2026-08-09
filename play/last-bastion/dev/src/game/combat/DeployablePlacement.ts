import type { WeaponId, WeaponRuntimeStats } from "../content/weaponCatalog";
import type { Vector2Data } from "../math/Vector2Data";

type DeployableWeaponStats = Pick<WeaponRuntimeStats,
  "id" | "deployMaxActive" | "deployHealth" | "deployLifetimeSeconds" | "projectileDamage"
>;

export interface ExistingDeployablePlacement {
  readonly id: number;
  readonly weaponId: WeaponId;
  readonly dead: boolean;
}

export interface StructurePlacementPlan {
  readonly retireDeployableId: number | null;
  readonly position: Vector2Data;
  readonly health: number;
  readonly remainingSeconds: number;
  readonly shotDamage: number;
}

/** Pure structure placement/cap policy; ID allocation and mutation stay simulation-owned. */
export function planStructurePlacement(input: {
  readonly stats: DeployableWeaponStats;
  readonly existingDeployables: readonly ExistingDeployablePlacement[];
  readonly anchor: Vector2Data;
  readonly direction: Vector2Data;
  readonly widthMetres: number;
  readonly heightMetres: number;
  readonly engineeringScale: number;
  readonly weaponDamageMultiplier: number;
}): StructurePlacementPlan {
  const active = input.existingDeployables.filter((unit) => (
    !unit.dead && unit.weaponId === input.stats.id
  ));
  const cap = Math.max(1, input.stats.deployMaxActive);
  const health = input.stats.deployHealth * input.engineeringScale;
  return {
    retireDeployableId: active.length >= cap ? active[0]!.id : null,
    position: {
      x: clamp(input.anchor.x + input.direction.x * 1.2, 0.6, input.widthMetres - 0.6),
      y: clamp(input.anchor.y + input.direction.y * 1.2, 0.6, input.heightMetres - 0.6),
    },
    health,
    remainingSeconds: input.stats.deployLifetimeSeconds * input.engineeringScale,
    shotDamage: input.stats.projectileDamage * input.weaponDamageMultiplier,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
