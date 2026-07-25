export interface WaveScaling {
  healthMultiplier: number;
  armourBonus: number;
  maxShield: number;
  speedMultiplier: number;
  damageMultiplier: number;
  /** Body-radius multiplier. Only ranked enemies grow; 1 for everything else. */
  radiusMultiplier: number;
}

const SHIELD_ELIGIBLE_TYPES = new Set(["quillback", "ripper"]);

/** Standard per-hit damage ceiling. Ranked enemies are allowed past it. */
export const ENEMY_HIT_CAP = 5;
/**
 * Mini-bosses and the boss hit harder than the standard cap allows. Without
 * this their damage scaling would be almost entirely swallowed: several
 * mini-boss baselines already sit at 4.4-5.
 */
export const RANKED_ENEMY_HIT_CAP = 8;

/**
 * Authored, non-compounding scaling for a 1-based wave number.
 *
 * `miniBoss` is deliberately a gentler curve than `elite`: mini-boss fights are
 * kept fair by readable windup telegraphs, and those telegraph durations are
 * fixed (see `TelegraphRules.ts`). Speed that outruns the tells turns a fair
 * fight into a cheap one, so the speed cap sits well below the elite ceiling.
 */
export function waveScaling(
  waveNumber: number,
  type: string,
  options: { elite?: boolean; boss?: boolean; miniBoss?: boolean } = {},
): WaveScaling {
  if (options.boss) {
    return {
      healthMultiplier: 1, armourBonus: 0, maxShield: 0,
      speedMultiplier: 1, damageMultiplier: 1, radiusMultiplier: 1,
    };
  }
  const wave = Math.max(1, Math.floor(waveNumber));
  const offset = wave - 1;
  if (options.miniBoss) {
    return {
      healthMultiplier: 1 + 0.18 * offset,
      armourBonus: Math.min(Math.floor(wave / 3), 8),
      maxShield: 0,
      speedMultiplier: Math.min(1 + 0.02 * offset, 1.2),
      damageMultiplier: Math.min(1 + 0.08 * offset, 1.6),
      // A late mini-boss reads as physically bigger, which is the cheapest
      // honest signal that it is more dangerous than the one at column 1.
      radiusMultiplier: Math.min(1 + 0.03 * offset, 1.25),
    };
  }
  const shieldEligible = options.elite || SHIELD_ELIGIBLE_TYPES.has(type);
  return {
    healthMultiplier: 1 + 0.28 * offset,
    armourBonus: Math.min(Math.floor(wave / 3), 8),
    maxShield: wave >= 5 && shieldEligible ? Math.min(2 * (wave - 4), 20) : 0,
    speedMultiplier: Math.min(1 + 0.03 * offset, 1.35),
    damageMultiplier: Math.min(1 + 0.15 * offset, 3),
    radiusMultiplier: 1,
  };
}

export function scaleEnemyHealth(baseHealth: number, scaling: WaveScaling): number {
  return baseHealth * scaling.healthMultiplier;
}

export function scaleEnemyHit(
  baseDamage: number,
  scaling: Pick<WaveScaling, "damageMultiplier">,
  cap: number = ENEMY_HIT_CAP,
): number {
  return Math.min(baseDamage * scaling.damageMultiplier, cap);
}
