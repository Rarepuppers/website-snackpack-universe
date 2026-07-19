import type { HeroDefinition, WeaponClass } from "./HeroDefinition";
import { MARINE } from "./marine";

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
  return heroGrowthAtLevel(MARINE, level);
}

export function heroGrowthAtLevel(hero: HeroDefinition, level: number): LevelGrowthTotals {
  const gained = Math.max(0, Math.floor(level) - 1);
  return {
    maxHealthBonus: gained * hero.levelGrowth.health * LEVEL_STAT_MAGNITUDES.health,
    armourBonus: gained * hero.levelGrowth.armour * LEVEL_STAT_MAGNITUDES.armour,
    damageMultiplier: 1 + gained * hero.levelGrowth.damage * LEVEL_STAT_MAGNITUDES.damage,
    speedMultiplier: 1 + gained * hero.levelGrowth.speed * LEVEL_STAT_MAGNITUDES.speed,
    supportMultiplier: 1 + gained * hero.levelGrowth.supportEffect * LEVEL_STAT_MAGNITUDES.supportEffect,
    proficiencyMultiplier: {
      light: 1 + gained * (hero.levelGrowth.proficiency.light ?? 0) * LEVEL_STAT_MAGNITUDES.proficiency,
      medium: 1 + gained * (hero.levelGrowth.proficiency.medium ?? 0) * LEVEL_STAT_MAGNITUDES.proficiency,
      heavy: 1 + gained * (hero.levelGrowth.proficiency.heavy ?? 0) * LEVEL_STAT_MAGNITUDES.proficiency,
      unique: 1 + gained * (hero.levelGrowth.proficiency.unique ?? 0) * LEVEL_STAT_MAGNITUDES.proficiency,
    },
  };
}

export function experienceThreshold(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.round(5 + 4 * safeLevel + safeLevel * safeLevel / 2);
}
