export type WeaponId = "bastion-service-rifle" | "scattergun" | "arc-carbine";
export type WeaponTargetingMode = "cursor" | "nearest-enemy";
export type WeaponAttackPattern = "projectile" | "scatter" | "chain-projectile";

export interface WeaponRuntimeStats {
  id: WeaponId;
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
}

export const BASTION_SERVICE_RIFLE: Readonly<WeaponRuntimeStats> = weapon({
  id: "bastion-service-rifle",
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

export const WEAPON_CATALOG: Readonly<Record<WeaponId, Readonly<WeaponRuntimeStats>>> = Object.freeze({
  "bastion-service-rifle": BASTION_SERVICE_RIFLE,
  scattergun: SCATTERGUN,
  "arc-carbine": ARC_CARBINE,
});

export const VERTICAL_SLICE_WEAPON_IDS: readonly WeaponId[] = Object.freeze([
  "bastion-service-rifle",
  "scattergun",
  "arc-carbine",
]);

function weapon(
  definition: Pick<WeaponRuntimeStats,
    | "id" | "targetingMode" | "attackPattern" | "rangeMetres"
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
    ...definition,
  });
}
