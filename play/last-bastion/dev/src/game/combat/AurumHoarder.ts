import type { Vector2Data } from "../math/Vector2Data";

/** Enabled only after the same-run Scrap Shop spend loop shipped in Task 37. */
export const AURUM_HOARDER_LIVE_WAVES_ENABLED = true;
export const AURUM_HOARDER_SPAWN_CHANCE = 0.1;
export const AURUM_HOARDER_FORAGE_SECONDS = 3;
export const AURUM_HOARDER_ESCAPE_SECONDS = 9;
export const AURUM_HOARDER_BREAK_SCRAP = 10;
export const AURUM_HOARDER_KILL_SCRAP = 30;
export const AURUM_HOARDER_BREAK_THRESHOLDS = Object.freeze([0.75, 0.5, 0.25] as const);

export interface AurumSpawnContext {
  waveNumber: number;
  totalWaves: number;
  roll: number;
  liveEnemies: number;
  liveCap: number;
  alreadySpawned: boolean;
  objectiveActive: boolean;
  rewardEconomyEnabled: boolean;
}

export function isAurumSpawnEligible(context: Omit<AurumSpawnContext, "rewardEconomyEnabled">): boolean {
  if (context.waveNumber < 3 || context.waveNumber >= context.totalWaves) return false;
  if (context.alreadySpawned || context.objectiveActive) return false;
  if (context.liveCap <= 0 || context.liveEnemies >= context.liveCap) return false;
  return context.roll >= 0 && context.roll < AURUM_HOARDER_SPAWN_CHANCE;
}

export function shouldSpawnAurumHoarder(context: AurumSpawnContext): boolean {
  if (!AURUM_HOARDER_LIVE_WAVES_ENABLED || !context.rewardEconomyEnabled) return false;
  return isAurumSpawnEligible(context);
}

/** Selects the safest deterministic exit: farthest valid edge from the Marine. */
export function selectAurumExit(
  hoarder: Vector2Data,
  player: Vector2Data,
  widthMetres: number,
  heightMetres: number,
  marginMetres = 0.7,
): Vector2Data {
  const candidates: Vector2Data[] = [
    { x: marginMetres, y: clamp(hoarder.y, marginMetres, heightMetres - marginMetres) },
    { x: widthMetres - marginMetres, y: clamp(hoarder.y, marginMetres, heightMetres - marginMetres) },
    { x: clamp(hoarder.x, marginMetres, widthMetres - marginMetres), y: marginMetres },
    { x: clamp(hoarder.x, marginMetres, widthMetres - marginMetres), y: heightMetres - marginMetres },
  ];
  return candidates.sort((left, right) => {
    const safetyDifference = distanceSquared(right, player) - distanceSquared(left, player);
    if (Math.abs(safetyDifference) > 0.000001) return safetyDifference;
    return distanceSquared(left, hoarder) - distanceSquared(right, hoarder)
      || left.x - right.x
      || left.y - right.y;
  })[0]!;
}

export function crossedAurumThresholds(
  previousHealth: number,
  nextHealth: number,
  maxHealth: number,
  alreadyPaid: number,
): readonly number[] {
  if (maxHealth <= 0) return [];
  return AURUM_HOARDER_BREAK_THRESHOLDS.slice(alreadyPaid)
    .filter((threshold) => previousHealth / maxHealth > threshold && nextHealth / maxHealth <= threshold);
}

function distanceSquared(left: Vector2Data, right: Vector2Data): number {
  return (left.x - right.x) ** 2 + (left.y - right.y) ** 2;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
