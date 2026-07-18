import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";

export type EnemySteeringProfileId =
  | "pursuer"
  | "rushPack"
  | "chaseAndFire"
  | "standoffShooter"
  | "artillery"
  | "flanker"
  | "supportAnchor"
  | "treasureFlee";

export interface EnemySteeringProfile {
  id: EnemySteeringProfileId;
  minimumRangeMetres: number;
  preferredRangeMetres: number;
  maximumRangeMetres: number;
  separationWeight: number;
  leadSeconds: number;
  repathSeconds: number;
  requiresLineOfSight: boolean;
}

export const ENEMY_STEERING_PROFILES: Readonly<Record<EnemySteeringProfileId, EnemySteeringProfile>> = Object.freeze({
  pursuer: profile("pursuer", 0, 0, 0.25, 0.24, 0, 0.18, false),
  rushPack: profile("rushPack", 0, 0, 0.2, 0.34, 0.08, 0.12, false),
  chaseAndFire: profile("chaseAndFire", 1.5, 4.5, 8.5, 0.2, 0.18, 0.22, true),
  standoffShooter: profile("standoffShooter", 5, 6.5, 8, 0.28, 0.25, 0.3, true),
  artillery: profile("artillery", 7, 9, 11, 0.18, 0.35, 0.42, true),
  flanker: profile("flanker", 2.5, 4.5, 7, 0.22, 0.2, 0.24, false),
  supportAnchor: profile("supportAnchor", 4, 6, 9, 0.16, 0, 0.36, true),
  treasureFlee: profile("treasureFlee", 8, 12, Number.POSITIVE_INFINITY, 0.4, 0, 0.16, false),
});

/** Returns -1 to retreat, 0 to hold, and 1 to advance. */
export function rangeBandIntent(distanceMetres: number, profileId: EnemySteeringProfileId): -1 | 0 | 1 {
  const profile = ENEMY_STEERING_PROFILES[profileId];
  if (distanceMetres < profile.minimumRangeMetres) return -1;
  if (distanceMetres > profile.maximumRangeMetres) return 1;
  return 0;
}

export function blendSteering(
  desired: Vector2Data,
  separation: Vector2Data,
  separationWeight: number,
): Vector2Data {
  return normalizeVector({
    x: desired.x + separation.x * separationWeight,
    y: desired.y + separation.y * separationWeight,
  });
}

function profile(
  id: EnemySteeringProfileId,
  minimumRangeMetres: number,
  preferredRangeMetres: number,
  maximumRangeMetres: number,
  separationWeight: number,
  leadSeconds: number,
  repathSeconds: number,
  requiresLineOfSight: boolean,
): EnemySteeringProfile {
  return {
    id,
    minimumRangeMetres,
    preferredRangeMetres,
    maximumRangeMetres,
    separationWeight,
    leadSeconds,
    repathSeconds,
    requiresLineOfSight,
  };
}
