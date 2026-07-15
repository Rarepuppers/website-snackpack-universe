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
} satisfies HeroDefinition);
