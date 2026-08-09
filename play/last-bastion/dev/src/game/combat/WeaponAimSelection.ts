import type { WeaponTargetingMode } from "../content/weaponCatalog";
import { distance, normalizeVector, type Vector2Data } from "../math/Vector2Data";

export interface WeaponAimTarget {
  readonly id: number;
  readonly position: Vector2Data;
  readonly dead: boolean;
}

/**
 * Resolves cursor or nearest-enemy aim without mutating cooldowns. Designated
 * targets outrank every ordinary target; within one priority class, `<=`
 * preserves the original later-entry exact-distance tie rule.
 */
export function selectWeaponAimDirection<T extends WeaponAimTarget>(input: {
  readonly targetingMode: WeaponTargetingMode;
  readonly cursorDirection: Vector2Data;
  readonly origin: Vector2Data;
  readonly rangeMetres: number;
  readonly targets: readonly T[];
  readonly isDesignated: (target: T) => boolean;
}): Vector2Data | null {
  if (input.targetingMode === "cursor") return input.cursorDirection;

  let nearest: T | null = null;
  let nearestIsDesignated = false;
  let nearestDistance = input.rangeMetres;
  for (const target of input.targets) {
    if (target.dead) continue;
    const candidateDistance = distance(input.origin, target.position);
    const candidateIsDesignated = input.isDesignated(target);
    if (candidateDistance <= input.rangeMetres
      && (candidateIsDesignated && !nearestIsDesignated
        || candidateIsDesignated === nearestIsDesignated && candidateDistance <= nearestDistance)) {
      nearest = target;
      nearestDistance = candidateDistance;
      nearestIsDesignated = candidateIsDesignated;
    }
  }
  return nearest
    ? normalizeVector({ x: nearest.position.x - input.origin.x, y: nearest.position.y - input.origin.y })
    : null;
}
