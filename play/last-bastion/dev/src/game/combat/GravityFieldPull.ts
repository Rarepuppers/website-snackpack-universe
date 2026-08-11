import type { Vector2Data } from "../math/Vector2Data";

export interface GravityFieldPullPlan {
  readonly destination: Vector2Data;
  readonly travelMetres: number;
}

/** Plans an unconstrained pull step without overshooting the field centre. */
export function planGravityFieldPull(input: {
  readonly enemyPosition: Vector2Data;
  readonly enemyDead: boolean;
  readonly fieldPosition: Vector2Data;
  readonly pullRadiusMetres: number;
  readonly pullStrengthMetresPerSecond: number;
  readonly deltaSeconds: number;
}): GravityFieldPullPlan | null {
  if (input.enemyDead) return null;
  const toCentre = {
    x: input.fieldPosition.x - input.enemyPosition.x,
    y: input.fieldPosition.y - input.enemyPosition.y,
  };
  const gap = Math.hypot(toCentre.x, toCentre.y);
  if (gap <= 0 || gap > input.pullRadiusMetres) return null;
  const travelMetres = Math.min(input.pullStrengthMetresPerSecond * input.deltaSeconds, gap);
  return {
    destination: {
      x: input.enemyPosition.x + (toCentre.x / gap) * travelMetres,
      y: input.enemyPosition.y + (toCentre.y / gap) * travelMetres,
    },
    travelMetres,
  };
}
