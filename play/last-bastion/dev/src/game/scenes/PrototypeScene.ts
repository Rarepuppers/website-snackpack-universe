import Phaser from "phaser";
import { KeyboardMouseInput } from "../input/KeyboardMouseInput";
import { HeroMotionController } from "../hero/HeroMotionController";
import { MARINE } from "../hero/marine";

const PIXELS_PER_METRE = 32;
const ARENA_MARGIN = 28;

export class PrototypeScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private rifle!: Phaser.GameObjects.Rectangle;
  private statusText!: Phaser.GameObjects.Text;
  private controls!: KeyboardMouseInput;
  private readonly heroMotion = new HeroMotionController(MARINE);

  constructor() {
    super("prototype");
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width - 32, height - 32, 0x192534)
      .setStrokeStyle(2, 0x354a61);

    const grid = this.add.grid(
      width / 2,
      height / 2,
      width - 36,
      height - 36,
      PIXELS_PER_METRE,
      PIXELS_PER_METRE,
      0x192534,
      1,
      0x243548,
      0.5,
    );
    grid.setDepth(-2);

    const shadow = this.add.ellipse(0, 10, 34, 16, 0x05080c, 0.55);
    const body = this.add.circle(0, 0, 16, 0x253d5f).setStrokeStyle(3, 0xe9e3cf);
    const visor = this.add.rectangle(3, -7, 15, 5, 0xffa31a);
    this.rifle = this.add.rectangle(26, 0, 34, 8, 0xe9e3cf).setOrigin(0.2, 0.5);
    this.rifle.setStrokeStyle(2, 0x101720);

    this.player = this.add.container(width / 2, height / 2, [shadow, body, visor, this.rifle]);
    this.player.setDepth(10);

    this.add.text(24, 20, "LAST BASTION — MOVEMENT PROTOTYPE", {
      color: "#edf4ff",
      fontFamily: "monospace",
      fontSize: "18px",
    });
    this.add.text(24, 46, "WASD / arrows: move   Mouse: aim   Space: Marine roll", {
      color: "#9fb3c8",
      fontFamily: "monospace",
      fontSize: "13px",
    });
    this.statusText = this.add.text(24, height - 44, "", {
      color: "#68e4e8",
      fontFamily: "monospace",
      fontSize: "13px",
    });

    this.controls = new KeyboardMouseInput(this);
  }

  update(_time: number, deltaMilliseconds: number): void {
    const deltaSeconds = Math.min(deltaMilliseconds / 1000, 0.05);
    const intent = this.controls.read(this.player);

    const frame = this.heroMotion.update(intent, deltaSeconds);
    this.player.x += frame.displacementMetres.x * PIXELS_PER_METRE;
    this.player.y += frame.displacementMetres.y * PIXELS_PER_METRE;

    this.player.x = Phaser.Math.Clamp(this.player.x, ARENA_MARGIN, this.scale.width - ARENA_MARGIN);
    this.player.y = Phaser.Math.Clamp(this.player.y, ARENA_MARGIN + 42, this.scale.height - ARENA_MARGIN);

    if (intent.aim.x !== 0 || intent.aim.y !== 0) {
      this.rifle.rotation = Math.atan2(intent.aim.y, intent.aim.x);
    }

    this.player.setAlpha(frame.isInvulnerable ? 0.55 : 1);
    this.statusText.setText([
      `State: ${frame.state}`,
      `Roll: ${MARINE.evasiveMove.durationSeconds.toFixed(2)}s / ${MARINE.evasiveMove.distanceMetres.toFixed(1)}m / ${MARINE.evasiveMove.invulnerabilitySeconds.toFixed(2)}s invulnerable`,
    ]);
  }
}
