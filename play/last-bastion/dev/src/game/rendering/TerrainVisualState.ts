import type { ArenaObstacle, ArenaObstacleKind } from "../arena/ArenaDefinition";
import { worldObjectById } from "../arena/WorldObjectCatalog";
import type { WorldObjectArtAssetId } from "../arena/WorldObjectCatalog";

export type TerrainDamageState = "intact" | "damaged" | "critical" | "destroyed";

const TERRAIN_ROW: Readonly<Record<ArenaObstacleKind, number>> = Object.freeze({
  fence: 0,
  "cargo-crate": 1,
  barricade: 2,
  boulder: 3,
  "power-conduit": 4,
  "reinforced-cover": 5,
  biomass: 6,
});

export function terrainDamageState(health: number, maxHealth: number): TerrainDamageState {
  if (health <= 0) return "destroyed";
  const ratio = maxHealth > 0 ? health / maxHealth : 0;
  if (ratio < 0.35) return "critical";
  if (ratio < 0.75) return "damaged";
  return "intact";
}

export function terrainFrameIndex(kind: ArenaObstacleKind, health: number, maxHealth: number): number {
  const state = terrainDamageState(health, maxHealth);
  const column = state === "intact" ? 0 : state === "damaged" ? 1 : state === "critical" ? 2 : 3;
  return TERRAIN_ROW[kind] * 4 + column;
}

/** Returns the existing themed O1 atlas binding for a furnished obstacle. */
export function worldObjectArtAssetId(obstacle: Pick<ArenaObstacle, "worldObjectId">): WorldObjectArtAssetId | null {
  return obstacle.worldObjectId ? worldObjectById(obstacle.worldObjectId)?.art?.assetId ?? null : null;
}

/** Uses the themed four-state row when available, preserving legacy terrain fallback. */
export function obstacleFrameIndex(
  obstacle: Pick<ArenaObstacle, "kind" | "worldObjectId">,
  health: number,
  maxHealth: number,
): number {
  const art = obstacle.worldObjectId ? worldObjectById(obstacle.worldObjectId)?.art : null;
  if (!art) return terrainFrameIndex(obstacle.kind, health, maxHealth);
  const state = terrainDamageState(health, maxHealth);
  const column = state === "intact" ? 0 : state === "damaged" ? 1 : state === "critical" ? 2 : 3;
  return art.row * 4 + column;
}
