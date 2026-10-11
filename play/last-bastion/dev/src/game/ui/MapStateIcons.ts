import Phaser from "phaser";
import type { ExpeditionObjectiveMode } from "../expedition/ExpeditionEncounter";

/** Small, text-free marks that remain distinct when the map is shown in grayscale. */
export function createObjectiveBadgeIcon(
  scene: Phaser.Scene,
  mode: ExpeditionObjectiveMode,
  x: number,
  y: number,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setPosition(x, y).setDepth(14);
  g.fillStyle(0x132637).fillCircle(0, 0, 9);
  g.lineStyle(1.5, 0xffd36b).strokeCircle(0, 0, 8);
  g.lineStyle(1.7, 0xffd36b).fillStyle(0xffd36b);
  switch (mode) {
    case "escort":
      // Forward arrow with a trailing pair of convoy marks.
      g.lineBetween(-5, 0, 3, 0).lineBetween(0, -3, 4, 0).lineBetween(4, 0, 0, 3);
      g.fillRect(-5, -4, 2, 2).fillRect(-5, 2, 2, 2);
      break;
    case "deny":
      // Closed barrier.
      g.lineBetween(-5, -5, 5, 5).lineBetween(-5, 5, 5, -5);
      g.strokeRect(-5, -5, 10, 10);
      break;
    case "collect":
      // Three pieces gathered into a tray.
      g.fillRect(-5, -4, 3, 3).fillRect(2, -4, 3, 3).fillRect(-1.5, 0, 3, 3);
      g.lineBetween(-5, 5, 5, 5);
      break;
  }
  return g;
}

export function createClearedBadgeIcon(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setPosition(x, y).setDepth(14);
  g.fillStyle(0x132637).fillCircle(0, 0, 8);
  g.lineStyle(1.5, 0x68e4e8).strokeCircle(0, 0, 7);
  g.lineStyle(2, 0x68e4e8).lineBetween(-4, 0, -1, 3).lineBetween(-1, 3, 5, -4);
  return g;
}
