import type { DamageType } from "../combat/damageTypes";
import type { WeaponClass } from "../hero/HeroDefinition";

export type WeaponId = "bastion-service-rifle" | "scattergun" | "arc-carbine" | "patrol-blade" | "bolt-carbine" | "bulwark-rotary-cannon" | "grenade-tube" | "injector-carbine" | "railspike" | "seeker-swarm" | "cryo-lance" | "tesla-coil" | "flamethrower" | "sawblade" | "event-horizon"
  | "combat-knife" | "machete" | "fire-axe" | "shock-baton" | "breaching-maul" | "plasma-saber"
  | "corrosive-lobber" | "scourge-repeater" | "bile-lance" | "rime-cleaver" | "hoarfrost-scatter" | "glacier-ward" | "tether-harpoon"
  | "sentry-stake"
  | "auxiliary-drone"
  // Added 8 Aug 2026 (content plan, weapon Tier 1). Each exists to close a
  // damage-type/pattern hole, not to raise the count: Fire had no ranged
  // projectile at all, Shock had no beam, and Toxic had no melee.
  | "emberlance" | "storm-coil-beam" | "blight-scythe";
export type WeaponTargetingMode = "cursor" | "nearest-enemy";
export type WeaponAttackPattern = "projectile" | "scatter" | "chain-projectile" | "melee-sweep" | "beam" | "orbit" | "orbit-blade" | "deployable";

/** Autonomous support/cadence weapons ignore the global trigger mode. */
export function shouldWeaponFire(
  weapon: Pick<WeaponRuntimeStats, "firesAutomatically">,
  autoFireEnabled: boolean,
  triggerHeld: boolean,
): boolean {
  return weapon.firesAutomatically || autoFireEnabled || triggerHeld;
}

export interface WeaponRuntimeStats {
  id: WeaponId;
  displayName: string;
  description: string;
  weaponClass: WeaponClass;
  damageType: DamageType;
  targetingMode: WeaponTargetingMode;
  attackPattern: WeaponAttackPattern;
  rangeMetres: number;
  fireIntervalSeconds: number;
  projectileSpeedMetresPerSecond: number;
  projectileLifetimeSeconds: number;
  projectileDamage: number;
  projectileCount: number;
  spreadRadians: number;
  pierceCount: number;
  explosionRadiusMetres: number;
  knockbackMetres: number;
  chainCount: number;
  chainRadiusMetres: number;
  meleeArcRadians: number;
  firesAutomatically: boolean;
  /** Non-zero turns fired projectiles toward the nearest live enemy each frame, at this many radians/second (Seeker Swarm). */
  homingTurnRateRadiansPerSecond: number;
  /**
   * Non-zero makes this an `attackPattern: "beam"` weapon: continuous
   * per-second tick damage to every enemy inside a forward cone sized by
   * `meleeArcRadians`, for as long as it fires (Cryo Lance, Flamethrower).
   * Also doubles as the contact damage-per-second for `attackPattern:
   * "orbit-blade"` (Sawblade).
   */
  beamDamagePerSecond: number;
  /** `attackPattern: "orbit-blade"`: distance the blade orbits from the player (Sawblade). */
  orbitRadiusMetres: number;
  /** `attackPattern: "orbit-blade"`: how fast the blade spins around the player (Sawblade). */
  orbitAngularSpeedRadiansPerSecond: number;
  /**
   * True trades this projectile's normal instant explosion for a delayed
   * gravity-well field: on impact/expiry it pulls nearby enemies inward for
   * `pullFieldDurationSeconds`, then implodes for `projectileDamage` in
   * `explosionRadiusMetres` (Event Horizon, the Unique).
   */
  spawnsGravityWellOnImpact: boolean;
  pullFieldDurationSeconds: number;
  pullStrengthMetresPerSecond: number;
  pullRadiusMetres: number;
  /**
   * Multiplies damage dealt to arena obstacles. Breaching tools cut cover apart
   * in a couple of swings; a knife barely scratches it. 1 = ordinary.
   */
  terrainDamageMultiplier: number;
  /** Deployables only: seconds a placed unit stands before expiring. */
  deployLifetimeSeconds: number;
  /** Deployables only: how many of this weapon's units may exist at once. */
  deployMaxActive: number;
  /** Deployables only: hit points, so a swarm can chew one down. */
  deployHealth: number;
  /** Deployables only: seconds between the unit's own shots. */
  deployFireIntervalSeconds: number;
}

export const BASTION_SERVICE_RIFLE: Readonly<WeaponRuntimeStats> = weapon({
  id: "bastion-service-rifle",
  displayName: "Bastion Service Rifle",
  description: "Accurate cursor-aimed automatic rifle.",
  weaponClass: "medium",
  damageType: "physical",
  targetingMode: "cursor",
  attackPattern: "projectile",
  rangeMetres: 22,
  fireIntervalSeconds: 0.14,
  projectileSpeedMetresPerSecond: 19,
  projectileLifetimeSeconds: 1.15,
  projectileDamage: 2,
});

export const SCATTERGUN: Readonly<WeaponRuntimeStats> = weapon({
  id: "scattergun",
  displayName: "Scattergun",
  description: "Close-range five-pellet burst with heavy knockback.",
  weaponClass: "heavy",
  damageType: "physical",
  targetingMode: "cursor",
  attackPattern: "scatter",
  rangeMetres: 7,
  fireIntervalSeconds: 0.72,
  projectileSpeedMetresPerSecond: 16,
  projectileLifetimeSeconds: 0.42,
  projectileDamage: 1,
  projectileCount: 5,
  spreadRadians: 0.13,
  knockbackMetres: 0.55,
});

export const ARC_CARBINE: Readonly<WeaponRuntimeStats> = weapon({
  id: "arc-carbine",
  displayName: "Arc Carbine",
  description: "Auto-targets a nearby enemy; shock damage that chains.",
  weaponClass: "light",
  damageType: "shock",
  targetingMode: "nearest-enemy",
  attackPattern: "chain-projectile",
  rangeMetres: 10,
  fireIntervalSeconds: 0.62,
  projectileSpeedMetresPerSecond: 14,
  projectileLifetimeSeconds: 0.75,
  projectileDamage: 3,
  chainCount: 1,
  chainRadiusMetres: 3.2,
  firesAutomatically: true,
});

export const PATROL_BLADE: Readonly<WeaponRuntimeStats> = weapon({
  id: "patrol-blade",
  displayName: "Patrol Blade",
  description: "Automatic short-range mono-blade sweep that peels nearby enemies.",
  weaponClass: "light",
  damageType: "physical",
  targetingMode: "nearest-enemy",
  attackPattern: "melee-sweep",
  rangeMetres: 2.4,
  fireIntervalSeconds: 2.5,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 4,
  knockbackMetres: 0.35,
  meleeArcRadians: Math.PI * 0.72,
  firesAutomatically: true,
});

export const BOLT_CARBINE: Readonly<WeaponRuntimeStats> = weapon({
  id: "bolt-carbine",
  displayName: "Bolt Carbine",
  description: "Slow precision bolt that penetrates exactly one target.",
  weaponClass: "medium",
  damageType: "physical",
  targetingMode: "cursor",
  attackPattern: "projectile",
  rangeMetres: 18,
  fireIntervalSeconds: 1.8,
  projectileSpeedMetresPerSecond: 12,
  projectileLifetimeSeconds: 1.5,
  projectileDamage: 5,
  pierceCount: 1,
});

export const BULWARK_ROTARY_CANNON: Readonly<WeaponRuntimeStats> = weapon({
  id: "bulwark-rotary-cannon",
  displayName: "Bulwark Rotary Cannon",
  description: "Heavy close-mid suppressive cannon with fast reusable ballistic tracers.",
  weaponClass: "heavy",
  damageType: "physical",
  targetingMode: "cursor",
  attackPattern: "projectile",
  rangeMetres: 14,
  fireIntervalSeconds: 0.08,
  projectileSpeedMetresPerSecond: 24,
  projectileLifetimeSeconds: 0.58,
  projectileDamage: 2,
  knockbackMetres: 0.08,
});

export const GRENADE_TUBE: Readonly<WeaponRuntimeStats> = weapon({
  id: "grenade-tube",
  displayName: "Bastion Grenade Tube",
  description: "Slow explosive shell with a readable fuse and compact blast radius.",
  weaponClass: "heavy",
  damageType: "physical",
  targetingMode: "cursor",
  attackPattern: "projectile",
  rangeMetres: 10,
  fireIntervalSeconds: 4,
  projectileSpeedMetresPerSecond: 8,
  projectileLifetimeSeconds: 1.15,
  projectileDamage: 4,
  explosionRadiusMetres: 2.2,
  knockbackMetres: 0.45,
});

export const INJECTOR_CARBINE: Readonly<WeaponRuntimeStats> = weapon({
  id: "injector-carbine",
  displayName: "Injector Carbine",
  description: "Light toxic flechettes; every sixth Medic hit triggers Triage Loop.",
  weaponClass: "light",
  damageType: "toxic",
  targetingMode: "cursor",
  attackPattern: "projectile",
  rangeMetres: 15,
  fireIntervalSeconds: 0.32,
  projectileSpeedMetresPerSecond: 18,
  projectileLifetimeSeconds: 0.85,
  projectileDamage: 1.6,
  pierceCount: 0,
});

export const RAILSPIKE: Readonly<WeaponRuntimeStats> = weapon({
  id: "railspike",
  displayName: "Railspike",
  description: "Slow charged rail lance that pierces an entire lane of enemies.",
  weaponClass: "heavy",
  damageType: "physical",
  targetingMode: "cursor",
  attackPattern: "projectile",
  rangeMetres: 20,
  fireIntervalSeconds: 3.2,
  projectileSpeedMetresPerSecond: 22,
  projectileLifetimeSeconds: 0.95,
  projectileDamage: 9,
  pierceCount: 6,
  knockbackMetres: 0.2,
});

export const SEEKER_SWARM: Readonly<WeaponRuntimeStats> = weapon({
  id: "seeker-swarm",
  displayName: "Seeker Swarm",
  description: "A volley of light micro-missiles that curve to chase the nearest target.",
  weaponClass: "light",
  damageType: "physical",
  targetingMode: "cursor",
  attackPattern: "projectile",
  rangeMetres: 12,
  fireIntervalSeconds: 1.1,
  projectileSpeedMetresPerSecond: 9,
  projectileLifetimeSeconds: 1.6,
  projectileDamage: 1.4,
  projectileCount: 3,
  spreadRadians: 0.35,
  homingTurnRateRadiansPerSecond: 5,
});

export const CRYO_LANCE: Readonly<WeaponRuntimeStats> = weapon({
  id: "cryo-lance",
  displayName: "Cryo Lance",
  description: "A sustained beam that chills everything held in its narrow forward cone.",
  weaponClass: "medium",
  damageType: "cryo",
  targetingMode: "cursor",
  attackPattern: "beam",
  rangeMetres: 6,
  fireIntervalSeconds: 0,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 0,
  beamDamagePerSecond: 3,
  meleeArcRadians: 0.16,
});

export const TESLA_COIL: Readonly<WeaponRuntimeStats> = weapon({
  id: "tesla-coil",
  displayName: "Tesla Coil",
  description: "A passive orbiting coil that periodically arcs Shock to the nearest enemies.",
  weaponClass: "light",
  damageType: "shock",
  targetingMode: "nearest-enemy",
  attackPattern: "orbit",
  rangeMetres: 4,
  fireIntervalSeconds: 0.9,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 2,
  chainCount: 2,
  chainRadiusMetres: 3,
  firesAutomatically: true,
});

export const FLAMETHROWER: Readonly<WeaponRuntimeStats> = weapon({
  id: "flamethrower",
  displayName: "Flamethrower",
  description: "A short, wide cone of sustained fire that builds Blaze on everything it touches.",
  weaponClass: "heavy",
  damageType: "fire",
  targetingMode: "cursor",
  attackPattern: "beam",
  rangeMetres: 3.2,
  fireIntervalSeconds: 0,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 0,
  beamDamagePerSecond: 5,
  meleeArcRadians: 0.9,
});

export const SAWBLADE: Readonly<WeaponRuntimeStats> = weapon({
  id: "sawblade",
  displayName: "Sawblade",
  description: "A physical blade that spins in a tight orbit around you, biting anything it touches.",
  weaponClass: "medium",
  damageType: "physical",
  targetingMode: "nearest-enemy",
  attackPattern: "orbit-blade",
  rangeMetres: 20,
  fireIntervalSeconds: 0,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 0,
  beamDamagePerSecond: 4,
  orbitRadiusMetres: 1.1,
  orbitAngularSpeedRadiansPerSecond: 4.5,
  firesAutomatically: true,
});

export const EVENT_HORIZON: Readonly<WeaponRuntimeStats> = weapon({
  id: "event-horizon",
  displayName: "Event Horizon",
  description: "Unique: a slow gravitic orb that pulls enemies into itself before imploding.",
  weaponClass: "unique",
  damageType: "physical",
  targetingMode: "cursor",
  attackPattern: "projectile",
  rangeMetres: 12,
  fireIntervalSeconds: 16,
  projectileSpeedMetresPerSecond: 3,
  projectileLifetimeSeconds: 4,
  projectileDamage: 14,
  explosionRadiusMetres: 2.6,
  spawnsGravityWellOnImpact: true,
  pullFieldDurationSeconds: 1.4,
  pullStrengthMetresPerSecond: 3.5,
  pullRadiusMetres: 4.5,
});

/* ──────────────────────────────────────────────────────────────────────────
   Close-quarters family (25 July 2026)
   ──────────────────────────────────────────────────────────────────────────
   The rack had exactly one melee option (Patrol Blade) against an arena whose
   whole pressure model is "things reach you". These six cover the archetypes
   separately so the choice between them is real:

     stab       narrow arc, fast, cheap    → Combat Knife
     arc        wide swing, crowd peel     → Machete
     ignite     fire proc on contact       → Fire Axe
     chain      shock proc that jumps      → Shock Baton
     knockback  space-clearing shove       → Breaching Maul
     breaching  cuts cover apart           → Plasma Saber

   Reactive tools auto-fire at the nearest body (you do not aim a knife when
   something is already on you); the heavy, deliberate ones stay cursor-aimed.
   ────────────────────────────────────────────────────────────────────────── */

export const COMBAT_KNIFE: Readonly<WeaponRuntimeStats> = weapon({
  id: "combat-knife",
  displayName: "Combat Knife",
  description: "Fast forward thrust. Almost no reach, almost no wind-up.",
  weaponClass: "light",
  damageType: "physical",
  targetingMode: "nearest-enemy",
  attackPattern: "melee-sweep",
  rangeMetres: 1.8,
  fireIntervalSeconds: 0.38,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 2.5,
  // A thrust, not a swing: a narrow cone that only catches what is in front.
  meleeArcRadians: 0.35,
  firesAutomatically: true,
  terrainDamageMultiplier: 0.3,
});

export const MACHETE: Readonly<WeaponRuntimeStats> = weapon({
  id: "machete",
  displayName: "Machete",
  description: "Wide clearing swing that peels a whole doorway off you.",
  weaponClass: "light",
  damageType: "physical",
  targetingMode: "nearest-enemy",
  attackPattern: "melee-sweep",
  rangeMetres: 2.2,
  fireIntervalSeconds: 0.95,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 5,
  meleeArcRadians: Math.PI * 0.6,
  knockbackMetres: 0.3,
  firesAutomatically: true,
});

export const FIRE_AXE: Readonly<WeaponRuntimeStats> = weapon({
  id: "fire-axe",
  displayName: "Fire Axe",
  description: "Heavy incendiary chop. Everything it bites starts burning.",
  weaponClass: "medium",
  damageType: "fire",
  targetingMode: "cursor",
  attackPattern: "melee-sweep",
  rangeMetres: 2.4,
  fireIntervalSeconds: 1.4,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 6,
  meleeArcRadians: Math.PI * 0.5,
  knockbackMetres: 0.4,
  terrainDamageMultiplier: 1.8,
});

export const SHOCK_BATON: Readonly<WeaponRuntimeStats> = weapon({
  id: "shock-baton",
  displayName: "Shock Baton",
  description: "Short jabs that arc Overload into whatever is packed behind.",
  weaponClass: "light",
  damageType: "shock",
  targetingMode: "nearest-enemy",
  attackPattern: "melee-sweep",
  rangeMetres: 2,
  fireIntervalSeconds: 0.7,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 3,
  meleeArcRadians: 0.5,
  chainCount: 1,
  chainRadiusMetres: 2.8,
  firesAutomatically: true,
  terrainDamageMultiplier: 0.4,
});

export const BREACHING_MAUL: Readonly<WeaponRuntimeStats> = weapon({
  id: "breaching-maul",
  displayName: "Breaching Maul",
  description: "Slow two-handed swing that throws bodies and flattens cover.",
  weaponClass: "heavy",
  damageType: "physical",
  targetingMode: "cursor",
  attackPattern: "melee-sweep",
  rangeMetres: 2.6,
  fireIntervalSeconds: 2.2,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 9,
  meleeArcRadians: Math.PI * 0.45,
  // The space-maker: nothing else in the rack shoves this hard.
  knockbackMetres: 1.6,
  terrainDamageMultiplier: 4,
});

export const PLASMA_SABER: Readonly<WeaponRuntimeStats> = weapon({
  id: "plasma-saber",
  displayName: "Plasma Saber",
  description: "A contained plasma edge. Cuts bodies and bulkheads alike.",
  weaponClass: "medium",
  damageType: "fire",
  targetingMode: "cursor",
  attackPattern: "melee-sweep",
  rangeMetres: 3,
  fireIntervalSeconds: 1.1,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 8,
  meleeArcRadians: Math.PI * 0.9,
  terrainDamageMultiplier: 3,
});

/* ──────────────────────────────────────────────────────────────────────────
   Elemental balance pass (31 July 2026)
   ──────────────────────────────────────────────────────────────────────────
   The rack was 13 physical / 3 fire / 3 shock / 1 cryo / 1 toxic. That is a
   problem because `enemyCatalog.ts` builds real counter-play on damage type:
   the machine faction is weak to shock (x1.4-1.5), the storm faction *resists*
   it (x0.45-0.5), organics burn, and toxic organics shrug off toxic. A player
   reading those resistances correctly had almost nothing to reach for — most
   sharply against the storm faction, since all three chain weapons were shock.

   These seven use only existing attack patterns, so nothing new runs at
   runtime. They take cryo to four and toxic to four, and every damage type now
   has a melee, a ranged and an area option.
   ────────────────────────────────────────────────────────────────────────── */

export const CORROSIVE_LOBBER: Readonly<WeaponRuntimeStats> = weapon({
  id: "corrosive-lobber",
  displayName: "Corrosive Lobber",
  description: "Lobs a canister of acid that bursts into a corroding pool of vapour.",
  weaponClass: "heavy",
  damageType: "toxic",
  targetingMode: "cursor",
  attackPattern: "projectile",
  rangeMetres: 11,
  fireIntervalSeconds: 2.6,
  projectileSpeedMetresPerSecond: 7,
  projectileLifetimeSeconds: 1.6,
  projectileDamage: 3,
  explosionRadiusMetres: 2.4,
});

export const SCOURGE_REPEATER: Readonly<WeaponRuntimeStats> = weapon({
  id: "scourge-repeater",
  displayName: "Scourge Repeater",
  description: "Spits clinging blight that leaps between bodies. The answer to shock-proof foes.",
  weaponClass: "medium",
  damageType: "toxic",
  targetingMode: "cursor",
  attackPattern: "chain-projectile",
  rangeMetres: 13,
  fireIntervalSeconds: 0.75,
  projectileSpeedMetresPerSecond: 15,
  projectileLifetimeSeconds: 1.1,
  projectileDamage: 3.5,
  chainCount: 2,
  chainRadiusMetres: 3.4,
});

export const BILE_LANCE: Readonly<WeaponRuntimeStats> = weapon({
  id: "bile-lance",
  displayName: "Bile Lance",
  description: "A pressurised jet of solvent. Wider than the Cryo Lance, longer than the Flamethrower.",
  weaponClass: "medium",
  damageType: "toxic",
  targetingMode: "cursor",
  attackPattern: "beam",
  rangeMetres: 4.5,
  fireIntervalSeconds: 0,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 0,
  beamDamagePerSecond: 4,
  meleeArcRadians: 0.45,
});

export const RIME_CLEAVER: Readonly<WeaponRuntimeStats> = weapon({
  id: "rime-cleaver",
  displayName: "Rime Cleaver",
  description: "A supercooled blade. Every swing seeds Freeze in whatever it opens.",
  weaponClass: "medium",
  damageType: "cryo",
  targetingMode: "cursor",
  attackPattern: "melee-sweep",
  rangeMetres: 2.5,
  fireIntervalSeconds: 1.3,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 6,
  meleeArcRadians: Math.PI * 0.6,
  terrainDamageMultiplier: 1.5,
});

export const HOARFROST_SCATTER: Readonly<WeaponRuntimeStats> = weapon({
  id: "hoarfrost-scatter",
  displayName: "Hoarfrost Scatter",
  description: "A burst of freezing shot. Wide, close, and it stacks Freeze fast on a crowd.",
  weaponClass: "heavy",
  damageType: "cryo",
  targetingMode: "cursor",
  attackPattern: "scatter",
  rangeMetres: 6.5,
  fireIntervalSeconds: 0.95,
  projectileSpeedMetresPerSecond: 16,
  projectileLifetimeSeconds: 0.5,
  projectileDamage: 1.2,
  projectileCount: 4,
  spreadRadians: 0.3,
  knockbackMetres: 0.3,
});

export const GLACIER_WARD: Readonly<WeaponRuntimeStats> = weapon({
  id: "glacier-ward",
  displayName: "Glacier Ward",
  description: "A drifting shard of ice that chills whatever strays closest. Defensive cryo.",
  weaponClass: "light",
  damageType: "cryo",
  targetingMode: "nearest-enemy",
  attackPattern: "orbit",
  rangeMetres: 3.5,
  fireIntervalSeconds: 1.1,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 2.5,
  firesAutomatically: true,
});

/**
 * Reuses Event Horizon's pull field at a fraction of its scale. Like that orb
 * it deals no direct contact hit — `spawnsGravityWellOnImpact` routes all of
 * its damage through the burst — so the fantasy is "yank a group together",
 * not "snipe one thing".
 */
export const TETHER_HARPOON: Readonly<WeaponRuntimeStats> = weapon({
  id: "tether-harpoon",
  displayName: "Tether Harpoon",
  description: "Fires a barbed line that drags everything near the impact into one heap.",
  weaponClass: "medium",
  damageType: "physical",
  targetingMode: "cursor",
  attackPattern: "projectile",
  rangeMetres: 12,
  fireIntervalSeconds: 3.5,
  projectileSpeedMetresPerSecond: 18,
  projectileLifetimeSeconds: 0.9,
  projectileDamage: 5,
  explosionRadiusMetres: 1.6,
  spawnsGravityWellOnImpact: true,
  pullFieldDurationSeconds: 0.5,
  pullStrengthMetresPerSecond: 6,
  pullRadiusMetres: 2.5,
});

/**
 * The first deployable (31 July 2026).
 *
 * `engineering` had been authored in `PlayerStatBlock` and its level-up card
 * written and then deliberately withheld, because no weapon or item read the
 * stat. Rather than delete the stat, this gives it the consumer it was
 * reserved for: the Stake's health, lifetime and cadence all scale with it.
 *
 * Cursor-aimed so placement is a decision — you plant it where you intend to
 * hold, not wherever you happen to face.
 */
export const SENTRY_STAKE: Readonly<WeaponRuntimeStats> = weapon({
  id: "sentry-stake",
  displayName: "Sentry Stake",
  description: "Plants an automated stake that fires on its own until it expires or is torn down.",
  weaponClass: "medium",
  damageType: "physical",
  targetingMode: "cursor",
  attackPattern: "deployable",
  rangeMetres: 9,
  fireIntervalSeconds: 8,
  projectileSpeedMetresPerSecond: 20,
  projectileLifetimeSeconds: 0.8,
  projectileDamage: 2,
  deployLifetimeSeconds: 14,
  deployMaxActive: 2,
  deployHealth: 12,
  deployFireIntervalSeconds: 0.55,
});

/**
 * Internal transformation weapon used by Cybernetic Ascension's Drone
 * Controller. It is deliberately absent from every draft/shop pool: the
 * transformation is its acquisition route and supplies rank-scaled damage.
 */
export const AUXILIARY_DRONE: Readonly<WeaponRuntimeStats> = weapon({
  id: "auxiliary-drone",
  displayName: "Auxiliary Drone",
  description: "A transformation-bound support drone that shadows its operator.",
  weaponClass: "unique",
  damageType: "shock",
  targetingMode: "nearest-enemy",
  attackPattern: "projectile",
  rangeMetres: 8,
  fireIntervalSeconds: 3.5,
  projectileSpeedMetresPerSecond: 15,
  projectileLifetimeSeconds: 0.8,
  projectileDamage: 0,
  firesAutomatically: true,
});

/**
 * Fire's only ranged option. Fire previously existed as one beam and two melee
 * weapons, so a fire build had no way to fight at range — the Emberlance is a
 * slow, arcing lob that trades rate of fire for reliable Blaze application.
 */
export const EMBERLANCE: Readonly<WeaponRuntimeStats> = weapon({
  id: "emberlance",
  displayName: "Emberlance",
  description: "Lobs a slow ember that splashes burning fuel on impact.",
  weaponClass: "medium",
  damageType: "fire",
  targetingMode: "cursor",
  attackPattern: "projectile",
  rangeMetres: 14,
  fireIntervalSeconds: 1.05,
  projectileSpeedMetresPerSecond: 11,
  projectileLifetimeSeconds: 1.4,
  projectileDamage: 4.5,
  explosionRadiusMetres: 1.5,
  terrainDamageMultiplier: 1.2,
});

/**
 * Shock's only beam. Every machine in the game is Shock-weak at 1.4-1.5x, but
 * Shock had three weapons and no sustained option, so the faction's designed
 * weakness was hard to actually exploit. Short and narrow to keep it honest.
 */
export const STORM_COIL_BEAM: Readonly<WeaponRuntimeStats> = weapon({
  id: "storm-coil-beam",
  displayName: "Storm Coil Beam",
  description: "A continuous arc that pours current into whatever it touches.",
  weaponClass: "medium",
  damageType: "shock",
  targetingMode: "cursor",
  attackPattern: "beam",
  rangeMetres: 5.5,
  fireIntervalSeconds: 0,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 0,
  beamDamagePerSecond: 3.5,
  meleeArcRadians: 0.32,
});

/**
 * Toxic's only melee weapon. Toxic had four weapons, all of them ranged, so the
 * close-quarters rack had no Corrode option. Fast and light, leaning on status
 * rather than per-swing damage.
 */
export const BLIGHT_SCYTHE: Readonly<WeaponRuntimeStats> = weapon({
  id: "blight-scythe",
  displayName: "Blight Scythe",
  description: "A wide, fast sweep that leaves solvent in every wound.",
  weaponClass: "light",
  damageType: "toxic",
  targetingMode: "cursor",
  attackPattern: "melee-sweep",
  rangeMetres: 2.3,
  fireIntervalSeconds: 0.8,
  projectileSpeedMetresPerSecond: 0,
  projectileLifetimeSeconds: 0,
  projectileDamage: 3.5,
  meleeArcRadians: Math.PI * 0.75,
});

export const WEAPON_CATALOG: Readonly<Record<WeaponId, Readonly<WeaponRuntimeStats>>> = Object.freeze({
  "bastion-service-rifle": BASTION_SERVICE_RIFLE,
  scattergun: SCATTERGUN,
  "arc-carbine": ARC_CARBINE,
  "patrol-blade": PATROL_BLADE,
  "bolt-carbine": BOLT_CARBINE,
  "bulwark-rotary-cannon": BULWARK_ROTARY_CANNON,
  "grenade-tube": GRENADE_TUBE,
  "injector-carbine": INJECTOR_CARBINE,
  railspike: RAILSPIKE,
  "seeker-swarm": SEEKER_SWARM,
  "cryo-lance": CRYO_LANCE,
  "tesla-coil": TESLA_COIL,
  flamethrower: FLAMETHROWER,
  sawblade: SAWBLADE,
  "event-horizon": EVENT_HORIZON,
  "combat-knife": COMBAT_KNIFE,
  machete: MACHETE,
  "fire-axe": FIRE_AXE,
  "shock-baton": SHOCK_BATON,
  "breaching-maul": BREACHING_MAUL,
  "plasma-saber": PLASMA_SABER,
  "corrosive-lobber": CORROSIVE_LOBBER,
  "scourge-repeater": SCOURGE_REPEATER,
  "bile-lance": BILE_LANCE,
  "rime-cleaver": RIME_CLEAVER,
  "hoarfrost-scatter": HOARFROST_SCATTER,
  "glacier-ward": GLACIER_WARD,
  "tether-harpoon": TETHER_HARPOON,
  "sentry-stake": SENTRY_STAKE,
  "auxiliary-drone": AUXILIARY_DRONE,
  emberlance: EMBERLANCE,
  "storm-coil-beam": STORM_COIL_BEAM,
  "blight-scythe": BLIGHT_SCYTHE,
});

export const VERTICAL_SLICE_WEAPON_IDS: readonly WeaponId[] = Object.freeze([
  "bastion-service-rifle",
  "scattergun",
  "arc-carbine",
]);

/**
 * Weapons the in-run Weapon Chest may offer (content-enablement pass,
 * 17 July 2026). The chest draws a seeded subset of unowned entries, and the
 * scrap shop's weapon line reads the same constant — so anything absent here is
 * unobtainable by any route.
 */
const LIVE_WEAPONS: readonly WeaponId[] = Object.freeze([
  "bastion-service-rifle",
  "scattergun",
  "arc-carbine",
  "patrol-blade",
  "bolt-carbine",
  "bulwark-rotary-cannon",
  "grenade-tube",
  "injector-carbine",
]);

/**
 * Twelve fully built, fully tested weapons — beam, orbit, orbit-blade, homing
 * and gravity-well subsystems among them, plus the whole close-quarters family.
 *
 * **Released 26 July 2026 (creator decision).** The gate was originally "flip
 * when the art batch lands"; the call instead was that thirteen unreachable
 * combat subsystems cost more than placeholder tiles do. They borrow existing
 * tiles and the rifle body sprite, differentiated by damage-type colour and
 * attack-pattern tile grouping (`ui/WeaponTileFrames.ts`,
 * `scenes/PrototypeScene.ts`) until their own art exists. The constant stays so
 * the pool can be closed again for a balance probe.
 */
export const HELD_WEAPONS_IN_POOL = true;

const HELD_WEAPONS: readonly WeaponId[] = Object.freeze([
  "railspike",
  "seeker-swarm",
  "cryo-lance",
  "tesla-coil",
  "flamethrower",
  "sawblade",
  // Close-quarters family (25 July 2026). Held on the same gate so the whole
  // backlog becomes obtainable in one change; they borrow the Patrol Blade tile
  // in the meantime, so flipping early only costs tile fidelity, not function.
  "combat-knife",
  "machete",
  "fire-axe",
  "shock-baton",
  "breaching-maul",
  "plasma-saber",
  // Tier 1 hole-fillers (8 Aug 2026). Released straight into the pool on the
  // same reasoning as the 26 July batch: an unreachable weapon costs more than
  // a borrowed tile does. They use damage-type colour and pattern tile
  // grouping until their own art lands (asset batch 80).
  "emberlance",
  "storm-coil-beam",
  "blight-scythe",
  // Elemental balance pass (31 July 2026). Same gate, same reasoning: they
  // borrow tiles and bodies by attack pattern until their own art exists.
  "corrosive-lobber",
  "scourge-repeater",
  "bile-lance",
  "rime-cleaver",
  "hoarfrost-scatter",
  "glacier-ward",
  "tether-harpoon",
  // First deployable; released with the rest so `engineering` has a consumer.
  "sentry-stake",
]);

/**
 * Unique-class weapons. These are *earned*, not drawn: Event Horizon is a
 * 16-second gravity well, and dropping it into the ordinary chest would make it
 * a wave-2 common. `weaponPoolFor({ uniqueUnlocked })` admits them only once the
 * run has taken down its first ranked enemy (mini-boss or boss).
 */
export const UNIQUE_SLOT_WEAPONS: readonly WeaponId[] = Object.freeze(["event-horizon"]);

/** Internal weapon entities reached through transformation choices, not drafts. */
export const TRANSFORMATION_WEAPONS: readonly WeaponId[] = Object.freeze(["auxiliary-drone"]);

/** The base pool: everything obtainable before a unique is unlocked. */
export const WEAPON_CHEST_POOL: readonly WeaponId[] = Object.freeze(
  HELD_WEAPONS_IN_POOL ? [...LIVE_WEAPONS, ...HELD_WEAPONS] : [...LIVE_WEAPONS],
);

/**
 * The single source of truth for "what can this run still be offered". Both
 * acquisition routes — the Weapon Chest and the scrap shop's weapon line — read
 * this, because they previously each filtered `WEAPON_CHEST_POOL` themselves and
 * that is exactly how two pools drift apart.
 */
export function weaponPoolFor(options: { uniqueUnlocked: boolean }): readonly WeaponId[] {
  return options.uniqueUnlocked
    ? [...WEAPON_CHEST_POOL, ...UNIQUE_SLOT_WEAPONS]
    : WEAPON_CHEST_POOL;
}

function weapon(
  definition: Pick<WeaponRuntimeStats,
    | "id" | "displayName" | "description" | "weaponClass" | "damageType"
    | "targetingMode" | "attackPattern" | "rangeMetres"
    | "fireIntervalSeconds" | "projectileSpeedMetresPerSecond"
    | "projectileLifetimeSeconds" | "projectileDamage"
  > & Partial<WeaponRuntimeStats>,
): Readonly<WeaponRuntimeStats> {
  return Object.freeze({
    projectileCount: 1,
    spreadRadians: 0,
    pierceCount: 0,
    explosionRadiusMetres: 0,
    knockbackMetres: 0,
    chainCount: 0,
    chainRadiusMetres: 0,
    meleeArcRadians: 0,
    firesAutomatically: false,
    homingTurnRateRadiansPerSecond: 0,
    beamDamagePerSecond: 0,
    orbitRadiusMetres: 0,
    orbitAngularSpeedRadiansPerSecond: 0,
    spawnsGravityWellOnImpact: false,
    pullFieldDurationSeconds: 0,
    pullStrengthMetresPerSecond: 0,
    pullRadiusMetres: 0,
    terrainDamageMultiplier: 1,
    deployLifetimeSeconds: 0,
    deployMaxActive: 0,
    deployHealth: 0,
    deployFireIntervalSeconds: 0,
    ...definition,
  });
}
