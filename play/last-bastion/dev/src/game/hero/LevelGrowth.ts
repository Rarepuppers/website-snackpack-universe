import type { WeaponClass } from "./HeroDefinition";

export const LEVEL_STAT_MAGNITUDES = Object.freeze({
  health: 1,
  armour: 0.5,
  damage: 0.02,
  speed: 0.015,
  proficiency: 0.04,
  supportEffect: 0.05,
} as const);

export interface LevelGrowthTotals {
  maxHealthBonus: number;
  armourBonus: number;
  damageMultiplier: number;
  speedMultiplier: number;
  supportMultiplier: number;
  proficiencyMultiplier: Readonly<Record<WeaponClass, number>>;
}

export function marineGrowthAtLevel(level: number): LevelGrowthTotals {
  const gained = Math.max(0, Math.floor(level) - 1);
  return {
    maxHealthBonus: gained * LEVEL_STAT_MAGNITUDES.health,
    armourBonus: gained * LEVEL_STAT_MAGNITUDES.armour,
    damageMultiplier: 1 + gained * LEVEL_STAT_MAGNITUDES.damage,
    speedMultiplier: 1 + gained * LEVEL_STAT_MAGNITUDES.speed,
    supportMultiplier: 1,
    proficiencyMultiplier: {
      light: 1 + gained * LEVEL_STAT_MAGNITUDES.proficiency,
      medium: 1,
      heavy: 1,
      unique: 1,
    },
  };
}

export function experienceThreshold(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.round(5 + 4 * safeLevel + safeLevel * safeLevel / 2);
}
