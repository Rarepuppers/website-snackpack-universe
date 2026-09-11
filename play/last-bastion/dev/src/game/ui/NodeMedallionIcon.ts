import Phaser from "phaser";
import type { ExpeditionNodeType } from "../expedition/ExpeditionMap";
import { NODE_ICON_KINDS } from "./NodeIconCatalog";

/** Draws resolution-independent pictograms inside expedition medallions. */
export function createNodeMedallionIcon(
  scene: Phaser.Scene,
  type: ExpeditionNodeType,
  x: number,
  y: number,
  color: number,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setPosition(x, y);
  g.lineStyle(type === "boss" ? 2.5 : 2, color, 1).fillStyle(color, 1);
  switch (NODE_ICON_KINDS[type]) {
    case "crosshair":
      g.strokeCircle(0, 0, 7).lineBetween(-11, 0, -5, 0).lineBetween(5, 0, 11, 0)
        .lineBetween(0, -11, 0, -5).lineBetween(0, 5, 0, 11).fillCircle(0, 0, 2);
      break;
    case "chevrons":
      g.beginPath().moveTo(-9, 5).lineTo(0, -7).lineTo(9, 5).strokePath();
      g.beginPath().moveTo(-7, 10).lineTo(0, 1).lineTo(7, 10).strokePath();
      break;
    case "crown":
      g.beginPath().moveTo(-10, 7).lineTo(-8, -7).lineTo(-2, -1).lineTo(0, -9)
        .lineTo(3, -1).lineTo(9, -7).lineTo(10, 7).closePath().strokePath();
      g.lineBetween(-9, 4, 9, 4);
      break;
    case "medical-cross":
      g.fillRect(-3, -11, 6, 22).fillRect(-11, -3, 22, 6);
      break;
    case "weapon-crate":
      g.strokeRect(-11, -8, 22, 16).lineBetween(-7, 5, 7, -5).fillCircle(-7, 5, 2).fillCircle(7, -5, 2);
      break;
    case "shrine":
      g.beginPath().moveTo(0, -12).lineTo(10, 0).lineTo(0, 12).lineTo(-10, 0).closePath().strokePath();
      g.strokeCircle(0, 0, 3);
      break;
    case "question":
      g.beginPath().arc(0, -4, 7, Math.PI, Math.PI * 2.15).strokePath().lineBetween(5, 0, 0, 6).fillCircle(0, 11, 2);
      break;
    case "flag":
      g.lineBetween(-7, -11, -7, 11).beginPath().moveTo(-6, -10).lineTo(9, -7).lineTo(4, 0).lineTo(-6, -2).closePath().strokePath();
      break;
    case "skull":
      g.strokeCircle(0, -2, 10).fillCircle(-4, -4, 2.5).fillCircle(4, -4, 2.5)
        .lineBetween(-6, 7, 6, 7).lineBetween(-3, 7, -3, 11).lineBetween(1, 7, 1, 11).lineBetween(5, 7, 5, 10);
      break;
  }
  return g;
}
