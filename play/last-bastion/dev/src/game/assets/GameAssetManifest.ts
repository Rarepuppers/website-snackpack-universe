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
import scattergunUrl from "../../../../art/production-tests/batch-b/scattergun-gameplay-v1-64.png";
import arcCarbineUrl from "../../../../art/production-tests/batch-b/arc-carbine-gameplay-v1-64.png";
import slimeSpitterSheetUrl from "../../../../art/production-tests/batch-b/slime-spitter-spritesheet-v1-64.png";
import carapaceScuttlerSheetUrl from "../../../../art/production-tests/batch-b/carapace-scuttler-spritesheet-v1-96.png";
import siegeCrusherSheetUrl from "../../../../art/production-tests/batch-b/siege-crusher-spritesheet-v1-128.png";
import batchBEffectSheetUrl from "../../../../art/production-tests/batch-b/batch-b-effect-atlas-v1-64.png";
import siegeCrusherPortraitUrl from "../../../../art/production-tests/batch-b/siege-crusher-portrait-v1-128.png";

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
  | "hud-panels-v1"
  | "scattergun-v1"
  | "arc-carbine-v1"
  | "slime-spitter-v1"
  | "carapace-scuttler-v1"
  | "siege-crusher-v1"
  | "batch-b-effects-v1"
  | "siege-crusher-portrait-v1";

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
  image("scattergun-v1", scattergunUrl, 64, 32, 0.25, 0.5),
  image("arc-carbine-v1", arcCarbineUrl, 64, 32, 0.25, 0.5),
  sheet("slime-spitter-v1", slimeSpitterSheetUrl, 64, 64, 12, 0.5, 0.5),
  sheet("carapace-scuttler-v1", carapaceScuttlerSheetUrl, 96, 96, 16, 0.5, 0.5),
  sheet("siege-crusher-v1", siegeCrusherSheetUrl, 128, 128, 12, 0.5, 0.5),
  sheet("batch-b-effects-v1", batchBEffectSheetUrl, 64, 64, 20, 0.5, 0.5),
  image("siege-crusher-portrait-v1", siegeCrusherPortraitUrl, 128, 128, 0.5, 0.5),
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
