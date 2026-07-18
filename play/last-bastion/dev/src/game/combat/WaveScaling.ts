export interface WaveScaling {
  healthMultiplier: number;
  armourBonus: number;
  maxShield: number;
  speedMultiplier: number;
  damageMultiplier: number;
}

const SHIELD_ELIGIBLE_TYPES = new Set(["quillback", "ripper"]);

/** Authored, non-compounding scaling for a 1-based wave number. */
export function waveScaling(
  waveNumber: number,
  type: string,
  options: { elite?: boolean; boss?: boolean } = {},
): WaveScaling {
  if (options.boss) {
    return { healthMultiplier: 1, armourBonus: 0, maxShield: 0, speedMultiplier: 1, damageMultiplier: 1 };
  }
  const wave = Math.max(1, Math.floor(waveNumber));
  const offset = wave - 1;
  const shieldEligible = options.elite || SHIELD_ELIGIBLE_TYPES.has(type);
  return {
    healthMultiplier: 1 + 0.28 * offset,
    armourBonus: Math.min(Math.floor(wave / 3), 8),
    maxShield: wave >= 5 && shieldEligible ? Math.min(2 * (wave - 4), 20) : 0,
    speedMultiplier: Math.min(1 + 0.03 * offset, 1.35),
    damageMultiplier: Math.min(1 + 0.15 * offset, 3),
  };
}

export function scaleEnemyHealth(baseHealth: number, scaling: WaveScaling): number {
  return baseHealth * scaling.healthMultiplier;
}

export function scaleEnemyHit(baseDamage: number, scaling: Pick<WaveScaling, "damageMultiplier">): number {
  return Math.min(baseDamage * scaling.damageMultiplier, 5);
}
