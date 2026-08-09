/** Composes one projectile direct hit from modifier values resolved by the simulation in effect order. */
export function composeProjectileHitDamage(input: {
  readonly baseDamage: number;
  readonly projectileDamageMultiplier: number;
  readonly powerupDamageMultiplier: number;
  readonly eliteMarkDamageMultiplier: number;
  readonly rangeDamageMultiplier: number;
  readonly critMultiplier: number;
}): number {
  return input.baseDamage * input.projectileDamageMultiplier
    * input.powerupDamageMultiplier * input.eliteMarkDamageMultiplier
    * input.rangeDamageMultiplier * input.critMultiplier;
}
