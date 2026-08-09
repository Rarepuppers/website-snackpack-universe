import { distance, type Vector2Data } from "../math/Vector2Data";

export interface OrbitWeaponTarget {
  readonly id: number;
  readonly position: Vector2Data;
  readonly dead: boolean;
}

/**
 * Selects the next Tesla-style hop. `<=` deliberately makes a later encounter
 * entry win an exact-distance tie, matching the original inline scan.
 */
export function selectOrbitChainTarget<T extends OrbitWeaponTarget>(input: {
  readonly targets: readonly T[];
  readonly origin: Vector2Data;
  readonly maximumDistanceMetres: number;
  readonly excludedIds?: ReadonlySet<number>;
}): T | null {
  let selected: T | null = null;
  let nearestDistance = input.maximumDistanceMetres;
  for (const target of input.targets) {
    if (target.dead || input.excludedIds?.has(target.id)) continue;
    const candidateDistance = distance(input.origin, target.position);
    if (candidateDistance <= nearestDistance) {
      selected = target;
      nearestDistance = candidateDistance;
    }
  }
  return selected;
}

/** Selects Sawblade contacts in stable encounter order. */
export function selectOrbitContactTargets<T extends OrbitWeaponTarget>(input: {
  readonly targets: readonly T[];
  readonly bladePosition: Vector2Data;
  readonly contactReachMetres: (target: T) => number;
}): readonly T[] {
  return input.targets.filter((target) => (
    !target.dead
    && distance(input.bladePosition, target.position) <= input.contactReachMetres(target)
  ));
}
