import Phaser from "phaser";
import { LocalSaveStore, type GameProgress } from "../save/LocalSaveStore";
import { createLocalSaveStore } from "../save/SaveStorage";
import { heroDefinition, isHeroId } from "../hero/HeroCatalog";
import { areGameAssetsLoaded, queueGameAssets } from "../assets/PhaserAssetQueue";
import {
  SHELL_BASE_ASSETS,
  SHELL_CHARACTER_ASSETS,
} from "../assets/ShellAssetManifest";
import { PERK_CATALOG } from "../perks/perkCatalog";
import { THREAT_TIERS } from "../expedition/ThreatTier";
import { ARMORY_NODES, COMMAND_MARKS_LABEL, armoryNode, isHeroDeploymentUnlocked } from "../progression/ArmoryProgression";
import { reapplyDisplayScale } from "../rendering/DisplayScaling";
import {
  applyHostDisplaySelection,
  currentHostDisplaySelection,
  displayLabelForId,
  hostDisplayCapabilities,
} from "../rendering/DesktopDisplayRuntime";
import {
  createShellState,
  howToPlayPages,
  LAB_ROUTES,
  MENU_CARDS,
  perkTilePosition,
  ROSTER,
  settingsRowsForDisplayCapabilities,
  stepShell,
  type ShellIntent,
  type ShellState,
} from "./ScreenFlow";
import {
  GAMEPAD_BINDABLE_ACTIONS,
  KEYBOARD_BINDABLE_ACTIONS,
  DEFAULT_CONTROL_BINDINGS,
  gamepadBindingLabel,
  keyboardBindingLabel,
  isBindableKeyboardCode,
  normalizeControlBindings,
  rebindGamepad,
  rebindKeyboard,
  type GamepadBindableAction,
  type GamepadButton,
  type KeyboardBindableAction,
} from "../input/ControlBindings";

const WIDTH = 960;
const HEIGHT = 540;
const NAVY = 0x151e2b;
const PANEL = 0x1d2938;
const IVORY = "#e8e2d4";
const TEAL = "#68e4e8";
const TEAL_HEX = 0x68e4e8;
const ORANGE = "#ff9a52";
const MUTED = "#8fa1b3";

/**
 * Task 37 behavior gate: the code-native front-end shell. Every panel is a
 * placeholder rectangle plus code-rendered text; Batch G art replaces the
 * dressing later without touching the ScreenFlow rules.
 */
export class ShellScene extends Phaser.Scene {
  private saveStore!: LocalSaveStore;
  private state!: ShellState;
  private root!: Phaser.GameObjects.Container;
  private titlePulse = 0;
  private loadingAssetGroup: "shell-character" | null = null;
  private bindingCapture: { device: "keyboard" | "gamepad"; action: KeyboardBindableAction | GamepadBindableAction } | null = null;
  private fullscreenFeedback: string | null = null;

  constructor() {
    super("shell");
  }

  preload(): void {
    queueGameAssets(this, SHELL_BASE_ASSETS);
    if (requestedInitialScreen() === "character-select") {
      queueGameAssets(this, SHELL_CHARACTER_ASSETS);
    }
  }

  create(): void {
    this.saveStore = createLocalSaveStore(typeof window !== "undefined" ? window : null);
    const save = this.saveStore.load();
    const initialScreen = requestedInitialScreen();
    const displayCapabilities = hostDisplayCapabilities(document);
    const hostSelection = currentHostDisplaySelection();
    const fullscreenMode = hostSelection?.fullscreenMode
      ?? (document.fullscreenElement ? "borderless" : "windowed");
    const selectedDisplayId = hostSelection?.selectedDisplayId ?? save.settings.selectedDisplayId;
    const settings = save.settings.fullscreenMode === fullscreenMode
      && save.settings.selectedDisplayId === selectedDisplayId
      ? save.settings
      : this.saveStore.updateSettings({ fullscreenMode, selectedDisplayId }).settings;
    this.state = createShellState(
      settings, initialScreen, save.progress, save.selectedPerkId, save.selectedHeroId, save.controls,
      settingsRowsForDisplayCapabilities(displayCapabilities),
      save.selectedThreatTier,
      save.selectedArmoryNodeId,
      save.runHistory.length,
    );
    this.root = this.add.container(0, 0);

    // One direct window listener instead of the Phaser keyboard plugin: the
    // plugin can deliver capture-list keys (Enter, Space, arrows) a second
    // time from its frame queue, which double-steps menu navigation.
    window.addEventListener("keydown", this.handleKey);
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    this.events.once("shutdown", () => {
      window.removeEventListener("keydown", this.handleKey);
      document.removeEventListener("fullscreenchange", this.handleFullscreenChange);
    });
    this.input.gamepad?.on("down", (_pad: unknown, button: { index: number }) => {
      if (this.bindingCapture?.device === "gamepad") {
        const mapped = gamepadButtonFromIndex(button.index);
        if (mapped) this.commitGamepadBinding(mapped);
        return;
      }
      const intent = padButtonToIntent(button.index);
      if (intent) this.apply(intent);
    });

    this.render();
  }

  override update(_time: number, delta: number): void {
    this.titlePulse += delta;
    // The title prompt breathes so the placeholder screen reads as alive.
    if (this.state.screen === "title") {
      const prompt = this.root.getByName("title-prompt") as Phaser.GameObjects.Text | null;
      prompt?.setAlpha(0.55 + Math.sin(this.titlePulse / 400) * 0.45);
    }
  }

  private readonly handleKey = (event: KeyboardEvent): void => {
    if (this.bindingCapture?.device === "keyboard") {
      event.preventDefault();
      if (event.code === "Escape") {
        this.bindingCapture = null;
        this.render();
        return;
      }
      this.commitKeyboardBinding(event.code);
      return;
    }
    if (this.state.screen === "controls" && event.code === "Delete") {
      event.preventDefault();
      const controls = normalizeControlBindings(DEFAULT_CONTROL_BINDINGS);
      this.saveStore.updateControlBindings(controls);
      this.state = { ...this.state, controls };
      this.render();
      return;
    }
    const intent = keyToIntent(event.code);
    if (intent) {
      event.preventDefault();
      this.apply(intent);
    }
  };

  private apply(intent: ShellIntent): void {
    if (this.loadingAssetGroup) return;
    const result = stepShell(this.state, intent);
    this.state = result.state;
    for (const effect of result.effects) {
      if (effect.type === "set-setting") {
        if (effect.key === "fullscreenMode") {
          void this.setHostDisplaySelection(
            effect.value === "borderless" ? "borderless" : "windowed",
            this.state.settings.selectedDisplayId,
          );
          continue;
        }
        if (effect.key === "selectedDisplayId") {
          this.saveStore.updateSettings({ selectedDisplayId: typeof effect.value === "string" ? effect.value : null });
          void this.setHostDisplaySelection(
            this.state.settings.fullscreenMode,
            typeof effect.value === "string" ? effect.value : null,
          );
          continue;
        }
        if (effect.key === "frameCap") {
          this.saveStore.updateSettings({ frameCap: effect.value === 60 || effect.value === 120 || effect.value === 144 ? effect.value : "display" });
          this.fullscreenFeedback = "Frame cap applies when the next screen opens.";
          continue;
        }
        this.saveStore.updateSettings({ [effect.key]: effect.value });
        if (effect.key === "displaySizePercent" || effect.key === "brightness" || effect.key === "gamma") {
          reapplyDisplayScale();
        }
      } else if (effect.type === "start-run") {
        this.saveStore.selectPerk(effect.perkId);
        this.saveStore.selectHero(effect.heroId === "medic" ? "medic" : "marine");
        this.saveStore.selectThreatTier(effect.threatTier);
        window.location.href = `?screen=map&hero=${effect.heroId}&threat=${effect.threatTier}`;
        return;
      } else if (effect.type === "open-url") {
        window.location.href = effect.url;
        return;
      } else if (effect.type === "capture-binding") {
        this.bindingCapture = { device: effect.device, action: effect.action };
      } else if (effect.type === "purchase-armory-node") {
        this.saveStore.purchaseArmoryNode(effect.nodeId);
      } else if (effect.type === "select-armory-node") {
        this.saveStore.selectArmoryNode(effect.nodeId);
      }
    }
    this.render();
  }

  private readonly handleFullscreenChange = (): void => {
    if (currentHostDisplaySelection()) return;
    const fullscreenMode = document.fullscreenElement ? "borderless" : "windowed";
    this.fullscreenFeedback = null;
    this.saveStore.updateSettings({ fullscreenMode });
    this.state = { ...this.state, settings: { ...this.state.settings, fullscreenMode } };
    reapplyDisplayScale();
    this.render();
  };

  private async setHostDisplaySelection(
    mode: "windowed" | "borderless",
    selectedDisplayId: string | null,
  ): Promise<void> {
    const applied = await applyHostDisplaySelection(document, { fullscreenMode: mode, selectedDisplayId });
    if (!applied) return;
    const failed = applied.fullscreenMode !== mode || applied.selectedDisplayId !== selectedDisplayId;
    this.fullscreenFeedback = failed ? "The requested display mode was unavailable." : null;
    this.saveStore.updateSettings(applied);
    this.state = { ...this.state, settings: { ...this.state.settings, ...applied } };
    reapplyDisplayScale();
    this.render();
  }

  private render(): void {
    // Review hook: the harness and browser checks read the flow state directly.
    (window as unknown as { __shellState?: ShellState }).__shellState = this.state;
    if (!this.ensureScreenAssets()) return;
    this.root.removeAll(true);
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, NAVY));
    this.root.add(this.add.image(WIDTH / 2, HEIGHT / 2, "bastion-logistics-map-backdrop-v1")
      .setDisplaySize(WIDTH, 640)
      .setAlpha(this.state.screen === "title" ? 0.82 : 0.48));
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, NAVY,
      this.state.screen === "title" ? 0.34 : 0.67));
    switch (this.state.screen) {
      case "title": this.renderTitle(); break;
      case "menu": this.renderMenu(); break;
      case "how-to-play": this.renderHowToPlay(); break;
      case "settings": this.renderSettings(); break;
      case "controls": this.renderControls(); break;
      case "lab": this.renderLab(); break;
      case "records": this.renderRecords(); break;
      case "armory": this.renderArmory(); break;
      case "character-select": this.renderCharacterSelect(); break;
      case "threat-select": this.renderThreatSelect(); break;
    }
  }

  private ensureScreenAssets(): boolean {
    const group = this.state.screen === "character-select" ? "shell-character" : null;
    const assets = group ? SHELL_CHARACTER_ASSETS : null;
    if (!assets || areGameAssetsLoaded(this, assets)) return true;
    if (this.loadingAssetGroup === group) return false;

    this.loadingAssetGroup = group;
    this.renderLoadingPanel();
    const queued = queueGameAssets(this, assets);
    if (queued === 0) {
      this.loadingAssetGroup = null;
      return true;
    }
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.loadingAssetGroup = null;
      this.render();
    });
    this.load.start();
    return false;
  }

  private renderLoadingPanel(): void {
    this.root.removeAll(true);
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, NAVY));
    this.root.add(this.add.image(WIDTH / 2, HEIGHT / 2, "bastion-logistics-map-backdrop-v1")
      .setDisplaySize(WIDTH, 640)
      .setAlpha(0.48));
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, NAVY, 0.74));
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, 360, 94, PANEL)
      .setStrokeStyle(2, TEAL_HEX));
    this.root.add(this.text(WIDTH / 2, HEIGHT / 2 - 10, "PREPARING DOSSIERS", TEAL, "18px", true));
    this.root.add(this.text(WIDTH / 2, HEIGHT / 2 + 20, "LOADING CHARACTER ART...", MUTED, "10px", true));
  }

  private renderTitle(): void {
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT - 54, WIDTH, 108, 0x0b121c, 0.76));
    this.root.add(this.text(WIDTH / 2, 170, "LAST BASTION", IVORY, "54px", true));
    this.root.add(this.text(WIDTH / 2, 225, "HOLD THE LINE", TEAL, "16px", true));
    const prompt = this.text(WIDTH / 2, 330, "PRESS ENTER", ORANGE, "22px", true);
    prompt.setName("title-prompt");
    this.root.add(this.panelBehind(prompt, 24));
    this.root.add(prompt);
    this.root.add(this.text(
      WIDTH / 2,
      HEIGHT - 28,
      "SOLO EXPEDITION  •  KEYBOARD & CONTROLLER  •  AUTOSAVES BETWEEN NODES",
      MUTED,
      "12px",
      true,
    ));
    this.clickZone(0, 0, WIDTH, HEIGHT, () => this.apply("confirm"));
  }

  private renderMenu(): void {
    this.root.add(this.text(70, 48, "LAST BASTION", IVORY, "28px"));
    const progress = this.saveStore.load().progress;
    const columns = 2;
    const cardWidth = 380, cardHeight = 72, originX = 90, originY = 100, gap = 16;
    MENU_CARDS.forEach((card, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = originX + column * (cardWidth + gap);
      const y = originY + row * (cardHeight + gap);
      const focused = index === this.state.menuIndex;
      const rect = this.add.rectangle(x + cardWidth / 2, y + cardHeight / 2, cardWidth, cardHeight, focused ? 0x24384f : PANEL)
        .setStrokeStyle(focused ? 3 : 1, focused ? TEAL_HEX : 0x3b4d63);
      this.root.add(rect);
      this.root.add(this.text(x + 22, y + 18, card.label, focused ? TEAL : IVORY, "20px"));
      const sub = card.id === "expedition" ? "20 NODES • ONE LIFE (Quick Drop until the starchart lands)"
        : card.id === "armory" ? `${progress.commandMarksLifetime} lifetime command marks • permanent starting kits`
        : card.id === "records" ? recordsLine(progress)
          : card.id === "codex" ? "The encyclopedia — discoveries fill the Monsterdex"
            : card.id === "lab" ? "Review scenarios and art galleries"
              : card.id === "settings" ? "Persisted immediately to local save"
                : "Four short pages";
      this.root.add(this.text(x + 22, y + 44, sub, MUTED, "11px"));
      this.clickZone(x, y, cardWidth, cardHeight, () => {
        this.state = { ...this.state, menuIndex: index };
        this.apply("confirm");
      });
    });
    this.root.add(this.text(70, HEIGHT - 34, "ARROWS/WASD MOVE  •  ENTER CONFIRM  •  ESC BACK", MUTED, "12px"));
  }

  private renderHowToPlay(): void {
    const pages = howToPlayPages(this.state.controls);
    const page = pages[this.state.howToPlayPage]!;
    this.root.add(this.text(70, 48, "HOW TO PLAY", IVORY, "28px"));
    this.root.add(this.add.rectangle(WIDTH / 2, 290, 760, 320, PANEL).setStrokeStyle(1, 0x3b4d63));
    // Diagram placeholder: Batch G supplies the real illustration per page.
    this.root.add(this.add.rectangle(WIDTH / 2, 240, 380, 130, 0x24384f).setStrokeStyle(1, TEAL_HEX));
    this.root.add(this.text(WIDTH / 2, 234, "[ DIAGRAM ]", MUTED, "13px", true));
    this.root.add(this.text(WIDTH / 2, 330, page.title, TEAL, "20px", true));
    this.root.add(this.text(WIDTH / 2, 386, page.body, IVORY, "14px", true));
    this.root.add(this.text(
      WIDTH / 2,
      470,
      `PAGE ${this.state.howToPlayPage + 1}/${pages.length}  •  LEFT/RIGHT TO TURN  •  ESC BACK`,
      MUTED,
      "12px",
      true,
    ));
    this.clickZone(0, 0, WIDTH / 2, HEIGHT, () => this.apply("left"));
    this.clickZone(WIDTH / 2, 0, WIDTH / 2, HEIGHT, () => this.apply("right"));
  }

  private renderSettings(): void {
    this.root.add(this.text(70, 48, "SETTINGS", IVORY, "28px"));
    this.root.add(this.text(
      70,
      84,
      this.fullscreenFeedback ?? "Changes persist immediately. URL parameters remain as review overrides.",
      this.fullscreenFeedback ? ORANGE : MUTED,
      "12px",
    ));
    const rowsPerColumn = Math.ceil(this.state.settingsRows.length / 2);
    const rowStep = rowsPerColumn > 13 ? 28 : 30;
    this.state.settingsRows.forEach((row, index) => {
      const column = Math.floor(index / rowsPerColumn);
      const rowIndex = index % rowsPerColumn;
      const x = 70 + column * 420;
      const y = 102 + rowIndex * rowStep;
      const focused = index === this.state.settingsIndex;
      this.root.add(this.add.rectangle(x + 190, y + 11, 380, 26, focused ? 0x24384f : PANEL)
        .setStrokeStyle(focused ? 2 : 1, focused ? TEAL_HEX : 0x3b4d63));
      this.root.add(this.text(x + 12, y + 5, row.label, focused ? TEAL : IVORY, "10px"));
      const controlsRow = row.kind === "action";
      const enabled = controlsRow || row.kind !== "toggle" || Boolean(this.state.settings[row.key]);
      const valueLabel = controlsRow
        ? "OPEN >"
        : row.kind === "toggle"
          ? enabled ? "ON" : "OFF"
          : formatSettingValue(row.key, this.state.settings[row.key]);
      this.root.add(this.text(x + 364, y + 5, valueLabel, enabled ? TEAL : ORANGE, "10px").setOrigin(1, 0));
      this.clickZone(x, y - 2, 380, 27, () => {
        this.state = { ...this.state, settingsIndex: index };
        this.apply("confirm");
      });
    });
    this.root.add(this.text(70, HEIGHT - 22, "UP/DOWN SELECT  •  ENTER/LEFT/RIGHT TOGGLE  •  ESC BACK", MUTED, "11px"));
  }

  private renderControls(): void {
    this.root.add(this.text(70, 42, "CONTROL BINDINGS", IVORY, "27px"));
    this.root.add(this.text(70, 76, "LEFT/RIGHT DEVICE  •  ENTER REBIND  •  DELETE RESET ALL  •  ESC CANCEL/BACK", MUTED, "11px"));
    this.root.add(this.text(700, 42, this.state.controlDevice === "keyboard" ? "KEYBOARD" : "CONTROLLER", TEAL, "16px", true));
    KEYBOARD_BINDABLE_ACTIONS.forEach((action, index) => {
      const column = index < 5 ? 0 : 1;
      const row = index % 5;
      const x = 80 + column * 420;
      const y = 112 + row * 72;
      const focused = index === this.state.controlIndex;
      const gamepadAction = GAMEPAD_BINDABLE_ACTIONS.includes(action as GamepadBindableAction);
      const unavailable = this.state.controlDevice === "gamepad" && !gamepadAction;
      this.root.add(this.add.rectangle(x + 190, y + 23, 380, 54, focused ? 0x24384f : PANEL)
        .setStrokeStyle(focused ? 3 : 1, focused ? TEAL_HEX : 0x3b4d63));
      this.root.add(this.text(x + 16, y + 10, controlActionLabel(action), unavailable ? MUTED : focused ? TEAL : IVORY, "15px"));
      const binding = this.state.controlDevice === "keyboard"
        ? keyboardBindingLabel(this.state.controls.keyboard[action])
        : gamepadAction ? gamepadBindingLabel(this.state.controls.gamepad[action as GamepadBindableAction]) : "LEFT STICK";
      this.root.add(this.text(x + 330, y + 10, binding, unavailable ? MUTED : TEAL, "15px", true));
      this.clickZone(x, y - 4, 380, 54, () => {
        this.state = { ...this.state, controlIndex: index };
        this.apply("confirm");
      });
    });
    if (this.bindingCapture) {
      this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, 570, 120, 0x0b121c, 0.97).setStrokeStyle(3, TEAL_HEX));
      this.root.add(this.text(WIDTH / 2, HEIGHT / 2 - 18, `PRESS A ${this.bindingCapture.device === "keyboard" ? "KEY" : "CONTROLLER BUTTON"}`, IVORY, "20px", true));
      this.root.add(this.text(WIDTH / 2, HEIGHT / 2 + 22, "Duplicate assignments swap automatically  •  ESC cancels keyboard capture", MUTED, "10px", true));
    }
  }

  private commitKeyboardBinding(code: string): void {
    if (!this.bindingCapture || this.bindingCapture.device !== "keyboard") return;
    if (!isBindableKeyboardCode(code)) return;
    const controls = rebindKeyboard(this.state.controls, this.bindingCapture.action as KeyboardBindableAction, code);
    this.saveStore.updateControlBindings(controls);
    this.state = { ...this.state, controls };
    this.bindingCapture = null;
    this.render();
  }

  private commitGamepadBinding(button: GamepadButton): void {
    if (!this.bindingCapture || this.bindingCapture.device !== "gamepad") return;
    const controls = rebindGamepad(this.state.controls, this.bindingCapture.action as GamepadBindableAction, button);
    this.saveStore.updateControlBindings(controls);
    this.state = { ...this.state, controls };
    this.bindingCapture = null;
    this.render();
  }

  private renderLab(): void {
    this.root.add(this.text(70, 48, "LAB", IVORY, "28px"));
    this.root.add(this.text(70, 84, "Deterministic review scenarios. The full route list lives in dev/README.md.", MUTED, "12px"));
    LAB_ROUTES.forEach((route, index) => {
      const y = 116 + index * 38;
      const focused = index === this.state.labIndex;
      this.root.add(this.add.rectangle(WIDTH / 2, y + 14, 700, 32, focused ? 0x24384f : PANEL)
        .setStrokeStyle(focused ? 2 : 1, focused ? TEAL_HEX : 0x3b4d63));
      this.root.add(this.text(150, y + 4, route.label, focused ? TEAL : IVORY, "14px"));
      this.clickZone(130, y - 2, 700, 32, () => {
        this.state = { ...this.state, labIndex: index };
        this.apply("confirm");
      });
    });
    this.root.add(this.text(70, HEIGHT - 34, "UP/DOWN SELECT  •  ENTER LAUNCH  •  ESC BACK", MUTED, "12px"));
  }

  private renderRecords(): void {
    const save = this.saveStore.load();
    const progress = save.progress;
    this.root.add(this.text(70, 48, "RECORDS", IVORY, "28px"));
    this.root.add(this.add.rectangle(250, 278, 360, 350, PANEL).setStrokeStyle(1, 0x3b4d63));
    this.root.add(this.add.rectangle(675, 278, 450, 350, PANEL).setStrokeStyle(1, 0x3b4d63));
    this.root.add(this.text(90, 92, "CAREER", TEAL, "13px"));
    const rows: readonly [string, string][] = [
      ["RUNS FINISHED", String(progress.runsFinished)],
      ["VICTORIES", String(progress.victories)],
      ["BEST WAVE / COLUMN", String(progress.bestWaveReached)],
      ["BEST EXPEDITION NODES", String(progress.bestNodesCleared)],
      ["LIFETIME NODES CLEARED", String(progress.nodesCleared)],
      ["ENEMIES DEFEATED", String(progress.totalKills)],
      ["TOTAL DAMAGE", formatRecord(progress.totalDamage)],
      ["SCRAP EARNED", formatRecord(progress.totalScrapEarned)],
    ];
    rows.forEach(([label, value], index) => {
      const y = 120 + index * 38;
      this.root.add(this.text(90, y, label, MUTED, "10px"));
      this.root.add(this.text(390, y, value, index < 2 ? TEAL : IVORY, "15px", true));
    });

    const visibleHistory = save.runHistory.slice(this.state.recordsOffset, this.state.recordsOffset + 6);
    const firstVisible = save.runHistory.length === 0 ? 0 : this.state.recordsOffset + 1;
    const lastVisible = this.state.recordsOffset + visibleHistory.length;
    this.root.add(this.text(470, 92, "RECENT RUNS", TEAL, "13px"));
    this.root.add(this.text(870, 94, `${firstVisible}-${lastVisible} / ${save.runHistory.length}`, MUTED, "10px", true));
    if (visibleHistory.length === 0) {
      this.root.add(this.text(675, 270, "NO COMPLETED RUNS YET", MUTED, "13px", true));
    }
    visibleHistory.forEach((entry, index) => {
      const summary = entry.summary;
      const y = 124 + index * 52;
      const resultColor = summary.outcome === "victory" ? TEAL : "#ff7d72";
      const date = entry.completedAtMs > 0
        ? new Date(entry.completedAtMs).toISOString().slice(0, 10)
        : "LEGACY SAVE";
      const progressLabel = summary.mode === "expedition"
        ? `${summary.nodesCleared} NODES${summary.threatTier === null ? "" : `  T${summary.threatTier}`}`
        : `WAVE ${summary.waveReached}`;
      this.root.add(this.add.rectangle(675, y + 18, 410, 44, 0x172335).setStrokeStyle(1, 0x334860));
      this.root.add(this.text(484, y + 5, summary.outcome.toUpperCase(), resultColor, "11px"));
      this.root.add(this.text(570, y + 5, progressLabel, IVORY, "11px"));
      this.root.add(this.text(852, y + 5, date, MUTED, "9px", true));
      this.root.add(this.text(484, y + 24, `${summary.kills} KILLS  •  ${summary.commandMarksEarned} MARKS`, MUTED, "9px"));
    });
    this.root.add(this.text(WIDTH / 2, 480, "UP/DOWN  SCROLL RUNS  •  ENTER / ESC  BACK", MUTED, "12px", true));
    this.clickZone(0, 450, WIDTH, 90, () => this.apply("back"));
  }

  private renderArmory(): void {
    this.root.add(this.text(70, 42, "ARMORY", IVORY, "28px"));
    this.root.add(this.text(70, 78, `${COMMAND_MARKS_LABEL}  ${this.state.commandMarksBalance}`, TEAL, "16px"));
    this.root.add(this.text(360, 80, "Permanent purchases • no refunds • selected kit applies to new runs", MUTED, "11px"));
    ARMORY_NODES.forEach((node, index) => {
      const x = index === 0 ? 480 : index === 1 ? 270 : 690;
      const y = index === 0 ? 180 : 355;
      const focused = index === this.state.armoryIndex;
      const purchased = this.state.purchasedArmoryNodeIds.includes(node.id);
      const selected = this.state.selectedArmoryNodeId === node.id;
      const prerequisitesMet = node.prerequisiteIds.every((id) => this.state.purchasedArmoryNodeIds.includes(id));
      const affordable = this.state.commandMarksBalance >= node.cost;
      this.root.add(this.add.rectangle(x, y, 300, 118, focused ? 0x24384f : PANEL)
        .setStrokeStyle(focused ? 3 : 1, selected ? 0xffd36b : focused ? TEAL_HEX : 0x3b4d63));
      this.root.add(this.text(x, y - 40, node.name, purchased ? TEAL : focused ? IVORY : MUTED, "14px", true));
      this.root.add(this.text(x, y - 11, node.description, IVORY, "10px", true).setWordWrapWidth(260));
      const status = selected ? "SELECTED"
        : purchased ? "OWNED • ENTER TO EQUIP"
          : !prerequisitesMet ? `REQUIRES ${node.prerequisiteIds.map((id) => armoryNode(id).name).join(", ")}`
            : affordable ? `${node.cost} MARKS • ENTER TO PURCHASE` : `${node.cost} MARKS • NEED ${node.cost - this.state.commandMarksBalance}`;
      this.root.add(this.text(x, y + 37, status, selected || (affordable && prerequisitesMet) ? TEAL : ORANGE, "9px", true));
      this.clickZone(x - 150, y - 59, 300, 118, () => {
        if (this.state.armoryIndex === index) this.apply("confirm");
        else {
          this.state = { ...this.state, armoryIndex: index };
          this.render();
        }
      });
    });
    this.root.add(this.add.line(0, 0, 480, 239, 270, 296, 0x68e4e8, 0.45).setOrigin(0));
    this.root.add(this.add.line(0, 0, 480, 239, 690, 296, 0x68e4e8, 0.45).setOrigin(0));
    this.root.add(this.text(70, HEIGHT - 26, "ARROWS SELECT • ENTER PURCHASE/EQUIP • ESC BACK", MUTED, "11px"));
  }

  private renderCharacterSelect(): void {
    this.root.add(this.text(70, 48, "CHARACTER SELECT", IVORY, "28px"));
    const hero = ROSTER[this.state.rosterIndex]!;
    const perk = PERK_CATALOG[this.state.perkIndex]!;
    const perkUnlocked = this.state.unlockedPerkIds.includes(perk.id);

    // Left: full-height select portrait; gameplay sheets remain separate.
    this.root.add(this.add.rectangle(250, 250, 300, 320, PANEL).setStrokeStyle(1, 0x3b4d63));
    const assaultC3Preview = hero.id === "assault" && requestedAssaultC3Preview();
    if (hero.status === "playable" || assaultC3Preview) {
      const portraitKey = hero.id === "medic"
        ? "medic-select-portrait-v1"
        : hero.id === "assault" ? "assault-select-portrait-v1" : "marine-select-portrait-v1";
      this.root.add(this.add.image(250, 258, portraitKey).setDisplaySize(196, 294));
    } else {
      this.root.add(this.add.rectangle(250, 250, 120, 220, 0x232c3a)
        .setStrokeStyle(2, 0x3b4d63));
    }
    this.root.add(this.text(250, 415, hero.status === "playable" ? hero.name
      : hero.status === "in-development" ? `${hero.name} — IN DEVELOPMENT` : "????", IVORY, "16px", true));

    // Right: dossier.
    this.root.add(this.add.rectangle(660, 260, 440, 350, PANEL).setStrokeStyle(1, 0x3b4d63));
    if (isHeroId(hero.id)) {
      const definition = heroDefinition(hero.id);
      const dossier = [
        `ROLE  ${definition.role}`,
        "",
        `PASSIVE  ${definition.passive.name}`,
        definition.passive.description,
        "",
        `ULTIMATE  ${definition.ultimate.name}`,
        definition.ultimate.description,
        "",
        `STARTING WEAPON  ${definition.startingWeaponName}`,
        `PER LEVEL  ${definition.levelGrowthDescription}`,
        ...(hero.status === "in-development" ? ["", definition.unlockText] : []),
      ].join("\n");
      this.root.add(this.text(470, 108, dossier, IVORY, "12px").setWordWrapWidth(390));
    } else {
      this.root.add(this.text(660, 240, "Signal lost.\nFuture hero slot.", MUTED, "14px", true));
    }

    this.root.add(this.text(470, 326, `PERK  ${perkUnlocked ? perk.name.toUpperCase() : "LOCKED"}`, perkUnlocked ? TEAL : ORANGE, "14px"));
    this.root.add(this.text(470, 348, perkUnlocked ? perk.description : perk.unlockText, perkUnlocked ? IVORY : MUTED, "11px")
      .setWordWrapWidth(390));
    PERK_CATALOG.forEach((entry, index) => {
      const { x, y } = perkTilePosition(index);
      const selected = index === this.state.perkIndex;
      const unlocked = this.state.unlockedPerkIds.includes(entry.id);
      if (index < 7) {
        this.root.add(this.add.sprite(x, y, "canonical-perk-tiles-v2", index)
          .setDisplaySize(38, 38)
          .setAlpha(unlocked ? 1 : 0.3)
          .setTint(selected ? 0xffffff : 0xb7c2cf));
      } else {
        const tier = index - 7;
        this.root.add(this.add.rectangle(x, y, 38, 38, unlocked ? 0x183c46 : 0x202936)
          .setStrokeStyle(2, unlocked ? TEAL_HEX : 0x596779)
          .setAlpha(unlocked ? 1 : 0.55));
        this.root.add(this.text(x, y - 7, `T${tier}`, unlocked ? TEAL : MUTED, "12px", true));
      }
      if (selected) {
        this.root.add(this.add.rectangle(x, y, 44, 44).setStrokeStyle(3, perkUnlocked ? TEAL_HEX : 0xff9a52));
      }
      this.clickZone(x - 22, y - 22, 44, 44, () => {
        this.state = { ...this.state, perkIndex: index };
        this.render();
      });
    });

    // Roster rail.
    ROSTER.forEach((entry, index) => {
      const x = 140 + index * 140;
      const focused = index === this.state.rosterIndex;
      this.root.add(this.add.rectangle(x, 470, 120, 44, focused ? 0x24384f : PANEL)
        .setStrokeStyle(focused ? 3 : 1, focused ? TEAL_HEX : 0x3b4d63));
      this.root.add(this.text(x, 462, entry.status === "silhouette" ? "????" : entry.name,
        focused ? TEAL : entry.status === "playable" ? IVORY : MUTED, "13px", true));
      this.clickZone(x - 60, 448, 120, 44, () => {
        if (this.state.rosterIndex === index) {
          this.apply("confirm");
        } else {
          this.state = { ...this.state, rosterIndex: index };
          this.render();
        }
      });
    });
    const canDeploy = hero.status === "playable"
      && isHeroId(hero.id)
      && isHeroDeploymentUnlocked(hero.id, this.state.purchasedArmoryNodeIds)
      && perkUnlocked;
    this.root.add(this.add.rectangle(850, 470, 120, 44, canDeploy ? 0x24384f : PANEL)
      .setStrokeStyle(2, canDeploy ? TEAL_HEX : 0x3b4d63));
    this.root.add(this.text(850, 470, "DEPLOY", canDeploy ? TEAL : MUTED, "13px", true));
    if (canDeploy) this.clickZone(790, 448, 120, 44, () => this.apply("confirm"));
    this.root.add(this.text(70, HEIGHT - 24, "LEFT/RIGHT HERO  •  UP/DOWN PERK  •  ENTER DEPLOY  •  ESC BACK", MUTED, "12px"));
  }

  private renderThreatSelect(): void {
    this.root.add(this.text(70, 48, "THREAT TIER", IVORY, "28px"));
    this.root.add(this.text(70, 84, "Modifiers stack. Clear a tier to unlock the next.", MUTED, "12px"));
    THREAT_TIERS.forEach((definition, index) => {
      const y = 150 + index * 105;
      const focused = index === this.state.threatTierIndex;
      const unlocked = this.state.unlockedThreatTiers.includes(definition.tier);
      this.root.add(this.add.rectangle(WIDTH / 2, y, 760, 82, focused ? 0x24384f : PANEL)
        .setStrokeStyle(focused ? 3 : 1, focused ? (unlocked ? TEAL_HEX : 0xff9a52) : 0x3b4d63));
      this.root.add(this.text(130, y - 19, `TIER ${definition.tier}  ${unlocked ? definition.name : "LOCKED"}`,
        unlocked ? (focused ? TEAL : IVORY) : ORANGE, "16px"));
      const detail = unlocked
        ? `${definition.modifier}  Best: ${this.saveStore.load().progress.threatTierBestNodes[definition.tier]} nodes`
        : `Clear Tier ${definition.tier - 1} to unlock.`;
      this.root.add(this.text(130, y + 10, detail, unlocked ? MUTED : ORANGE, "11px"));
      this.clickZone(100, y - 41, 760, 82, () => {
        if (this.state.threatTierIndex === index) this.apply("confirm");
        else {
          this.state = { ...this.state, threatTierIndex: index };
          this.render();
        }
      });
    });
    const selected = THREAT_TIERS[this.state.threatTierIndex]!;
    const canDeploy = this.state.unlockedThreatTiers.includes(selected.tier);
    this.root.add(this.text(WIDTH / 2, 480, canDeploy ? "ENTER  BEGIN EXPEDITION" : "TIER LOCKED", canDeploy ? TEAL : ORANGE, "14px", true));
    this.root.add(this.text(70, HEIGHT - 24, "ARROWS SELECT  -  ENTER DEPLOY  -  ESC BACK", MUTED, "12px"));
  }

  private text(
    x: number,
    y: number,
    content: string,
    color: string,
    size: string,
    centered = false,
  ): Phaser.GameObjects.Text {
    const label = this.add.text(x, y, content, {
      fontFamily: "Consolas, monospace",
      fontSize: size,
      color,
      align: centered ? "center" : "left",
    });
    if (centered) label.setOrigin(0.5, 0.5);
    return label;
  }

  private panelBehind(target: Phaser.GameObjects.Text, padding: number): Phaser.GameObjects.Rectangle {
    return this.add.rectangle(
      target.x,
      target.y,
      target.width + padding * 2,
      target.height + padding,
      PANEL,
    ).setStrokeStyle(1, 0x3b4d63);
  }

  private clickZone(x: number, y: number, width: number, height: number, onClick: () => void): void {
    const zone = this.add.zone(x, y, width, height).setOrigin(0, 0).setInteractive();
    zone.on("pointerdown", onClick);
    this.root.add(zone);
  }
}

function recordsLine(progress: GameProgress): string {
  return `Runs ${progress.runsFinished}  •  Victories ${progress.victories}  •  Kills ${progress.totalKills}`;
}

function requestedInitialScreen(): "title" | "character-select" {
  if (typeof window === "undefined") return "title";
  return new URLSearchParams(window.location.search).get("flow") === "character-select"
    ? "character-select"
    : "title";
}

function requestedAssaultC3Preview(): boolean {
  return typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("c3") === "assault";
}

function formatRecord(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

function formatSettingValue(key: string, value: unknown): string {
  if (key.endsWith("Volume") || key === "aimAssistStrength" || key === "brightness") return `${Math.round(Number(value) * 100)}%`;
  if (key === "gamma") return Number(value).toFixed(1);
  if (key.includes("Deadzone")) return Number(value).toFixed(2);
  if (key === "displaySizePercent") return `${Math.round(Number(value))}%`;
  if (key === "selectedDisplayId") return displayLabelForId(value);
  if (key === "frameCap") return value === "display" ? "DISPLAY" : `${value} FPS`;
  if (key === "uiScale" || key === "radarSize") {
    return `${Number(value).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}x`;
  }
  return String(value).toUpperCase();
}

function keyToIntent(code: string): ShellIntent | null {
  switch (code) {
    case "ArrowUp": case "KeyW": return "up";
    case "ArrowDown": case "KeyS": return "down";
    case "ArrowLeft": case "KeyA": return "left";
    case "ArrowRight": case "KeyD": return "right";
    case "Enter": case "Space": case "NumpadEnter": return "confirm";
    case "Escape": case "Backspace": return "back";
    default: return null;
  }
}

/** Standard-mapping pad: d-pad 12-15, A=0 confirm, B=1 back. */
function padButtonToIntent(index: number): ShellIntent | null {
  switch (index) {
    case 12: return "up";
    case 13: return "down";
    case 14: return "left";
    case 15: return "right";
    case 0: return "confirm";
    case 1: return "back";
    default: return null;
  }
}

function gamepadButtonFromIndex(index: number): GamepadButton | null {
  return ({ 0: "south", 1: "east", 2: "west", 3: "north", 9: "start", 11: "rightStick" } as Record<number, GamepadButton>)[index] ?? null;
}

function controlActionLabel(action: KeyboardBindableAction): string {
  return ({
    moveUp: "MOVE UP", moveDown: "MOVE DOWN", moveLeft: "MOVE LEFT", moveRight: "MOVE RIGHT",
    evade: "ROLL / EVADE", interact: "INTERACT", ultimate: "ULTIMATE", kit: "USE KIT",
    toggleFireMode: "FIRE MODE", pause: "PAUSE",
  })[action];
}
