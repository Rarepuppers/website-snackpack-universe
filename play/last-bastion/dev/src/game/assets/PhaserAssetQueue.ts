import Phaser from "phaser";
import type { GameAssetDefinition } from "./GameAssetManifest";

export function queueGameAssets(
  scene: Phaser.Scene,
  assets: readonly GameAssetDefinition[],
): number {
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

export function areGameAssetsLoaded(
  scene: Phaser.Scene,
  assets: readonly GameAssetDefinition[],
): boolean {
  return assets.every((asset) => scene.textures.exists(asset.id));
}
