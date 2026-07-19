import type { DamageType } from "../combat/damageTypes";
import type { EnemySteeringProfileId } from "../combat/EnemySteeringProfiles";

export type EnemyType =
  | "scuttler"
  | "swarm-scuttler"
  | "egg-cluster"
  | "brain-blob"
  | "slime-spitter"
  | "blast-mite"
  | "warp-flanker"
  | "ripper"
  | "razor-scuttler"
  | "quillback"
  | "spinewheel"
  | "tether-bloom"
  | "aurum-hoarder"
  | "siege-crusher"
  | "brood-warden"
  | "rift-stalker"
  | "bastion-eater";

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
  /** Shared movement intent; bespoke attack phases may temporarily override it. */
  steeringProfile: EnemySteeringProfileId;
}

export const ENEMY_CATALOG: Readonly<Record<EnemyType, EnemyDefinition>> = Object.freeze({
  scuttler: enemy({
    id: "scuttler",
    maxHealth: 4,
    radiusMetres: 0.45,
    movementSpeedMetresPerSecond: 2.35,
    contactDamage: 1,
    experienceValue: 1,
  }),
  "swarm-scuttler": enemy({
    id: "swarm-scuttler",
    maxHealth: 2,
    radiusMetres: 0.34,
    movementSpeedMetresPerSecond: 4.2,
    contactDamage: 1,
    experienceValue: 1,
    steeringProfile: "rushPack",
  }),
  "egg-cluster": enemy({
    id: "egg-cluster",
    maxHealth: 7,
    radiusMetres: 0.7,
    movementSpeedMetresPerSecond: 0,
    contactDamage: 0,
    experienceValue: 2,
    resistances: { fire: 1.5 },
    steeringProfile: "supportAnchor",
  }),
  "brain-blob": enemy({
    id: "brain-blob",
    maxHealth: 6,
    radiusMetres: 0.55,
    movementSpeedMetresPerSecond: 0.9,
    contactDamage: 1.5,
    experienceValue: 2,
    resistances: { shock: 1.3 },
    steeringProfile: "pursuer",
  }),
  "slime-spitter": enemy({
    id: "slime-spitter",
    maxHealth: 7,
    radiusMetres: 0.62,
    movementSpeedMetresPerSecond: 1.15,
    contactDamage: 1,
    experienceValue: 3,
    resistances: { fire: 1.5, toxic: 0.25 },
    steeringProfile: "standoffShooter",
  }),
  "blast-mite": enemy({
    id: "blast-mite",
    maxHealth: 2,
    radiusMetres: 0.35,
    movementSpeedMetresPerSecond: 3.6,
    contactDamage: 0,
    experienceValue: 1,
    resistances: { fire: 1.4 },
    steeringProfile: "rushPack",
  }),
  "warp-flanker": enemy({
    id: "warp-flanker",
    maxHealth: 5,
    radiusMetres: 0.5,
    movementSpeedMetresPerSecond: 1.4,
    contactDamage: 1.2,
    experienceValue: 2,
    resistances: { cryo: 1.3 },
    steeringProfile: "flanker",
  }),
  ripper: enemy({
    id: "ripper",
    maxHealth: 14,
    radiusMetres: 0.72,
    movementSpeedMetresPerSecond: 1.7,
    contactDamage: 1,
    experienceValue: 6,
    armour: 2,
    steeringProfile: "pursuer",
  }),
  "razor-scuttler": enemy({
    id: "razor-scuttler",
    maxHealth: 3,
    radiusMetres: 0.42,
    movementSpeedMetresPerSecond: 3.35,
    contactDamage: 0,
    experienceValue: 3,
    resistances: { cryo: 1.25 },
    steeringProfile: "rushPack",
  }),
  quillback: enemy({
    id: "quillback",
    maxHealth: 9,
    radiusMetres: 0.66,
    movementSpeedMetresPerSecond: 1.4,
    contactDamage: 0.8,
    experienceValue: 4,
    armour: 1,
    steeringProfile: "artillery",
  }),
  spinewheel: enemy({
    id: "spinewheel",
    maxHealth: 12,
    radiusMetres: 0.68,
    movementSpeedMetresPerSecond: 1.45,
    contactDamage: 0.8,
    experienceValue: 4,
    armour: 1,
    steeringProfile: "flanker",
  }),
  "tether-bloom": enemy({
    id: "tether-bloom",
    maxHealth: 10,
    radiusMetres: 0.72,
    movementSpeedMetresPerSecond: 0,
    contactDamage: 0,
    experienceValue: 4,
    resistances: { toxic: 0.4 },
    steeringProfile: "supportAnchor",
  }),
  "aurum-hoarder": enemy({
    id: "aurum-hoarder",
    maxHealth: 24,
    radiusMetres: 0.65,
    movementSpeedMetresPerSecond: 3,
    contactDamage: 0,
    experienceValue: 0,
    armour: 2,
    steeringProfile: "treasureFlee",
  }),
  "siege-crusher": enemy({
    id: "siege-crusher",
    maxHealth: 600,
    radiusMetres: 1.15,
    movementSpeedMetresPerSecond: 1.25,
    contactDamage: 3.5,
    experienceValue: 0,
    flatDamageReduction: 2,
    steeringProfile: "pursuer",
  }),
  "brood-warden": enemy({
    id: "brood-warden",
    maxHealth: 540,
    radiusMetres: 1.05,
    movementSpeedMetresPerSecond: 1.4,
    contactDamage: 1.6,
    experienceValue: 0,
    flatDamageReduction: 2,
    resistances: { toxic: 0.35 },
    steeringProfile: "supportAnchor",
  }),
  "rift-stalker": enemy({
    id: "rift-stalker",
    maxHealth: 520,
    radiusMetres: 0.95,
    movementSpeedMetresPerSecond: 2.1,
    contactDamage: 1.4,
    experienceValue: 0,
    flatDamageReduction: 2,
    resistances: { cryo: 0.75 },
    steeringProfile: "flanker",
  }),
  "bastion-eater": enemy({
    id: "bastion-eater",
    maxHealth: 2400,
    radiusMetres: 1.8,
    movementSpeedMetresPerSecond: 0.95,
    contactDamage: 5,
    experienceValue: 0,
    // The authored shutter state in CombatSimulation owns boss mitigation;
    // permanent flat reduction would erase the 2-damage starter baseline.
    armour: 0,
    flatDamageReduction: 0,
    resistances: { toxic: 0.5, cryo: 0.8 },
    steeringProfile: "supportAnchor",
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
    steeringProfile: "pursuer",
    ...definition,
  };
}
