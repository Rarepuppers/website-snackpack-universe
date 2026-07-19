import type { EvasiveMoveProfile } from "./EvasiveMove";
import type { DefenceProfile } from "../stats/DefenceStats";
import type { UpgradeCategory } from "../content/upgradeCatalog";

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
  healAmount?: number;
  shieldAmount?: number;
}

export interface HeroDefinition {
  id: "marine" | "medic";
  displayName: string;
  movementSpeedMetresPerSecond: number;
  collisionRadiusMetres: number;
  evasiveMove: EvasiveMoveProfile;
  defence: DefenceProfile;
  passive: HeroPassiveProfile;
  ultimate: HeroUltimateProfile;
  /**
   * Starting upgrade slots per category. New upgrades consume a slot in
   * their category; leveling an owned upgrade never does. Slot rewards can
   * raise these up to the shared hard cap. Hero identity lives here: the
   * Marine is balanced, the Medic will lean support, Assault offensive.
   */
  upgradeSlots: Readonly<Record<UpgradeCategory, number>>;
  /** Reserved: per-class damage bonuses activate once the catalogue is wide enough to matter. */
  weaponProficiencies: Readonly<Record<WeaponClass, number>>;
  levelGrowth: {
    health: number;
    armour: number;
    damage: number;
    speed: number;
    supportEffect: number;
    proficiency: Readonly<Partial<Record<WeaponClass, number>>>;
  };
}
