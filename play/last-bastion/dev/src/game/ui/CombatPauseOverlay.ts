import Phaser from "phaser";
import type { GameSettings } from "../save/LocalSaveStore";
import { uiTextResolution } from "../rendering/DisplayScaling";
import type { BuildOverlayModel } from "./BuildOverlay";

type OverlayMode = "root" | "settings" | "build" | "confirm-restart" | "confirm-abandon";

export interface CombatPauseOverlayCallbacks {
  readonly getSettings: () => GameSettings;
  readonly getBuild: () => BuildOverlayModel;
  readonly onResume: () => void;
  readonly onRestart: () => void;
  readonly onAbandon: () => void;
  readonly onSettingsChanged: (partial: Partial<GameSettings>) => void;
}

interface MenuEntry {
  readonly label: string;
  readonly value?: string;
  readonly activate: () => void;
  readonly adjust?: (direction: -1 | 1) => void;
  readonly danger?: boolean;
}

/** Pointer, keyboard, and gamepad-ready pause UI that never advances combat. */
export class CombatPauseOverlay {
  private readonly container: Phaser.GameObjects.Container;
  private mode: OverlayMode = "root";
  private selection = 0;
  private entries: MenuEntry[] = [];
  private inputDevice: "keyboard" | "gamepad" = "keyboard";

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly callbacks: CombatPauseOverlayCallbacks,
  ) {
    this.container = scene.add.container(0, 0).setDepth(4000).setVisible(false);
  }

  get visible(): boolean {
    return this.container.visible;
  }

  open(): void {
    this.mode = "root";
    this.selection = 0;
    this.container.setVisible(true);
    this.render();
  }

  close(): void {
    this.container.setVisible(false);
  }

  back(): void {
    if (this.mode === "root") {
      this.callbacks.onResume();
      return;
    }
    this.mode = "root";
    this.selection = 0;
    this.render();
  }

  move(direction: -1 | 1): void {
    if (this.entries.length === 0) return;
    this.selection = Phaser.Math.Wrap(this.selection + direction, 0, this.entries.length);
    this.render();
  }

  adjust(direction: -1 | 1): void {
    this.entries[this.selection]?.adjust?.(direction);
  }

  activate(): void {
    this.entries[this.selection]?.activate();
  }

  showAbandonConfirmation(): void {
    this.mode = "confirm-abandon";
    this.selection = 1;
    this.render();
  }

  showSettings(): void {
    this.mode = "settings";
    this.selection = 0;
    this.render();
  }

  showBuild(): void {
    this.mode = "build";
    this.selection = 0;
    this.render();
  }

  setInputDevice(device: "keyboard" | "gamepad"): void {
    if (device === this.inputDevice) return;
    this.inputDevice = device;
    this.refresh();
  }

  refresh(): void {
    if (this.visible) this.render();
  }

  position(): void {
    this.container.setPosition(this.scene.cameras.main.scrollX, this.scene.cameras.main.scrollY);
  }

  destroy(): void {
    this.container.destroy(true);
  }

  private render(): void {
    this.position();
    this.container.removeAll(true);
    const { width, height } = this.scene.scale;
    this.container.add(this.scene.add.rectangle(width / 2, height / 2, width, height, 0x04080d, 0.74));
    this.container.add(this.scene.add.rectangle(width / 2, height / 2, 520, 420, 0x101923, 0.98)
      .setStrokeStyle(2, 0x68e4e8, 0.86));

    const title = this.mode === "settings"
      ? "COMBAT SETTINGS"
      : this.mode === "build"
        ? "CURRENT BUILD"
        : this.mode === "confirm-restart"
          ? "RESTART ENCOUNTER?"
          : this.mode === "confirm-abandon"
            ? "ABANDON RUN?"
            : "PAUSED";
    this.container.add(this.text(width / 2, 76, title, "#e8e2d4", 22).setOrigin(0.5));

    if (this.mode === "build") {
      this.renderBuild(width, height);
      return;
    }
    if (this.mode === "root") this.entries = this.rootEntries();
    else if (this.mode === "settings") this.entries = this.settingsEntries();
    else this.entries = this.confirmEntries(this.mode === "confirm-abandon");

    const startY = this.mode === "settings" ? 104 : this.mode === "root" ? 126 : 164;
    const rowHeight = this.mode === "settings"
      ? this.entries.length > 13 ? 25 : 28
      : this.mode === "root" ? 43 : 50;
    this.entries.forEach((entry, index) => {
      const y = startY + index * rowHeight;
      const selected = index === this.selection;
      const color = entry.danger ? 0x5b2630 : selected ? 0x24384f : 0x1d2938;
      const border = entry.danger ? 0xff795f : selected ? 0x68e4e8 : 0x3b4d63;
      const rect = this.scene.add.rectangle(width / 2, y, 430, rowHeight - 6, color, 0.98)
        .setStrokeStyle(selected ? 2 : 1, border);
      const fontSize = this.mode === "settings" ? 9 : 11;
      const label = this.text(width / 2 - 194, y, entry.label, entry.danger ? "#ffab8d" : "#e8e2d4", fontSize)
        .setOrigin(0, 0.5);
      this.container.add([rect, label]);
      if (entry.value) {
        this.container.add(this.text(width / 2 + 194, y, entry.value, "#68e4e8", fontSize).setOrigin(1, 0.5));
      }
      const zone = this.scene.add.zone(width / 2, y, 430, rowHeight - 6).setInteractive({ useHandCursor: true });
      zone.on("pointerover", () => {
        if (this.selection !== index) {
          this.selection = index;
          this.render();
        }
      });
      zone.on("pointerdown", () => {
        this.selection = index;
        this.entries[index]?.activate();
      });
      this.container.add(zone);
    });

    const hint = this.inputDevice === "gamepad"
      ? (this.mode === "root"
        ? "STICK SELECT  /  A CONFIRM  /  START RESUME"
        : "LEFT/RIGHT CHANGE  /  A CONFIRM  /  B OR START BACK")
      : (this.mode === "root"
        ? "ARROWS SELECT  /  ENTER CONFIRM  /  ESC RESUME"
        : "LEFT/RIGHT CHANGE  /  ENTER CONFIRM  /  ESC BACK");
    this.container.add(this.text(width / 2, height - 72, hint, "#8fa1b3", 8).setOrigin(0.5));
  }

  private rootEntries(): MenuEntry[] {
    return [
      { label: "RESUME", activate: this.callbacks.onResume },
      {
        label: "VIEW BUILD",
        activate: () => {
          this.mode = "build";
          this.selection = 0;
          this.render();
        },
      },
      {
        label: "COMBAT SETTINGS",
        activate: () => {
          this.mode = "settings";
          this.selection = 0;
          this.render();
        },
      },
      {
        label: "RESTART ENCOUNTER",
        activate: () => {
          this.mode = "confirm-restart";
          this.selection = 1;
          this.render();
        },
      },
      {
        label: "ABANDON RUN",
        danger: true,
        activate: () => {
          this.mode = "confirm-abandon";
          this.selection = 1;
          this.render();
        },
      },
    ];
  }

  private settingsEntries(): MenuEntry[] {
    const settings = this.callbacks.getSettings();
    return [
      this.toggle("SCREEN SHAKE", "screenShakeEnabled", settings.screenShakeEnabled),
      this.toggle("REDUCED FLASH", "reducedFlashEnabled", settings.reducedFlashEnabled),
      this.toggle("DAMAGE NUMBERS", "damageNumbersEnabled", settings.damageNumbersEnabled),
      this.toggle("SOUND", "soundEnabled", settings.soundEnabled),
      this.choice("MASTER VOLUME", "masterVolume", settings.masterVolume, [0, 0.25, 0.5, 0.75, 1]),
      this.choice("SFX VOLUME", "sfxVolume", settings.sfxVolume, [0, 0.25, 0.5, 0.75, 1]),
      this.choice("CONTROLLER VIBRATION", "gamepadVibrationStrength", settings.gamepadVibrationStrength, [0, 0.5, 0.75, 1]),
      this.choice("COMBAT EFFECTS", "effectQuality", settings.effectQuality, ["auto", "high", "medium", "low"]),
      this.choice("GAME SPEED", "gameSpeedMultiplier", settings.gameSpeedMultiplier, [0.75, 1, 1.25]),
      this.toggle("HIGH-CONTRAST OUTLINES", "highContrastOutlinesEnabled", settings.highContrastOutlinesEnabled),
      this.choice("COLOUR-VISION MODE", "colorVisionMode", settings.colorVisionMode, ["standard", "deuteranopia", "protanopia", "tritanopia"]),
      this.choice("THREAT INDICATORS", "offscreenThreatIndicators", settings.offscreenThreatIndicators, ["off", "threats", "all"]),
      this.choice("RADAR SIZE", "radarSize", settings.radarSize, [0.75, 1, 1.25]),
      this.choice("HUD SCALE", "uiScale", settings.uiScale, [0.8, 1, 1.2]),
      {
        label: "BACK",
        activate: () => {
          this.mode = "root";
          this.selection = 0;
          this.render();
        },
      },
    ];
  }

  private confirmEntries(abandon: boolean): MenuEntry[] {
    return [
      {
        label: abandon ? "YES - END RUN" : "YES - RESTART",
        danger: abandon,
        activate: abandon ? this.callbacks.onAbandon : this.callbacks.onRestart,
      },
      {
        label: "CANCEL",
        activate: () => {
          this.mode = "root";
          this.selection = 0;
          this.render();
        },
      },
    ];
  }

  private toggle(
    label: string,
    key: "screenShakeEnabled" | "reducedFlashEnabled" | "damageNumbersEnabled" | "soundEnabled" | "highContrastOutlinesEnabled",
    value: boolean,
  ): MenuEntry {
    const activate = () => this.callbacks.onSettingsChanged({ [key]: !this.callbacks.getSettings()[key] });
    return { label, value: value ? "ON" : "OFF", activate, adjust: () => activate() };
  }

  private choice<K extends "offscreenThreatIndicators" | "radarSize" | "uiScale" | "colorVisionMode" | "effectQuality" | "gameSpeedMultiplier" | "masterVolume" | "sfxVolume" | "gamepadVibrationStrength">(
    label: string,
    key: K,
    value: GameSettings[K],
    options: readonly GameSettings[K][],
  ): MenuEntry {
    const adjust = (direction: -1 | 1) => {
      const current = this.callbacks.getSettings()[key];
      const index = Math.max(0, options.indexOf(current));
      const next = options[Phaser.Math.Wrap(index + direction, 0, options.length)]!;
      this.callbacks.onSettingsChanged({ [key]: next } as Partial<GameSettings>);
    };
    return { label, value: String(value).toUpperCase(), activate: () => adjust(1), adjust };
  }

  private renderBuild(width: number, height: number): void {
    const build = this.callbacks.getBuild();
    this.container.add(this.text(width / 2 - 200, 108, build.heroLine.toUpperCase(), "#68e4e8", 11));
    this.container.add(this.text(width / 2 - 200, 140, "WEAPONS", "#e8e2d4", 10));
    this.container.add(this.text(width / 2 - 200, 161, build.weaponLines.slice(0, 5).join("\n") || "No weapons", "#b9c6d3", 9)
      .setLineSpacing(6));
    this.container.add(this.text(width / 2 + 35, 140, "COMBAT STATS", "#e8e2d4", 10));
    this.container.add(this.text(width / 2 + 35, 161, build.statLines.join("\n"), "#b9c6d3", 9).setLineSpacing(6));
    this.container.add(this.text(width / 2 - 200, 296, "RELICS / ARTIFACT", "#e8e2d4", 10));
    this.container.add(this.text(width / 2 - 200, 317, build.relicLines.slice(0, 4).join("\n") || "None", "#b9c6d3", 8)
      .setLineSpacing(5));
    this.container.add(this.text(width / 2 + 35, 296, "SYNERGIES", "#e8e2d4", 10));
    this.container.add(this.text(width / 2 + 35, 317, build.synergyLines.slice(0, 4).join("\n") || "No active synergies", "#b9c6d3", 8)
      .setLineSpacing(5));
    const back = this.scene.add.rectangle(width / 2, 430, 180, 34, 0x24384f, 0.98)
      .setStrokeStyle(2, 0x68e4e8).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.back());
    this.container.add([back, this.text(width / 2, 430, "BACK", "#68e4e8", 10).setOrigin(0.5)]);
    const hint = this.inputDevice === "gamepad" ? "B / START BACK" : "ESC BACK";
    this.container.add(this.text(width / 2, height - 72, hint, "#8fa1b3", 8).setOrigin(0.5));
    this.entries = [{ label: "BACK", activate: () => this.back() }];
  }

  private text(x: number, y: number, value: string, color: string, size: number): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, value, {
      color,
      fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
      fontSize: `${size}px`,
    }).setResolution(uiTextResolution());
  }
}
