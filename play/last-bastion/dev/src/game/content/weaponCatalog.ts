import type { DamageType } from "../combat/damageTypes";
import type { WeaponClass } from "../hero/HeroDefinition";

export type WeaponId = "bastion-service-rifle" | "scattergun" | "arc-carbine" | "patrol-blade" | "bolt-carbine" | "bulwark-rotary-cannon" | "grenade-tube" | "injector-carbine" | "railspike" | "seeker-swarm" | "cryo-lance" | "tesla-coil" | "flamethrower" | "sawblade" | "event-horizon";
export type WeaponTargetingMode = "cursor" | "nearest-enemy";
export type WeaponAttackPattern = "projectile" | "scatter" | "chain-projectile" | "melee-sweep" | "beam" | "orbit" | "orbit-blade";

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
});

export const VERTICAL_SLICE_WEAPON_IDS: readonly WeaponId[] = Object.freeze([
  "bastion-service-rifle",
  "scattergun",
  "arc-carbine",
]);

/**
 * Weapons the in-run Weapon Chest may offer (content-enablement pass,
 * 17 July 2026). The chest draws a seeded subset of unowned entries.
 */
export const WEAPON_CHEST_POOL: readonly WeaponId[] = Object.freeze([
  "bastion-service-rifle",
  "scattergun",
  "arc-carbine",
  "patrol-blade",
  "bolt-carbine",
  "bulwark-rotary-cannon",
  "grenade-tube",
  "injector-carbine",
]);

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
    ...definition,
  });
}
