export interface WeaponRuntimeStats {
  id: string;
  fireIntervalSeconds: number;
  projectileSpeedMetresPerSecond: number;
  projectileLifetimeSeconds: number;
  projectileDamage: number;
  projectileCount: number;
  spreadRadians: number;
  pierceCount: number;
  explosionRadiusMetres: number;
}

export const BASTION_SERVICE_RIFLE: Readonly<WeaponRuntimeStats> = Object.freeze({
  id: "bastion-service-rifle",
  fireIntervalSeconds: 0.14,
  projectileSpeedMetresPerSecond: 19,
  projectileLifetimeSeconds: 1.15,
  projectileDamage: 10,
  projectileCount: 1,
  spreadRadians: 0,
  pierceCount: 0,
  explosionRadiusMetres: 0,
});
