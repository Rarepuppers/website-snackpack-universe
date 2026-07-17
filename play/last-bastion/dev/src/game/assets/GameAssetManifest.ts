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
import blastMiteSheetUrl from "../../../../art/production-tests/batch-c/blast-mite-spritesheet-v1-64.png";
import warpFlankerSheetUrl from "../../../../art/production-tests/batch-c/warp-flanker-spritesheet-v1-96.png";
import batchCRewardSheetUrl from "../../../../art/production-tests/batch-c/batch-c-reward-atlas-v1-64.png";
import batchCEffectSheetUrl from "../../../../art/production-tests/batch-c/batch-c-effect-atlas-v1-64.png";
import broodWardenSheetUrl from "../../../../art/production-tests/batch-d/brood-warden-spritesheet-v1-128.png";
import broodWardenPortraitUrl from "../../../../art/production-tests/batch-d/brood-warden-portrait-v1-128.png";
import broodWardenEffectSheetUrl from "../../../../art/production-tests/batch-d/brood-warden-effect-atlas-v1-64.png";
import ripperSheetUrl from "../../../../art/production-tests/batch-d2/ripper-spritesheet-v1-96.png";
import ripperEffectSheetUrl from "../../../../art/production-tests/batch-d2/ripper-effect-atlas-v1-64.png";
import razorScuttlerSheetUrl from "../../../../art/production-tests/batch-d4/razor-scuttler-spritesheet-v1-96.png";
import razorScuttlerEffectSheetUrl from "../../../../art/production-tests/batch-d4/razor-scuttler-effect-atlas-v1-64.png";
import quillbackSheetUrl from "../../../../art/production-tests/batch-e1/quillback-spritesheet-v1-96.png";
import quillbackEffectSheetUrl from "../../../../art/production-tests/batch-e1/quillback-effect-atlas-v1-64.png";
import spinewheelSheetUrl from "../../../../art/production-tests/batch-e2/spinewheel-spritesheet-v1-96.png";
import spinewheelShellSheetUrl from "../../../../art/production-tests/batch-e2/spinewheel-shell-spin-v1-96.png";
import spinewheelEffectSheetUrl from "../../../../art/production-tests/batch-e2/spinewheel-effect-atlas-v1-64.png";
import tetherBloomSheetUrl from "../../../../art/production-tests/batch-e3/tether-bloom-spritesheet-v1-96.png";
import tetherBloomEffectSheetUrl from "../../../../art/production-tests/batch-e3/tether-bloom-effect-atlas-v1-64.png";
import bastionEaterSheetUrl from "../../../../art/production-tests/batch-d3/bastion-eater-spritesheet-v1-192.png";
import bastionEaterNodeSheetUrl from "../../../../art/production-tests/batch-d3/bastion-eater-node-overlay-v1-192.png";
import bastionEaterEffectSheetUrl from "../../../../art/production-tests/batch-d3/bastion-eater-effect-atlas-v1-96.png";
import bastionEaterEnvironmentSheetUrl from "../../../../art/production-tests/batch-d3/bastion-eater-environment-atlas-v1-96.png";
import bastionEaterPortraitUrl from "../../../../art/production-tests/batch-d3/bastion-eater-portrait-v1-256.png";

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
  | "siege-crusher-portrait-v1"
  | "blast-mite-v1"
  | "warp-flanker-v1"
  | "batch-c-rewards-v1"
  | "batch-c-effects-v1"
  | "brood-warden-v1"
  | "brood-warden-portrait-v1"
  | "brood-warden-effects-v1"
  | "ripper-v1"
  | "ripper-effects-v1"
  | "razor-scuttler-v1"
  | "razor-scuttler-effects-v1"
  | "quillback-v1"
  | "quillback-effects-v1"
  | "spinewheel-v1"
  | "spinewheel-shell-v1"
  | "spinewheel-effects-v1"
  | "tether-bloom-v1"
  | "tether-bloom-effects-v1"
  | "bastion-eater-v1"
  | "bastion-eater-nodes-v1"
  | "bastion-eater-effects-v1"
  | "bastion-eater-environment-v1"
  | "bastion-eater-portrait-v1";

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
  sheet("blast-mite-v1", blastMiteSheetUrl, 64, 64, 12, 0.5, 0.5),
  sheet("warp-flanker-v1", warpFlankerSheetUrl, 96, 96, 12, 0.5, 0.5),
  sheet("batch-c-rewards-v1", batchCRewardSheetUrl, 64, 64, 16, 0.5, 0.5),
  sheet("batch-c-effects-v1", batchCEffectSheetUrl, 64, 64, 20, 0.5, 0.5),
  sheet("brood-warden-v1", broodWardenSheetUrl, 128, 128, 12, 0.5, 0.5),
  image("brood-warden-portrait-v1", broodWardenPortraitUrl, 128, 128, 0.5, 0.5),
  sheet("brood-warden-effects-v1", broodWardenEffectSheetUrl, 64, 64, 10, 0.5, 0.5),
  sheet("ripper-v1", ripperSheetUrl, 96, 96, 16, 0.5, 0.5),
  sheet("ripper-effects-v1", ripperEffectSheetUrl, 64, 64, 8, 0.5, 0.5),
  sheet("razor-scuttler-v1", razorScuttlerSheetUrl, 96, 96, 16, 0.5, 0.5),
  sheet("razor-scuttler-effects-v1", razorScuttlerEffectSheetUrl, 64, 64, 8, 0.5, 0.5),
  sheet("quillback-v1", quillbackSheetUrl, 96, 96, 12, 0.5, 0.5),
  sheet("quillback-effects-v1", quillbackEffectSheetUrl, 64, 64, 8, 0.5, 0.5),
  sheet("spinewheel-v1", spinewheelSheetUrl, 96, 96, 12, 0.5, 0.5),
  sheet("spinewheel-shell-v1", spinewheelShellSheetUrl, 96, 96, 4, 0.5, 0.5),
  sheet("spinewheel-effects-v1", spinewheelEffectSheetUrl, 64, 64, 8, 0.5, 0.5),
  sheet("tether-bloom-v1", tetherBloomSheetUrl, 96, 96, 16, 0.5, 0.5),
  sheet("tether-bloom-effects-v1", tetherBloomEffectSheetUrl, 64, 64, 8, 0.5, 0.5),
  sheet("bastion-eater-v1", bastionEaterSheetUrl, 192, 192, 12, 0.5, 0.5),
  sheet("bastion-eater-nodes-v1", bastionEaterNodeSheetUrl, 192, 192, 8, 0.5, 0.5),
  sheet("bastion-eater-effects-v1", bastionEaterEffectSheetUrl, 96, 96, 12, 0.5, 0.5),
  sheet("bastion-eater-environment-v1", bastionEaterEnvironmentSheetUrl, 96, 96, 8, 0.5, 0.5),
  image("bastion-eater-portrait-v1", bastionEaterPortraitUrl, 256, 256, 0.5, 0.5),
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
