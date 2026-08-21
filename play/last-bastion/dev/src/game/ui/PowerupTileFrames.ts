import type { PowerupType } from "../combat/CombatSimulation";

export const POWERUP_IDENTITY_TEXTURE = "powerup-identity-atlas-v1" as const;

export const POWERUP_IDENTITY_FRAMES = Object.freeze({
  "siege-loader": 0,
  "phase-jacket": 1,
  "hunter-optics": 2,
  "last-stand-stimulant": 3,
  "emp-charge": 4,
  "butchers-serum": 5,
} satisfies Partial<Record<PowerupType, number>>);

export type PowerupTilePresentation = Readonly<{
  texture: string;
  frame?: number;
}>;

export function dedicatedPowerupFrame(type: PowerupType): number | undefined {
  return POWERUP_IDENTITY_FRAMES[type as keyof typeof POWERUP_IDENTITY_FRAMES];
}

export function powerupPickupPresentation(type: PowerupType): PowerupTilePresentation {
  const dedicatedFrame = dedicatedPowerupFrame(type);
  if (dedicatedFrame !== undefined) {
    return Object.freeze({ texture: POWERUP_IDENTITY_TEXTURE, frame: dedicatedFrame });
  }
  switch (type) {
    case "medkit": return Object.freeze({ texture: "pickups-v1", frame: 2 });
    case "overcharge": return Object.freeze({ texture: "batch-c-rewards-v1", frame: 8 });
    case "aegis": return Object.freeze({ texture: "batch-c-rewards-v1", frame: 9 });
    case "magnet-pulse": return Object.freeze({ texture: "batch-c-rewards-v1", frame: 10 });
    case "adrenaline": return Object.freeze({ texture: "batch-c-rewards-v1", frame: 11 });
    case "uranium-core-rounds": return Object.freeze({ texture: "batch-c-rewards-v1", frame: 8 });
  }
  throw new Error(`Missing pickup presentation for power-up: ${type}`);
}

export function powerupStatusPresentation(type: PowerupType): PowerupTilePresentation {
  const dedicatedFrame = dedicatedPowerupFrame(type);
  if (dedicatedFrame !== undefined) {
    return Object.freeze({ texture: POWERUP_IDENTITY_TEXTURE, frame: dedicatedFrame });
  }
  switch (type) {
    case "uranium-core-rounds": return Object.freeze({ texture: "uranium-status-v1" });
    case "overcharge": return Object.freeze({ texture: "batch-c-rewards-v1", frame: 12 });
    case "magnet-pulse": return Object.freeze({ texture: "batch-c-rewards-v1", frame: 14 });
    case "adrenaline": return Object.freeze({ texture: "batch-c-rewards-v1", frame: 15 });
    default: return Object.freeze({ texture: "batch-c-rewards-v1", frame: 13 });
  }
}
