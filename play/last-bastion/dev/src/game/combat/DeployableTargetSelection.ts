import type { Vector2Data } from "../math/Vector2Data";

export interface DeployableTargetCandidate {
  readonly id: number;
  readonly position: Vector2Data;
  readonly dead: boolean;
}

/** Selects the nearest live target strictly inside range with deterministic ID ties. */
export function selectDeployableTarget<T extends DeployableTargetCandidate>(input: {
  readonly targets: readonly T[];
  readonly origin: Vector2Data;
  readonly rangeMetres: number;
}): T | null {
  let best: T | null = null;
  let bestDistance = input.rangeMetres;
  for (const target of input.targets) {
    if (target.dead) continue;
    const separation = Math.hypot(
      input.origin.x - target.position.x,
      input.origin.y - target.position.y,
    );
    if (separation < bestDistance || (
      separation === bestDistance && best !== null && target.id < best.id
    )) {
      bestDistance = separation;
      best = target;
    }
  }
  return best;
}
