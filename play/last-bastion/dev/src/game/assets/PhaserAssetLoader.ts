import Phaser from "phaser";
import { GAME_ASSET_MANIFEST, type GameAssetId } from "./GameAssetManifest";
import { assetsForGroup, type AssetGroup } from "./AssetGroups";
import {
  areGameAssetsLoaded as areAssetDefinitionsLoaded,
  queueGameAssets,
} from "./PhaserAssetQueue";

export function loadGameAssets(scene: Phaser.Scene, group: AssetGroup | "all" = "all"): number {
  const assets = group === "all" ? GAME_ASSET_MANIFEST : assetsForGroup(group);
  return queueGameAssets(scene, assets);
}

export function loadGameAssetIds(scene: Phaser.Scene, assetIds: readonly GameAssetId[]): number {
  const requested = new Set<GameAssetId>(assetIds);
  const assets = GAME_ASSET_MANIFEST.filter((asset) => requested.has(asset.id));
  if (assets.length !== requested.size) {
    const found = new Set(assets.map((asset) => asset.id));
    const missing = [...requested].filter((id) => !found.has(id));
    throw new Error(`Unknown game asset id${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}`);
  }
  return queueGameAssets(scene, assets);
}

export function areGameAssetsLoaded(scene: Phaser.Scene, group: AssetGroup): boolean {
  return areAssetDefinitionsLoaded(scene, assetsForGroup(group));
}
