import Phaser from "phaser";
import "./style.css";
import { gameConfig, integerZoomFor } from "./game/config";

const game = new Phaser.Game(gameConfig);

function applyIntegerZoom(): void {
  game.scale.setZoom(integerZoomFor(window.innerWidth, window.innerHeight));
}

game.events.once(Phaser.Core.Events.READY, applyIntegerZoom);
window.addEventListener("resize", applyIntegerZoom);
