import type { PowerupType } from "../combat/CombatSimulation";

export interface PowerupCatalogEntry {
  readonly displayName: string;
  readonly description: string;
  readonly kind: "instant" | "timed";
}

/** Player-facing power-up identity. Pickup, HUD, event, and inspect copy read here. */
export const POWERUP_CATALOG: Readonly<Record<PowerupType, PowerupCatalogEntry>> = Object.freeze({
  overcharge: Object.freeze({ displayName: "Overcharge", description: "Weapons cycle 60% faster.", kind: "timed" }),
  aegis: Object.freeze({ displayName: "Aegis", description: "Immediately grants an energy shield.", kind: "instant" }),
  adrenaline: Object.freeze({ displayName: "Adrenaline", description: "Move 35% faster.", kind: "timed" }),
  "magnet-pulse": Object.freeze({ displayName: "Magnet Pulse", description: "Greatly expands pickup range.", kind: "timed" }),
  "uranium-core-rounds": Object.freeze({ displayName: "Uranium-Core Rounds", description: "Eligible direct hits deal 25% more damage.", kind: "timed" }),
  medkit: Object.freeze({ displayName: "Medkit", description: "Restores health; overflow becomes bonus health.", kind: "instant" }),
  "siege-loader": Object.freeze({ displayName: "Siege Loader", description: "Slow weapons cycle 30% faster.", kind: "timed" }),
  "phase-jacket": Object.freeze({ displayName: "Phase Jacket", description: "Ignores the next hit, then expires.", kind: "timed" }),
  "hunter-optics": Object.freeze({ displayName: "Hunter Optics", description: "Direct hits deal 15% more damage to elites.", kind: "timed" }),
  "last-stand-stimulant": Object.freeze({ displayName: "Last Stand Stimulant", description: "Move and fire 25% faster.", kind: "timed" }),
  "emp-charge": Object.freeze({ displayName: "EMP Charge", description: "Immediately overloads nearby enemies.", kind: "instant" }),
  "butchers-serum": Object.freeze({ displayName: "Butcher's Serum", description: "Melee attacks deal 60% more damage.", kind: "timed" }),
});

export function powerupDisplayName(type: PowerupType): string {
  return POWERUP_CATALOG[type].displayName;
}
