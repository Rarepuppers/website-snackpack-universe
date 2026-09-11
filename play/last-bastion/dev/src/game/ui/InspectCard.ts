import Phaser from "phaser";
import { uiSafeArea, uiTextResolution } from "../rendering/DisplayScaling";
import type { InspectCardModel } from "./InspectCardModel";

/** Shared fixed-camera tooltip used by both world pickups and HUD status chips. */
export class InspectCard {
  private readonly container: Phaser.GameObjects.Container;
  private readonly title: Phaser.GameObjects.Text;
  private readonly description: Phaser.GameObjects.Text;
  private readonly detail: Phaser.GameObjects.Text;
  private readonly width = 244;
  private readonly height = 76;

  constructor(scene: Phaser.Scene) {
    const panel = scene.add.rectangle(0, 0, this.width, this.height, 0x08111b, 0.97)
      .setOrigin(0).setStrokeStyle(2, 0x68e4e8, 0.95);
    const accent = scene.add.rectangle(0, 0, 4, this.height, 0x68e4e8, 1).setOrigin(0);
    this.title = scene.add.text(12, 8, "", cardText("#ffffff", "12px"));
    this.description = scene.add.text(12, 28, "", { ...cardText("#c7d6e4", "10px"), wordWrap: { width: this.width - 24 } });
    this.detail = scene.add.text(12, 59, "", cardText("#68e4e8", "9px"));
    this.container = scene.add.container(0, 0, [panel, accent, this.title, this.description, this.detail])
      .setDepth(3100).setScrollFactor(0).setVisible(false);
  }

  show(model: InspectCardModel, screenX: number, screenY: number): void {
    const safe = uiSafeArea();
    this.title.setText(model.title);
    this.description.setText(model.description);
    this.detail.setText(model.detail);
    this.container.setPosition(
      Phaser.Math.Clamp(screenX, safe.left + 6, safe.right - this.width - 6),
      Phaser.Math.Clamp(screenY, safe.top + 6, safe.bottom - this.height - 6),
    ).setVisible(true);
  }

  hide(): void { this.container.setVisible(false); }
  destroy(): void { this.container.destroy(true); }
}

function cardText(color: string, fontSize: string): Phaser.Types.GameObjects.Text.TextStyle {
  return { color, fontFamily: "Consolas, monospace", fontSize, resolution: uiTextResolution() };
}
