import Phaser from "phaser";

export function createGameConfig(
  initialScene: Phaser.Types.Scenes.SceneType,
): Phaser.Types.Core.GameConfig {
  return {
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
      // 960x540 canvas by fractional factors, which smears pixel art and text.
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // Every URL boots exactly one scene. Scene hand-offs navigate to another
    // route, allowing Vite to keep unrelated screens in separate chunks.
    scene: [initialScene],
  };
}
