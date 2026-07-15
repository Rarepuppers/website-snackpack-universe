import Phaser from "phaser";
import { GAME_ASSET_MANIFEST } from "./GameAssetManifest";

export function loadGameAssets(scene: Phaser.Scene): void {
  for (const asset of GAME_ASSET_MANIFEST) {
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
