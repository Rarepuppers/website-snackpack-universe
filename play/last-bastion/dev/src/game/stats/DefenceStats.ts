/**
 * Shared defensive-stat model for heroes and enemies.
 *
 * Two separate armour stats exist by design:
 * - `armour`: percentage reduction with diminishing returns using
 *   `reduction = armour / (armour + ARMOUR_SOFT_CAP)`. One point is worth
 *   ~6.25% at low totals and each further point is worth slightly less,
 *   but armour never stops helping large health pools.
 * - `flatDamageReduction`: subtracted from every hit after the percentage
 *   step. Deliberately rarer — reserved for specific builds and units.
 *
 * Mitigation never reduces a positive hit below 0.1 damage. At the 2-damage
 * baseline (wave_balance.md) a 1-damage floor would erase small-calibre weapons
 * against heavy armour entirely, so the floor scales down with the numbers.
 */
export interface DefenceProfile {
  armour: number;
  flatDamageReduction: number;
  maxShield: number;
  shieldRechargeDelaySeconds: number;
  shieldRechargePerSecond: number;
  /** 0..1 — fraction of incoming slow effects ignored. */
  slowResistance: number;
  attackSpeedMultiplier: number;
  /** Invulnerability window after taking a hit. */
  hitInvulnerabilitySeconds: number;
  /** Reserved: no currency loop exists yet. 100 = baseline. */
  mineralFindPercent: number;
}

export const ARMOUR_SOFT_CAP = 15;

/** Smallest damage a positive hit can be reduced to. Scaled to the 2-damage baseline. */
export const MITIGATION_FLOOR = 0.1;

export function armourDamageMultiplier(armour: number): number {
  const effective = Math.max(armour, 0);
  return 1 - effective / (effective + ARMOUR_SOFT_CAP);
}

export function mitigateDamage(
  rawDamage: number,
  armour: number,
  flatDamageReduction: number,
): number {
  if (rawDamage <= 0) {
    return 0;
  }
  const afterArmour = rawDamage * armourDamageMultiplier(armour);
  const afterFlat = afterArmour - Math.max(flatDamageReduction, 0);
  return Math.max(afterFlat, MITIGATION_FLOOR);
}

/** Applies slow resistance to a slow movement multiplier, pulling it back toward 1. */
export function resolveSlowedMultiplier(baseMultiplier: number, slowResistance: number): number {
  const resistance = Math.min(Math.max(slowResistance, 0), 1);
  return baseMultiplier + (1 - baseMultiplier) * resistance;
}

export interface ShieldAbsorption {
  remainingShield: number;
  remainingDamage: number;
}

/** Shields absorb raw damage before armour mitigation. */
export function absorbWithShield(shield: number, rawDamage: number): ShieldAbsorption {
  const absorbed = Math.min(Math.max(shield, 0), Math.max(rawDamage, 0));
  return {
    remainingShield: Math.max(shield - absorbed, 0),
    remainingDamage: Math.max(rawDamage - absorbed, 0),
  };
}
