import Phaser from "phaser";
import { PrototypeScene } from "./scenes/PrototypeScene";
import { AssetGalleryScene } from "./scenes/AssetGalleryScene";

const galleryMode = new URLSearchParams(window.location.search).get("mode") === "gallery";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  width: 960,
  height: 540,
  backgroundColor: "#151e2b",
  pixelArt: true,
  roundPixels: true,
  input: {
    gamepad: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: galleryMode ? [AssetGalleryScene] : [PrototypeScene],
};
