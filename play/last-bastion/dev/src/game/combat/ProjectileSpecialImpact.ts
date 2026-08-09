export interface ProjectileSpecialImpactPlan {
  readonly triggersGravityPulse: boolean;
  readonly routesToGravityWell: boolean;
  readonly boltHitIndex: 1 | 2 | null;
}

/** Plans special impact routing after the ordinary projectile-impact event is recorded. */
export function planProjectileSpecialImpact(input: {
  readonly triggersGravityPulse: boolean;
  readonly spawnsGravityWellOnImpact: boolean;
  readonly weaponId: string;
  readonly hitCount: number;
}): ProjectileSpecialImpactPlan {
  const routesToGravityWell = input.spawnsGravityWellOnImpact;
  return {
    triggersGravityPulse: input.triggersGravityPulse,
    routesToGravityWell,
    boltHitIndex: !routesToGravityWell && input.weaponId === "bolt-carbine"
      ? (input.hitCount === 1 ? 1 : 2)
      : null,
  };
}
