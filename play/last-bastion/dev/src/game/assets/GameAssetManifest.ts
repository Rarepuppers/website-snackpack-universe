import marineBaseSheetUrl from "../../../../art/production-tests/marine-base-spritesheet-v1-96.png";
import marineHelmetSheetUrl from "../../../../art/production-tests/marine-bastion-helmet-overlay-v1-96.png";
import serviceRifleUrl from "../../../../art/production-tests/bastion-service-rifle-gameplay-v1-64.png";
import scuttlerSheetUrl from "../../../../art/production-tests/scuttler-spritesheet-v1-64.png";
import eggClusterSheetUrl from "../../../../art/production-tests/egg-cluster-spritesheet-v1-64.png";
import brainBlobSheetUrl from "../../../../art/production-tests/brain-blob-states-v1-64.png";
import arenaFloorSheetUrl from "../../../../art/production-tests/batch-a/arena-floor-atlas-v1-64.png";
import arenaBoundarySheetUrl from "../../../../art/production-tests/batch-a/arena-boundary-atlas-v1-64.png";
import arenaObstacleSheetUrl from "../../../../art/production-tests/batch-a/arena-obstacle-atlas-v1-96.png";
import combatEffectSheetUrl from "../../../../art/production-tests/batch-a/combat-effect-atlas-v1-64.png";
import pickupSheetUrl from "../../../../art/production-tests/batch-a/pickup-atlas-v1-64.png";
import hudPanelSheetUrl from "../../../../art/production-tests/batch-a/hud-panel-atlas-v1-256x128.png";

export type GameAssetId =
  | "marine-base-v1"
  | "marine-helmet-v1"
  | "service-rifle-v1"
  | "scuttler-v1"
  | "egg-cluster-v1"
  | "brain-blob-v1"
  | "arena-floor-v1"
  | "arena-boundary-v1"
  | "arena-obstacle-v1"
  | "combat-effects-v1"
  | "pickups-v1"
  | "hud-panels-v1";

interface AssetBase {
  id: GameAssetId;
  url: string;
  logicalWidth: number;
  logicalHeight: number;
  pivot: Readonly<{ x: number; y: number }>;
}

export interface ImageAssetDefinition extends AssetBase {
  kind: "image";
}

export interface SpriteSheetAssetDefinition extends AssetBase {
  kind: "spritesheet";
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
}

export type GameAssetDefinition = ImageAssetDefinition | SpriteSheetAssetDefinition;

export const GAME_ASSET_MANIFEST: readonly GameAssetDefinition[] = Object.freeze([
  sheet("marine-base-v1", marineBaseSheetUrl, 96, 96, 12, 0.5, 0.68),
  sheet("marine-helmet-v1", marineHelmetSheetUrl, 96, 96, 12, 0.5, 0.68),
  image("service-rifle-v1", serviceRifleUrl, 64, 32, 0.25, 0.5),
  sheet("scuttler-v1", scuttlerSheetUrl, 64, 64, 8, 0.5, 0.5),
  sheet("egg-cluster-v1", eggClusterSheetUrl, 64, 64, 4, 0.5, 0.5),
  sheet("brain-blob-v1", brainBlobSheetUrl, 64, 64, 4, 0.5, 0.5),
  sheet("arena-floor-v1", arenaFloorSheetUrl, 64, 64, 6, 0.5, 0.5),
  sheet("arena-boundary-v1", arenaBoundarySheetUrl, 64, 64, 8, 0.5, 0.5),
  sheet("arena-obstacle-v1", arenaObstacleSheetUrl, 96, 96, 8, 0.5, 0.5),
  sheet("combat-effects-v1", combatEffectSheetUrl, 64, 64, 20, 0.5, 0.5),
  sheet("pickups-v1", pickupSheetUrl, 64, 64, 4, 0.5, 0.5),
  sheet("hud-panels-v1", hudPanelSheetUrl, 256, 128, 6, 0.5, 0.5),
]);

export const GAME_ASSETS = Object.freeze(Object.fromEntries(
  GAME_ASSET_MANIFEST.map((asset) => [asset.id, asset]),
)) as Readonly<Record<GameAssetId, GameAssetDefinition>>;

function image(
  id: GameAssetId,
  url: string,
  logicalWidth: number,
  logicalHeight: number,
  pivotX: number,
  pivotY: number,
): ImageAssetDefinition {
  return {
    id,
    url,
    kind: "image",
    logicalWidth,
    logicalHeight,
    pivot: Object.freeze({ x: pivotX, y: pivotY }),
  };
}

function sheet(
  id: GameAssetId,
  url: string,
  frameWidth: number,
  frameHeight: number,
  frameCount: number,
  pivotX: number,
  pivotY: number,
): SpriteSheetAssetDefinition {
  return {
    id,
    url,
    kind: "spritesheet",
    logicalWidth: frameWidth,
    logicalHeight: frameHeight,
    frameWidth,
    frameHeight,
    frameCount,
    pivot: Object.freeze({ x: pivotX, y: pivotY }),
  };
}
