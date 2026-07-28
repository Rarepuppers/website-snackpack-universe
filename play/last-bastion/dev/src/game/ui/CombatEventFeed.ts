import Phaser from "phaser";
import { uiSafeArea, uiTextResolution } from "../rendering/DisplayScaling";

interface FeedEntry {
  readonly text: Phaser.GameObjects.Text;
  expiresAt: number;
}

/** Short, high-value combat notices; deliberately excludes routine kills and hits. */
export class CombatEventFeed {
  private readonly entries: FeedEntry[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  add(message: string, color = "#c7d6e4", durationMs = 2600): void {
    const safe = uiSafeArea(this.scene.scale.width, this.scene.scale.height);
    const text = this.scene.add.text(safe.right - 12, safe.top + 112, message, {
      color,
      fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
      fontSize: "10px",
      backgroundColor: "#071018d9",
      padding: { x: 7, y: 4 },
    }).setOrigin(1, 0).setDepth(2400).setScrollFactor(0).setResolution(uiTextResolution());
    this.entries.unshift({ text, expiresAt: this.scene.time.now + durationMs });
    while (this.entries.length > 4) this.entries.pop()?.text.destroy();
    this.layout();
  }

  update(): void {
    for (let index = this.entries.length - 1; index >= 0; index -= 1) {
      if (this.entries[index]!.expiresAt <= this.scene.time.now) {
        this.entries[index]!.text.destroy();
        this.entries.splice(index, 1);
      }
    }
    this.layout();
  }

  destroy(): void {
    this.entries.splice(0).forEach(({ text }) => text.destroy());
  }

  private layout(): void {
    const safe = uiSafeArea(this.scene.scale.width, this.scene.scale.height);
    this.entries.forEach(({ text }, index) => text.setPosition(safe.right - 12, safe.top + 112 + index * 26));
  }
}
