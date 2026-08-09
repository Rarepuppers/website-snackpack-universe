/** Composes an already-derived base hit with runtime weapon modifiers in authored order. */
export function composeWeaponHitDamage(input: {
  readonly baseDamage: number;
  readonly weaponDamageMultiplier: number;
  readonly powerupDamageMultiplier: number;
  readonly eliteMarkDamageMultiplier: number;
  readonly rangeDamageMultiplier: number;
  readonly critMultiplier: number;
}): number {
  return input.baseDamage * input.weaponDamageMultiplier
    * input.powerupDamageMultiplier * input.eliteMarkDamageMultiplier
    * input.rangeDamageMultiplier * input.critMultiplier;
}
