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
  /** Assault Momentum: bonus applied per prior consecutive hit on one target. */
  consecutiveHitDamageBonus?: number;
  consecutiveHitMaxStacks?: number;
  consecutiveHitResetSeconds?: number;
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
  /** When present, projectiles spread across this forward-facing arc instead of a full radial volley. */
  projectileArcRadians?: number;
  projectileKnockbackMetres?: number;
}

export interface HeroDefinition {
  id: "marine" | "medic" | "assault";
  displayName: string;
  role: string;
  baseMaxHealth: number;
  baseRegenerationPerSecond: number;
  movementSpeedMetresPerSecond: number;
  collisionRadiusMetres: number;
  evasiveMove: EvasiveMoveProfile;
  defence: DefenceProfile;
  passive: HeroPassiveProfile;
  ultimate: HeroUltimateProfile;
  /** Stable weapon id; validated against the weapon catalogue at simulation construction. */
  startingWeaponId: string;
  startingWeaponName: string;
  rackClasses: readonly (WeaponClass | "all")[];
  levelGrowthDescription: string;
  unlockText: string;
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
