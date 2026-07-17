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
    // NONE + integer zoom instead of FIT: FIT stretches the 960×540 canvas by
    // fractional factors on large monitors, which smears pixel art even with
    // image-rendering: pixelated. Snapping to whole multiples keeps every
    // texel a crisp N×N block; main.ts owns the resize listener.
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: galleryMode ? [AssetGalleryScene] : [PrototypeScene],
};

/** Largest whole-number zoom of the 960×540 canvas that fits the window. */
export function integerZoomFor(windowWidth: number, windowHeight: number): number {
  return Math.max(1, Math.floor(Math.min(windowWidth / 960, windowHeight / 540)));
}
