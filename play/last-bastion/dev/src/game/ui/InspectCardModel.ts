import type { PowerupType } from "../combat/CombatSimulation";
import { POWERUP_CATALOG } from "../content/powerupCatalog";

export interface InspectCardModel {
  readonly title: string;
  readonly description: string;
  readonly detail: string;
}

export function powerupInspectCard(type: PowerupType, remainingSeconds?: number): InspectCardModel {
  const entry = POWERUP_CATALOG[type];
  const detail = remainingSeconds === undefined
    ? entry.kind === "instant" ? "INSTANT EFFECT" : "MOVE CLOSER TO COLLECT"
    : `ACTIVE  ${Math.max(0, remainingSeconds).toFixed(1)}s`;
  return Object.freeze({ title: entry.displayName.toUpperCase(), description: entry.description, detail });
}
