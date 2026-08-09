export type ProjectileExplosionRoute =
  | { readonly kind: "none"; readonly consumesEventHorizonCore: false }
  | { readonly kind: "ordinary"; readonly consumesEventHorizonCore: false }
  | { readonly kind: "gravity-well"; readonly consumesEventHorizonCore: false }
  | {
    readonly kind: "artifact-field";
    readonly consumesEventHorizonCore: true;
    readonly pullFieldDurationSeconds: number;
    readonly pullStrengthMetresPerSecond: number;
    readonly pullRadiusMetres: number;
    readonly explosionRadiusMetres: number;
  };

/** Selects exactly one terminal explosion route while preserving artifact-core priority. */
export function planProjectileExplosionRoute(input: {
  readonly eventHorizonCoreArmed: boolean;
  readonly spawnsGravityWellOnImpact: boolean;
  readonly explosionRadiusMetres: number;
  readonly artifactDurationSeconds: number;
  readonly artifactPullStrengthMetresPerSecond: number;
  readonly artifactPullRadiusMetres: number;
  readonly artifactImplosionRadiusMetres: number;
}): ProjectileExplosionRoute {
  if (input.eventHorizonCoreArmed && !input.spawnsGravityWellOnImpact) {
    return {
      kind: "artifact-field",
      consumesEventHorizonCore: true,
      pullFieldDurationSeconds: input.artifactDurationSeconds,
      pullStrengthMetresPerSecond: input.artifactPullStrengthMetresPerSecond,
      pullRadiusMetres: input.artifactPullRadiusMetres,
      explosionRadiusMetres: Math.max(
        input.explosionRadiusMetres,
        input.artifactImplosionRadiusMetres,
      ),
    };
  }
  if (input.spawnsGravityWellOnImpact) {
    return { kind: "gravity-well", consumesEventHorizonCore: false };
  }
  return input.explosionRadiusMetres > 0
    ? { kind: "ordinary", consumesEventHorizonCore: false }
    : { kind: "none", consumesEventHorizonCore: false };
}
