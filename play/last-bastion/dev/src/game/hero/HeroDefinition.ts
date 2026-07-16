import type { EvasiveMoveProfile } from "./EvasiveMove";
import type { DefenceProfile } from "../stats/DefenceStats";

export type WeaponClass = "light" | "medium" | "heavy" | "unique";

export interface HeroDefinition {
  id: string;
  displayName: string;
  movementSpeedMetresPerSecond: number;
  collisionRadiusMetres: number;
  evasiveMove: EvasiveMoveProfile;
  defence: DefenceProfile;
  /** Reserved: per-class damage bonuses activate once the catalogue is wide enough to matter. */
  weaponProficiencies: Readonly<Record<WeaponClass, number>>;
}
