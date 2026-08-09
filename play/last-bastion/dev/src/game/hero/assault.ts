import type { HeroDefinition } from "./HeroDefinition";
import { assaultUnlockRequirementText } from "../progression/ArmoryProgression";

/**
 * T4.8 production hero contract. Deployment is earned through Assault
 * Clearance after the accepted Character Batch C3 presentation package.
 */
export const ASSAULT = Object.freeze({
  id: "assault",
  displayName: "Assault",
  role: "Aggressive mid-range specialist",
  baseMaxHealth: 9,
  baseRegenerationPerSecond: 0.05,
  movementSpeedMetresPerSecond: 5.4,
  collisionRadiusMetres: 0.52,
  evasiveMove: {
    presentation: "roll",
    durationSeconds: 0.5,
    distanceMetres: 4,
    invulnerabilitySeconds: 0.24,
  },
  defence: {
    armour: 0,
    flatDamageReduction: 0,
    maxShield: 0,
    shieldRechargeDelaySeconds: 3,
    shieldRechargePerSecond: 0.8,
    slowResistance: 0,
    attackSpeedMultiplier: 1,
    hitInvulnerabilitySeconds: 0.6,
  },
  weaponProficiencies: { light: 0, medium: 0, heavy: 0, unique: 0 },
  levelGrowth: {
    health: 1,
    armour: 0,
    damage: 2,
    speed: 0,
    supportEffect: 0,
    proficiency: { medium: 2, heavy: 1 },
  },
  passive: {
    id: "momentum",
    name: "Momentum",
    description: "Consecutive weapon hits on one target gain +4% damage, up to +20%; changing target or waiting 1.25s resets it.",
    stationarySecondsRequired: 0,
    bonusArmour: 0,
    consecutiveHitDamageBonus: 0.04,
    consecutiveHitMaxStacks: 5,
    consecutiveHitResetSeconds: 1.25,
  },
  upgradeSlots: { offensive: 4, defensive: 1, support: 1, scavenger: 1 },
  startingWeaponId: "marauder-ar",
  startingWeaponName: "Marauder AR",
  rackClasses: ["medium", "medium", "heavy", "all"],
  levelGrowthDescription: "+2 DAMAGE / +1 HEALTH / +2 MEDIUM / +1 HEAVY",
  unlockText: assaultUnlockRequirementText(),
  ultimate: {
    id: "breach-and-clear",
    name: "Breach & Clear",
    description: "Fire nine heavy rounds across a 100-degree forward cone with strong knockback.",
    cooldownSeconds: 22,
    projectileCount: 9,
    projectileDamage: 3,
    explosionRadiusMetres: 0,
    projectileArcRadians: 5 * Math.PI / 9,
    projectileKnockbackMetres: 0.7,
  },
} satisfies HeroDefinition);
