import type { EvasiveMoveProfile } from "./EvasiveMove";
import type { DefenceProfile } from "../stats/DefenceStats";

export type WeaponClass = "light" | "medium" | "heavy" | "unique";

export interface HeroPassiveProfile {
  id: string;
  name: string;
  description: string;
  /** Seconds of standing still before the passive engages. */
  stationarySecondsRequired: number;
  bonusArmour: number;
}

export interface HeroUltimateProfile {
  id: string;
  name: string;
  description: string;
  cooldownSeconds: number;
  projectileCount: number;
  projectileDamage: number;
  explosionRadiusMetres: number;
}

export interface HeroDefinition {
  id: string;
  displayName: string;
  movementSpeedMetresPerSecond: number;
  collisionRadiusMetres: number;
  evasiveMove: EvasiveMoveProfile;
  defence: DefenceProfile;
  passive: HeroPassiveProfile;
  ultimate: HeroUltimateProfile;
  /** Reserved: per-class damage bonuses activate once the catalogue is wide enough to matter. */
  weaponProficiencies: Readonly<Record<WeaponClass, number>>;
}
