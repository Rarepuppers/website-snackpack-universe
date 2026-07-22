import type { DamageType } from "../combat/damageTypes";
import type { EnemySteeringProfileId } from "../combat/EnemySteeringProfiles";

export type EnemyType =
  | "scuttler"
  | "swarm-scuttler"
  | "infected-survivor"
  | "corrupted-marine"
  | "abomination"
  | "nest-weaver"
  | "nest-pod"
  | "nest-hatchling"
  | "storm-savant"
  | "storm-node"
  | "scrap-skitterer"
  | "arc-warden"
  | "cyborg-reclaimer"
  | "foundry-fabricator"
  | "foundry-pad"
  | "foundry-drone"
  | "foundry-turret"
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
  | "synapse-herald"
  | "assembly-prime"
  | "storm-regent"
  | "abomination-prime"
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
  "infected-survivor": enemy({
    id: "infected-survivor",
    maxHealth: 3,
    radiusMetres: 0.38,
    movementSpeedMetresPerSecond: 2.1,
    contactDamage: 1,
    experienceValue: 1,
    steeringProfile: "rushPack",
  }),
  "corrupted-marine": enemy({
    id: "corrupted-marine",
    maxHealth: 10,
    radiusMetres: 0.5,
    movementSpeedMetresPerSecond: 1.65,
    contactDamage: 0.5,
    experienceValue: 4,
    armour: 1,
    steeringProfile: "chaseAndFire",
  }),
  abomination: enemy({
    id: "abomination",
    maxHealth: 34,
    radiusMetres: 0.82,
    movementSpeedMetresPerSecond: 1.2,
    contactDamage: 1.2,
    experienceValue: 8,
    armour: 2,
    steeringProfile: "pursuer",
  }),
  "nest-weaver": enemy({
    id: "nest-weaver",
    maxHealth: 18,
    radiusMetres: 0.62,
    movementSpeedMetresPerSecond: 1.3,
    contactDamage: 0.5,
    experienceValue: 6,
    armour: 1,
    steeringProfile: "supportAnchor",
  }),
  "nest-pod": enemy({
    id: "nest-pod",
    maxHealth: 9,
    radiusMetres: 0.62,
    movementSpeedMetresPerSecond: 0,
    contactDamage: 0,
    experienceValue: 0,
    resistances: { fire: 1.35 },
    steeringProfile: "supportAnchor",
  }),
  "nest-hatchling": enemy({
    id: "nest-hatchling",
    maxHealth: 2,
    radiusMetres: 0.3,
    movementSpeedMetresPerSecond: 3.9,
    contactDamage: 0.75,
    experienceValue: 1,
    steeringProfile: "rushPack",
  }),
  "storm-savant": enemy({
    id: "storm-savant",
    maxHealth: 16,
    radiusMetres: 0.58,
    movementSpeedMetresPerSecond: 1.4,
    contactDamage: 0.5,
    experienceValue: 6,
    armour: 1,
    resistances: { shock: 0.45 },
    steeringProfile: "standoffShooter",
  }),
  "storm-node": enemy({
    id: "storm-node",
    maxHealth: 6,
    radiusMetres: 0.42,
    movementSpeedMetresPerSecond: 0,
    contactDamage: 0,
    experienceValue: 0,
    resistances: { shock: 0.5 },
    steeringProfile: "supportAnchor",
  }),
  "scrap-skitterer": enemy({
    id: "scrap-skitterer",
    maxHealth: 4,
    radiusMetres: 0.38,
    movementSpeedMetresPerSecond: 2.15,
    contactDamage: 0,
    experienceValue: 1,
    resistances: { shock: 1.5 },
    steeringProfile: "rushPack",
  }),
  "arc-warden": enemy({
    id: "arc-warden",
    maxHealth: 12,
    radiusMetres: 0.52,
    movementSpeedMetresPerSecond: 1.55,
    contactDamage: 0.5,
    experienceValue: 4,
    armour: 2,
    resistances: { shock: 1.5 },
    steeringProfile: "standoffShooter",
  }),
  "cyborg-reclaimer": enemy({
    id: "cyborg-reclaimer",
    maxHealth: 18,
    radiusMetres: 0.64,
    movementSpeedMetresPerSecond: 1.35,
    contactDamage: 0.8,
    experienceValue: 6,
    armour: 3,
    resistances: { shock: 1.4 },
    steeringProfile: "supportAnchor",
  }),
  "foundry-fabricator": enemy({
    id: "foundry-fabricator",
    maxHealth: 22,
    radiusMetres: 0.7,
    movementSpeedMetresPerSecond: 1.15,
    contactDamage: 0.6,
    experienceValue: 7,
    armour: 3,
    resistances: { shock: 1.4 },
    steeringProfile: "supportAnchor",
  }),
  "foundry-pad": enemy({
    id: "foundry-pad",
    maxHealth: 6,
    radiusMetres: 0.52,
    movementSpeedMetresPerSecond: 0,
    contactDamage: 0,
    experienceValue: 0,
    resistances: { shock: 1.4 },
    steeringProfile: "supportAnchor",
  }),
  "foundry-drone": enemy({
    id: "foundry-drone",
    maxHealth: 4,
    radiusMetres: 0.34,
    movementSpeedMetresPerSecond: 3.1,
    contactDamage: 0.75,
    experienceValue: 0,
    resistances: { shock: 1.5 },
    steeringProfile: "rushPack",
  }),
  "foundry-turret": enemy({
    id: "foundry-turret",
    maxHealth: 6,
    radiusMetres: 0.46,
    movementSpeedMetresPerSecond: 0,
    contactDamage: 0,
    experienceValue: 0,
    armour: 1,
    resistances: { shock: 1.5 },
    steeringProfile: "standoffShooter",
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
  "synapse-herald": enemy({
    id: "synapse-herald",
    maxHealth: 560,
    radiusMetres: 1.02,
    movementSpeedMetresPerSecond: 1.55,
    contactDamage: 1.2,
    experienceValue: 0,
    flatDamageReduction: 2,
    resistances: { shock: 0.8 },
    steeringProfile: "flanker",
  }),
  "assembly-prime": enemy({
    id: "assembly-prime",
    maxHealth: 720,
    radiusMetres: 1.16,
    movementSpeedMetresPerSecond: 1.25,
    contactDamage: 1.5,
    experienceValue: 0,
    flatDamageReduction: 3,
    resistances: { shock: 0.75 },
    steeringProfile: "supportAnchor",
  }),
  "storm-regent": enemy({
    id: "storm-regent",
    maxHealth: 760,
    radiusMetres: 1.18,
    movementSpeedMetresPerSecond: 1.3,
    contactDamage: 1.4,
    experienceValue: 0,
    flatDamageReduction: 2,
    resistances: { shock: 0.7 },
    steeringProfile: "supportAnchor",
  }),
  "abomination-prime": enemy({
    id: "abomination-prime",
    maxHealth: 920,
    radiusMetres: 1.28,
    movementSpeedMetresPerSecond: 1.25,
    contactDamage: 1.6,
    experienceValue: 0,
    flatDamageReduction: 3,
    resistances: { toxic: 0.65 },
    steeringProfile: "pursuer",
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
