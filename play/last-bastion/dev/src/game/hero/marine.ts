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
} satisfies HeroDefinition);
