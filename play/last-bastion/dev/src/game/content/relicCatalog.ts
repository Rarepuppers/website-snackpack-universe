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
  | "rel-kinetic-greaves"
  | "rel-butchers-rig"
  | "rel-riot-plating"
  | "rel-executioners-mark"
  | "rel-breachers-wedge"
  | "rel-coolant-loop"
  | "rel-element-primer"
  | "rel-salvage-optics"
  | "rel-overwatch-rig";

export type ArtifactId =
  | "art-event-horizon-core"
  | "art-broodbreaker-seal"
  | "art-last-bastion-protocol"
  | "art-scavengers-manifest"
  | "art-symbiote-heart"
  | "art-berserkers-chip"
  | "art-aegis-reactor"
  | "art-overclock-core"
  | "art-chrono-capacitor"
  | "art-bastion-beacon"
  | "art-null-field"
  | "art-warp-anchor";

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
  { id: "rel-butchers-rig", name: "Butcher's Rig", description: "Melee weapons hit considerably harder." },
  { id: "rel-riot-plating", name: "Riot Plating", description: "You gain armour while anything is inside arm's reach." },
  { id: "rel-executioners-mark", name: "Executioner's Mark", description: "You deal bonus damage to badly wounded enemies." },
  // 31 July 2026. Wedge and Coolant Loop were designed alongside the released
  // weapons and never built; the other three back build directions the rack
  // now supports but nothing rewarded — terrain play, status stacking, and
  // holding a firing position.
  { id: "rel-breachers-wedge", name: "Breacher's Wedge", description: "You tear through cover and world objects far faster." },
  { id: "rel-coolant-loop", name: "Coolant Loop", description: "Sustained beam weapons run hotter without falling off." },
  { id: "rel-element-primer", name: "Element Primer", description: "Your elemental hits build status effects much faster." },
  { id: "rel-salvage-optics", name: "Salvage Optics", description: "Destroying a world object shakes loose a little Scrap." },
  { id: "rel-overwatch-rig", name: "Overwatch Rig", description: "Holding still briefly sharpens your ranged damage." },
]);

export const ARTIFACT_CATALOG: readonly ArtifactDefinition[] = Object.freeze([
  { id: "art-event-horizon-core", name: "Event Horizon Core", description: "Periodically turns your next projectile impact into a pull-and-implode event." },
  { id: "art-broodbreaker-seal", name: "Broodbreaker Seal", description: "Destroyed eggs damage nearby aliens and cannot hatch during their final crack window." },
  { id: "art-last-bastion-protocol", name: "Last Bastion Protocol", description: "At critical health your weapons brace into a tighter, faster formation; long cooldown." },
  { id: "art-scavengers-manifest", name: "Scavenger's Manifest", description: "Doubles the Scrap you collect." },
  { id: "art-symbiote-heart", name: "Symbiote Heart", description: "Killing an enemy restores a sliver of health." },
  { id: "art-berserkers-chip", name: "Berserker's Chip", description: "The lower your health, the more damage you deal — up to +50% at critical." },
  { id: "art-aegis-reactor", name: "Aegis Reactor", description: "Your shield recharges faster and starts sooner after taking damage." },
  { id: "art-overclock-core", name: "Overclock Core", description: "Each kill briefly stacks fire rate; the stacks decay if you stop killing." },
  { id: "art-chrono-capacitor", name: "Chrono Capacitor", description: "Dodging an attack refunds part of your evasive cooldown." },
  { id: "art-bastion-beacon", name: "Bastion Beacon", description: "The first death in a run leaves you standing at a sliver of health. Once only." },
  { id: "art-null-field", name: "Null Field", description: "The first hit you take each wave is negated entirely." },
  { id: "art-warp-anchor", name: "Warp Anchor", description: "Taking a hit blinks you a short distance away from the attacker." },
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
  /** Breacher's Wedge: multiplier on damage dealt to terrain and world objects. */
  terrainDamageMultiplier: number;
  /** Coolant Loop: multiplier on sustained beam damage. */
  beamDamageMultiplier: number;
  /** Element Primer: multiplier on status buildup dealt by elemental hits. */
  statusBuildupMultiplier: number;
  /** Scavenger's Eye: Scrap granted when a destructible world object dies. */
  scrapPerWorldObjectDestroyed: number;
  /** Overwatch Rig: seconds stationary before the ranged bonus applies. */
  stationaryRangedBonusAfterSeconds: number | null;
  /** Overwatch Rig: extra ranged damage fraction once that threshold is met. */
  stationaryRangedBonusDamage: number;
  /** The single equipped artifact, or null. */
  equippedArtifactId: ArtifactId | null;
  /** Event Horizon Core: seconds between implosion charges, or null. */
  /** Butcher's Rig: multiplies melee-pattern weapon damage. */
  meleeDamageMultiplier: number;
  /** Riot Plating: extra armour while an enemy is within arm's reach. */
  closeQuartersArmour: number;
  /** Executioner's Mark: bonus damage fraction against badly wounded enemies. */
  executeBonusDamage: number;
  /** Overclock Core: fire-rate gained per kill stack, and how many stack. */
  fireRatePerKill: number;
  fireRateKillStackCap: number;
  /** Chrono Capacitor: fraction of the evasive cooldown refunded on a dodge. */
  evasiveRefundOnDodge: number;
  /** Bastion Beacon: survive the first lethal hit of the run once. */
  revivesOnce: boolean;
  /** Null Field: negate the first hit taken each wave. */
  negatesFirstHitPerWave: boolean;
  /** Warp Anchor: metres blinked away from an attacker when hit. */
  blinkOnHitMetres: number;
  implosionEverySeconds: number | null;
  /** Broodbreaker Seal: damage dealt to nearby aliens when an egg dies. */
  eggDeathDamage: number;
  /** Broodbreaker Seal: eggs cannot hatch during their final crack window. */
  preventHatchDuringCrack: boolean;
  /** Last Bastion Protocol: brace the weapon ring at critical health. */
  criticalHealthBraceFormation: boolean;
  /** Scavenger's Manifest: multiplier on all Scrap collected. */
  scrapMultiplier: number;
  /** Symbiote Heart: health restored per enemy kill. */
  lifestealPerKill: number;
  /** Berserker's Chip: extra outgoing-damage fraction at 0 health, scaling with missing health. */
  berserkerMaxBonusDamage: number;
  /** Aegis Reactor: multiplier on shield recharge rate (>1 is faster). */
  shieldRechargeMultiplier: number;
  /** Aegis Reactor: multiplier on the post-damage shield recharge delay (<1 is sooner). */
  shieldRechargeDelayMultiplier: number;
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
  terrainDamageMultiplier: 1,
  beamDamageMultiplier: 1,
  statusBuildupMultiplier: 1,
  scrapPerWorldObjectDestroyed: 0,
  stationaryRangedBonusAfterSeconds: null,
  stationaryRangedBonusDamage: 0,
  equippedArtifactId: null,
  meleeDamageMultiplier: 1,
  closeQuartersArmour: 0,
  executeBonusDamage: 0,
  fireRatePerKill: 0,
  fireRateKillStackCap: 0,
  evasiveRefundOnDodge: 0,
  revivesOnce: false,
  negatesFirstHitPerWave: false,
  blinkOnHitMetres: 0,
  implosionEverySeconds: null,
  eggDeathDamage: 0,
  preventHatchDuringCrack: false,
  criticalHealthBraceFormation: false,
  scrapMultiplier: 1,
  lifestealPerKill: 0,
  berserkerMaxBonusDamage: 0,
  shieldRechargeMultiplier: 1,
  shieldRechargeDelayMultiplier: 1,
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
  if (owned.has("rel-butchers-rig")) {
    modifiers.meleeDamageMultiplier = 1.25;
  }
  if (owned.has("rel-riot-plating")) {
    modifiers.closeQuartersArmour = 4;
  }
  if (owned.has("rel-executioners-mark")) {
    modifiers.executeBonusDamage = 0.5;
  }
  if (owned.has("rel-kinetic-greaves")) {
    modifiers.evasiveDistanceMultiplier = 1.25;
    modifiers.evasiveRecoveryMultiplier = 1.2;
  }
  if (owned.has("rel-breachers-wedge")) {
    modifiers.terrainDamageMultiplier = 2.5;
  }
  if (owned.has("rel-coolant-loop")) {
    modifiers.beamDamageMultiplier = 1.3;
  }
  if (owned.has("rel-element-primer")) {
    modifiers.statusBuildupMultiplier = 2;
  }
  if (owned.has("rel-salvage-optics")) {
    modifiers.scrapPerWorldObjectDestroyed = 1;
  }
  if (owned.has("rel-overwatch-rig")) {
    modifiers.stationaryRangedBonusAfterSeconds = 1.5;
    modifiers.stationaryRangedBonusDamage = 0.25;
  }

  if (equippedArtifactId && isArtifactId(equippedArtifactId)) {
    modifiers.equippedArtifactId = equippedArtifactId;
    switch (equippedArtifactId) {
      case "art-event-horizon-core":
        modifiers.implosionEverySeconds = 8;
        break;
      case "art-overclock-core":
        modifiers.fireRatePerKill = 0.06;
        modifiers.fireRateKillStackCap = 5;
        break;
      case "art-chrono-capacitor":
        modifiers.evasiveRefundOnDodge = 0.5;
        break;
      case "art-bastion-beacon":
        modifiers.revivesOnce = true;
        break;
      case "art-null-field":
        modifiers.negatesFirstHitPerWave = true;
        break;
      case "art-warp-anchor":
        modifiers.blinkOnHitMetres = 3;
        break;
      case "art-broodbreaker-seal":
        modifiers.eggDeathDamage = 4;
        modifiers.preventHatchDuringCrack = true;
        break;
      case "art-last-bastion-protocol":
        modifiers.criticalHealthBraceFormation = true;
        break;
      case "art-scavengers-manifest":
        modifiers.scrapMultiplier = 2;
        break;
      case "art-symbiote-heart":
        modifiers.lifestealPerKill = 0.15;
        break;
      case "art-berserkers-chip":
        modifiers.berserkerMaxBonusDamage = 0.5;
        break;
      case "art-aegis-reactor":
        modifiers.shieldRechargeMultiplier = 1.6;
        modifiers.shieldRechargeDelayMultiplier = 0.5;
        break;
    }
  }

  return modifiers;
}
