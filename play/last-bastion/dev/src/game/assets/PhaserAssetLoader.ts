import Phaser from "phaser";
import { GAME_ASSET_MANIFEST } from "./GameAssetManifest";
import { assetsForGroup, type AssetGroup } from "./AssetGroups";

export function loadGameAssets(scene: Phaser.Scene, group: AssetGroup | "all" = "all"): void {
  const assets = group === "all" ? GAME_ASSET_MANIFEST : assetsForGroup(group);
  for (const asset of assets) {
    if (asset.kind === "spritesheet") {
      scene.load.spritesheet(asset.id, asset.url, {
        frameWidth: asset.frameWidth,
        frameHeight: asset.frameHeight,
      });
    } else {
      scene.load.image(asset.id, asset.url);
    }
  }
}
