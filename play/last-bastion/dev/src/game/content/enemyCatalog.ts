import type { DamageType } from "../combat/damageTypes";

export type EnemyType =
  | "scuttler"
  | "egg-cluster"
  | "brain-blob"
  | "slime-spitter"
  | "blast-mite"
  | "warp-flanker"
  | "siege-crusher";

export interface EnemyDefinition {
  id: EnemyType;
  maxHealth: number;
  radiusMetres: number;
  movementSpeedMetresPerSecond: number;
  contactDamage: number;
  experienceValue: number;
  /** Percentage armour with diminishing returns; see stats/DefenceStats. */
  armour: number;
  /** Rare flat per-hit reduction, reserved for specific units. */
  flatDamageReduction: number;
  /** Incoming damage multipliers per type; unlisted types take 1×. */
  resistances: Readonly<Partial<Record<DamageType, number>>>;
}

export const ENEMY_CATALOG: Readonly<Record<EnemyType, EnemyDefinition>> = Object.freeze({
  scuttler: enemy({
    id: "scuttler",
    maxHealth: 20,
    radiusMetres: 0.45,
    movementSpeedMetresPerSecond: 2.35,
    contactDamage: 10,
    experienceValue: 1,
  }),
  "egg-cluster": enemy({
    id: "egg-cluster",
    maxHealth: 35,
    radiusMetres: 0.7,
    movementSpeedMetresPerSecond: 0,
    contactDamage: 0,
    experienceValue: 2,
    resistances: { fire: 1.5 },
  }),
  "brain-blob": enemy({
    id: "brain-blob",
    maxHealth: 28,
    radiusMetres: 0.55,
    movementSpeedMetresPerSecond: 0.9,
    contactDamage: 14,
    experienceValue: 2,
    resistances: { shock: 1.3 },
  }),
  "slime-spitter": enemy({
    id: "slime-spitter",
    maxHealth: 34,
    radiusMetres: 0.62,
    movementSpeedMetresPerSecond: 1.15,
    contactDamage: 8,
    experienceValue: 3,
    resistances: { fire: 1.5, toxic: 0.25 },
  }),
  "blast-mite": enemy({
    id: "blast-mite",
    maxHealth: 10,
    radiusMetres: 0.35,
    movementSpeedMetresPerSecond: 3.6,
    contactDamage: 0,
    experienceValue: 1,
    resistances: { fire: 1.4 },
  }),
  "warp-flanker": enemy({
    id: "warp-flanker",
    maxHealth: 24,
    radiusMetres: 0.5,
    movementSpeedMetresPerSecond: 1.4,
    contactDamage: 12,
    experienceValue: 2,
    resistances: { cryo: 1.3 },
  }),
  "siege-crusher": enemy({
    id: "siege-crusher",
    maxHealth: 3000,
    radiusMetres: 1.15,
    movementSpeedMetresPerSecond: 1.25,
    contactDamage: 22,
    experienceValue: 0,
    flatDamageReduction: 2,
  }),
});

function enemy(
  definition: Pick<EnemyDefinition,
    | "id" | "maxHealth" | "radiusMetres" | "movementSpeedMetresPerSecond"
    | "contactDamage" | "experienceValue"
  > & Partial<EnemyDefinition>,
): EnemyDefinition {
  return {
    armour: 0,
    flatDamageReduction: 0,
    resistances: {},
    ...definition,
  };
}
