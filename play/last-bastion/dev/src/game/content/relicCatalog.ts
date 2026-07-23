/**
 * Relics and Artifacts (Task 94 reward pool), the run-long item layer distinct
 * from level-up upgrades and pre-drop perks. Designed in `last-bastion-game.md`
 * ("Progression") and `last-bastion-content.md` ("First relic set" / "First
 * Artifact set"); magnitudes here are the tuning-pass proposals that will move
 * to `wave_balance.md` when balance opens.
 *
 * This mirrors `perkCatalog`: the catalog is pure data, and
 * `resolveRelicModifiers` folds the owned relics plus the single equipped
 * artifact into one flat `RelicRunModifiers` bag that combat reads at the same
 * kind of resolution points it already reads `PerkRunModifiers`. Numeric fields
 * combine directly; behavioural effects that need a combat hook are exposed as
 * flags the simulation consumes when each is wired. Keeping this a pure
 * boundary means the resolver is unit-testable and the event catalogue,
 * codex, and future in-run reward screen all request the same stable ids.
 */

export type RelicId =
  | "rel-stabiliser-gyro"
  | "rel-salvaged-capacitor"
  | "rel-blast-baffle"
  | "rel-hunters-beacon"
  | "rel-field-lattice"
  | "rel-kinetic-greaves";

export type ArtifactId =
  | "art-event-horizon-core"
  | "art-broodbreaker-seal"
  | "art-last-bastion-protocol";

export interface RelicDefinition {
  id: RelicId;
  name: string;
  /** Player-facing rule change, matching the codex copy. */
  description: string;
}

export interface ArtifactDefinition {
  id: ArtifactId;
  name: string;
  description: string;
}

export const RELIC_CATALOG: readonly RelicDefinition[] = Object.freeze([
  { id: "rel-stabiliser-gyro", name: "Stabiliser Gyro", description: "Weapon spread narrows while you are moving." },
  { id: "rel-salvaged-capacitor", name: "Salvaged Capacitor", description: "Every fifth non-melee hit arcs a small chain to a nearby enemy." },
  { id: "rel-blast-baffle", name: "Blast Baffle", description: "Self and explosive damage to you is halved; your explosions are slightly larger." },
  { id: "rel-hunters-beacon", name: "Hunter's Beacon", description: "Elites are marked earlier and take bonus damage right after a telegraphed miss." },
  { id: "rel-field-lattice", name: "Field Lattice", description: "Picking up health emits a short slowing pulse around you." },
  { id: "rel-kinetic-greaves", name: "Kinetic Greaves", description: "Your evasive move travels further, but its recovery is slightly longer." },
]);

export const ARTIFACT_CATALOG: readonly ArtifactDefinition[] = Object.freeze([
  { id: "art-event-horizon-core", name: "Event Horizon Core", description: "Periodically turns your next projectile impact into a pull-and-implode event." },
  { id: "art-broodbreaker-seal", name: "Broodbreaker Seal", description: "Destroyed eggs damage nearby aliens and cannot hatch during their final crack window." },
  { id: "art-last-bastion-protocol", name: "Last Bastion Protocol", description: "At critical health your weapons brace into a tighter, faster formation; long cooldown." },
]);

export const RELIC_IDS: readonly RelicId[] = Object.freeze(RELIC_CATALOG.map((relic) => relic.id));
export const ARTIFACT_IDS: readonly ArtifactId[] = Object.freeze(ARTIFACT_CATALOG.map((artifact) => artifact.id));

/**
 * The flat, resolved effect bag combat reads. Numeric multipliers default to 1
 * (no change); additive bonuses default to 0; behavioural hooks default off.
 * A `null` cadence means "this relic is not owned".
 */
export interface RelicRunModifiers {
  /** Stabiliser Gyro: spread multiplier applied while the hero is moving. */
  movingSpreadMultiplier: number;
  /** Salvaged Capacitor: fire a chain arc on every Nth non-melee hit, or null. */
  chainArcEveryNthAttack: number | null;
  /** Salvaged Capacitor: damage of that chain arc, on the 2-damage baseline. */
  chainArcDamage: number;
  /** Blast Baffle: multiplier on explosive/self damage the hero takes. */
  selfExplosiveDamageMultiplier: number;
  /** Blast Baffle: multiplier on the hero's own explosion radius. */
  explosionRadiusMultiplier: number;
  /** Hunter's Beacon: elites acquire their mark sooner. */
  eliteMarkedEarlier: boolean;
  /** Hunter's Beacon: extra fraction of damage to an elite just after it whiffs. */
  eliteBonusDamageAfterMiss: number;
  /** Field Lattice: health pickups emit a slowing pulse. */
  healthPickupSlowPulse: boolean;
  /** Kinetic Greaves: evasive-move distance multiplier. */
  evasiveDistanceMultiplier: number;
  /** Kinetic Greaves: evasive-move recovery multiplier (the cost). */
  evasiveRecoveryMultiplier: number;
  /** The single equipped artifact, or null. */
  equippedArtifactId: ArtifactId | null;
  /** Event Horizon Core: seconds between implosion charges, or null. */
  implosionEverySeconds: number | null;
  /** Broodbreaker Seal: damage dealt to nearby aliens when an egg dies. */
  eggDeathDamage: number;
  /** Broodbreaker Seal: eggs cannot hatch during their final crack window. */
  preventHatchDuringCrack: boolean;
  /** Last Bastion Protocol: brace the weapon ring at critical health. */
  criticalHealthBraceFormation: boolean;
}

export const NO_RELIC_MODIFIERS: Readonly<RelicRunModifiers> = Object.freeze({
  movingSpreadMultiplier: 1,
  chainArcEveryNthAttack: null,
  chainArcDamage: 0,
  selfExplosiveDamageMultiplier: 1,
  explosionRadiusMultiplier: 1,
  eliteMarkedEarlier: false,
  eliteBonusDamageAfterMiss: 0,
  healthPickupSlowPulse: false,
  evasiveDistanceMultiplier: 1,
  evasiveRecoveryMultiplier: 1,
  equippedArtifactId: null,
  implosionEverySeconds: null,
  eggDeathDamage: 0,
  preventHatchDuringCrack: false,
  criticalHealthBraceFormation: false,
});

export function isRelicId(value: unknown): value is RelicId {
  return typeof value === "string" && RELIC_CATALOG.some((relic) => relic.id === value);
}

export function isArtifactId(value: unknown): value is ArtifactId {
  return typeof value === "string" && ARTIFACT_CATALOG.some((artifact) => artifact.id === value);
}

export function relicById(id: RelicId): RelicDefinition {
  return RELIC_CATALOG.find((relic) => relic.id === id)!;
}

export function artifactById(id: ArtifactId): ArtifactDefinition {
  return ARTIFACT_CATALOG.find((artifact) => artifact.id === id)!;
}

/**
 * Folds owned relics and one equipped artifact into a single modifier bag.
 * Duplicate relic ids apply once (the design allows one copy unless stated),
 * unknown ids are ignored, and a null/absent artifact leaves the artifact
 * fields at their neutral defaults.
 */
export function resolveRelicModifiers(
  ownedRelicIds: readonly RelicId[] | null | undefined,
  equippedArtifactId: ArtifactId | null | undefined,
): RelicRunModifiers {
  const modifiers: RelicRunModifiers = { ...NO_RELIC_MODIFIERS };
  const owned = new Set((ownedRelicIds ?? []).filter(isRelicId));

  if (owned.has("rel-stabiliser-gyro")) {
    modifiers.movingSpreadMultiplier = 0.65;
  }
  if (owned.has("rel-salvaged-capacitor")) {
    modifiers.chainArcEveryNthAttack = 5;
    modifiers.chainArcDamage = 2;
  }
  if (owned.has("rel-blast-baffle")) {
    modifiers.selfExplosiveDamageMultiplier = 0.5;
    modifiers.explosionRadiusMultiplier = 1.15;
  }
  if (owned.has("rel-hunters-beacon")) {
    modifiers.eliteMarkedEarlier = true;
    modifiers.eliteBonusDamageAfterMiss = 0.15;
  }
  if (owned.has("rel-field-lattice")) {
    modifiers.healthPickupSlowPulse = true;
  }
  if (owned.has("rel-kinetic-greaves")) {
    modifiers.evasiveDistanceMultiplier = 1.25;
    modifiers.evasiveRecoveryMultiplier = 1.2;
  }

  if (equippedArtifactId && isArtifactId(equippedArtifactId)) {
    modifiers.equippedArtifactId = equippedArtifactId;
    switch (equippedArtifactId) {
      case "art-event-horizon-core":
        modifiers.implosionEverySeconds = 8;
        break;
      case "art-broodbreaker-seal":
        modifiers.eggDeathDamage = 4;
        modifiers.preventHatchDuringCrack = true;
        break;
      case "art-last-bastion-protocol":
        modifiers.criticalHealthBraceFormation = true;
        break;
    }
  }

  return modifiers;
}
