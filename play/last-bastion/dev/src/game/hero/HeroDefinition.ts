import type { EvasiveMoveProfile } from "./EvasiveMove";

export interface HeroDefinition {
  id: string;
  displayName: string;
  movementSpeedMetresPerSecond: number;
  collisionRadiusMetres: number;
  evasiveMove: EvasiveMoveProfile;
}
