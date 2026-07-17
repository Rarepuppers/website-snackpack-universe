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
    // NONE + a device-pixel-snapped zoom instead of FIT: FIT stretches the
    // 960×540 canvas by fractional factors, which smears pixel art and text
    // even with image-rendering: pixelated. See rendering/DisplayScaling.ts;
    // main.ts owns the resize listener.
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: galleryMode ? [AssetGalleryScene] : [PrototypeScene],
};
