export type EnemyType = "scuttler" | "egg-cluster" | "brain-blob" | "slime-spitter";

export interface EnemyDefinition {
  id: EnemyType;
  maxHealth: number;
  radiusMetres: number;
  movementSpeedMetresPerSecond: number;
  contactDamage: number;
  experienceValue: number;
}

export const ENEMY_CATALOG: Readonly<Record<EnemyType, EnemyDefinition>> = Object.freeze({
  scuttler: {
    id: "scuttler",
    maxHealth: 20,
    radiusMetres: 0.45,
    movementSpeedMetresPerSecond: 2.35,
    contactDamage: 10,
    experienceValue: 1,
  },
  "egg-cluster": {
    id: "egg-cluster",
    maxHealth: 35,
    radiusMetres: 0.7,
    movementSpeedMetresPerSecond: 0,
    contactDamage: 0,
    experienceValue: 2,
  },
  "brain-blob": {
    id: "brain-blob",
    maxHealth: 28,
    radiusMetres: 0.55,
    movementSpeedMetresPerSecond: 0.9,
    contactDamage: 14,
    experienceValue: 2,
  },
  "slime-spitter": {
    id: "slime-spitter",
    maxHealth: 34,
    radiusMetres: 0.62,
    movementSpeedMetresPerSecond: 1.15,
    contactDamage: 8,
    experienceValue: 3,
  },
});
