import Phaser from "phaser";
import { PrototypeScene } from "./scenes/PrototypeScene";
import { AssetGalleryScene } from "./scenes/AssetGalleryScene";
import { ExpeditionScene } from "./scenes/ExpeditionScene";
import { ShellScene } from "./shell/ShellScene";
import { RunSummaryScene } from "./scenes/RunSummaryScene";

const params = new URLSearchParams(window.location.search);
const galleryMode = params.get("mode") === "gallery";
const mapMode = params.get("screen") === "map";
const summaryMode = params.get("screen") === "summary";

/**
 * The shell is the front door: a bare URL boots Title → Menu. Any review
 * parameter (scenario, stress, loadout, …) still boots straight into combat so
 * every documented lab route keeps working, and `?screen=game` forces a direct
 * run while `?screen=title` forces the shell.
 */
const REVIEW_PARAMS = [
  "scenario", "stress", "loadout", "weapons", "kit", "buff", "art",
  "helmet", "theme", "debug", "timers", "damage", "size", "shake", "sound",
] as const;
const shellMode = !galleryMode
  && !mapMode
  && !summaryMode
  && params.get("screen") !== "game"
  && (params.get("screen") === "title" || !REVIEW_PARAMS.some((key) => params.has(key)));

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
  // Each mode boots exactly one scene; hand-offs navigate to the target route,
  // so no cross-scene start is required.
  scene: galleryMode
    ? [AssetGalleryScene]
    : summaryMode
      ? [RunSummaryScene]
    : mapMode
      ? [ExpeditionScene]
      : shellMode
        ? [ShellScene]
        : [PrototypeScene],
};
