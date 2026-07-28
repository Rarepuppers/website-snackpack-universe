import Phaser from "phaser";
import { GAME_ASSET_MANIFEST } from "./GameAssetManifest";
import { assetsForGroup, type AssetGroup } from "./AssetGroups";

export function loadGameAssets(scene: Phaser.Scene, group: AssetGroup | "all" = "all"): number {
  const assets = group === "all" ? GAME_ASSET_MANIFEST : assetsForGroup(group);
  let queued = 0;
  for (const asset of assets) {
    if (scene.textures.exists(asset.id)) continue;
    if (asset.kind === "spritesheet") {
      scene.load.spritesheet(asset.id, asset.url, {
        frameWidth: asset.frameWidth,
        frameHeight: asset.frameHeight,
      });
    } else {
      scene.load.image(asset.id, asset.url);
    }
    queued += 1;
  }
  return queued;
}

export function areGameAssetsLoaded(scene: Phaser.Scene, group: AssetGroup): boolean {
  return assetsForGroup(group).every((asset) => scene.textures.exists(asset.id));
}
