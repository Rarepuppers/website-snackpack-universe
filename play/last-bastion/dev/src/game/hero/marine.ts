import type { HeroDefinition } from "./HeroDefinition";

export const MARINE = Object.freeze({
  id: "marine",
  displayName: "Marine",
  movementSpeedMetresPerSecond: 5.25,
  collisionRadiusMetres: 0.55,
  evasiveMove: {
    presentation: "roll",
    durationSeconds: 0.55,
    distanceMetres: 4,
    invulnerabilitySeconds: 0.25,
  },
  defence: {
    armour: 0,
    flatDamageReduction: 0,
    maxShield: 0,
    shieldRechargeDelaySeconds: 3,
    shieldRechargePerSecond: 8,
    slowResistance: 0,
    attackSpeedMultiplier: 1,
    hitInvulnerabilitySeconds: 0.65,
    mineralFindPercent: 100,
  },
  weaponProficiencies: {
    light: 1,
    medium: 1,
    heavy: 1,
    unique: 1,
  },
  passive: {
    id: "entrenched",
    name: "Entrenched",
    description: "Holding your ground for 1 second grants +3 armour until you move.",
    stationarySecondsRequired: 1,
    bonusArmour: 3,
  },
  upgradeSlots: {
    offensive: 3,
    defensive: 2,
    support: 1,
    scavenger: 1,
  },
  ultimate: {
    id: "bastion-barrage",
    name: "Bastion Barrage",
    description: "Launch an explosive volley in every direction.",
    cooldownSeconds: 24,
    projectileCount: 12,
    projectileDamage: 18,
    explosionRadiusMetres: 1.4,
  },
} satisfies HeroDefinition);
