import type { DamageType } from "../combat/damageTypes";
import type { WeaponClass } from "../hero/HeroDefinition";

export type WeaponId = "bastion-service-rifle" | "scattergun" | "arc-carbine" | "patrol-blade" | "bolt-carbine" | "bulwark-rotary-cannon" | "grenade-tube";
export type WeaponTargetingMode = "cursor" | "nearest-enemy";
export type WeaponAttackPattern = "projectile" | "scatter" | "chain-projectile" | "melee-sweep";

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
  projectileDamage: 10,
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
  projectileDamage: 7,
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
  projectileDamage: 12,
  chainCount: 1,
  chainRadiusMetres: 3.2,
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
  projectileDamage: 24,
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
  projectileDamage: 22,
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
  fireIntervalSeconds: 0.09,
  projectileSpeedMetresPerSecond: 24,
  projectileLifetimeSeconds: 0.58,
  projectileDamage: 6,
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
  fireIntervalSeconds: 1.6,
  projectileSpeedMetresPerSecond: 8,
  projectileLifetimeSeconds: 1.15,
  projectileDamage: 28,
  explosionRadiusMetres: 2.2,
  knockbackMetres: 0.45,
});

export const WEAPON_CATALOG: Readonly<Record<WeaponId, Readonly<WeaponRuntimeStats>>> = Object.freeze({
  "bastion-service-rifle": BASTION_SERVICE_RIFLE,
  scattergun: SCATTERGUN,
  "arc-carbine": ARC_CARBINE,
  "patrol-blade": PATROL_BLADE,
  "bolt-carbine": BOLT_CARBINE,
  "bulwark-rotary-cannon": BULWARK_ROTARY_CANNON,
  "grenade-tube": GRENADE_TUBE,
});

export const VERTICAL_SLICE_WEAPON_IDS: readonly WeaponId[] = Object.freeze([
  "bastion-service-rifle",
  "scattergun",
  "arc-carbine",
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
    ...definition,
  });
}
