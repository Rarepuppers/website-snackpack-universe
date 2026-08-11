import type { Vector2Data } from "../math/Vector2Data";

export interface GravityFieldLifetimeStep {
  readonly remainingSeconds: number;
  readonly detonates: boolean;
  readonly expired: boolean;
}

/** Advances field lifetime after pulls and distinguishes damaging expiry from silent pulse expiry. */
export function stepGravityFieldLifetime(input: {
  readonly remainingSeconds: number;
  readonly deltaSeconds: number;
  readonly kind: "event-horizon" | "gravity-pulse";
}): GravityFieldLifetimeStep {
  const remainingSeconds = input.remainingSeconds - input.deltaSeconds;
  const expired = remainingSeconds <= 0;
  return {
    remainingSeconds,
    expired,
    detonates: expired && input.kind === "event-horizon",
  };
}

export interface GravityFieldDetonationCandidate {
  readonly position: Vector2Data;
  readonly dead: boolean;
}

/** Plans one live encounter-order implosion hit with inclusive radius geometry. */
export function planGravityFieldDetonationImpact<T extends GravityFieldDetonationCandidate>(input: {
  readonly candidate: T;
  readonly fieldPosition: Vector2Data;
  readonly implosionRadiusMetres: number;
  readonly implosionDamage: number;
}): { readonly target: T; readonly damage: number } | null {
  if (input.candidate.dead) return null;
  const separation = Math.hypot(
    input.candidate.position.x - input.fieldPosition.x,
    input.candidate.position.y - input.fieldPosition.y,
  );
  return separation <= input.implosionRadiusMetres
    ? { target: input.candidate, damage: input.implosionDamage }
    : null;
}
