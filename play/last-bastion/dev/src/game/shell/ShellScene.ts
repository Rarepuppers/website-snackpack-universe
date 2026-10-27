import Phaser from "phaser";
import { LocalSaveStore, previewSaveImport, type GameProgress } from "../save/LocalSaveStore";
import { createLocalSaveStore } from "../save/SaveStorage";
import { heroDefinition, isHeroId } from "../hero/HeroCatalog";
import { areGameAssetsLoaded, queueGameAssets } from "../assets/PhaserAssetQueue";
import { titleBackdropAssetId } from "../assets/TitleBackdropAsset";
import {
  SHELL_BASE_ASSETS,
  SHELL_CHARACTER_ASSETS,
} from "../assets/ShellAssetManifest";
import { PERK_CATALOG } from "../perks/perkCatalog";
import { THREAT_TIERS } from "../expedition/ThreatTier";
import { ARMORY_NODES, COMMAND_MARKS_LABEL, armoryNode, isHeroDeploymentUnlocked } from "../progression/ArmoryProgression";
import { armoryLayout } from "./ArmoryLayout";
import { reapplyDisplayScale, uiTextResolution } from "../rendering/DisplayScaling";
import {
  applyHostDisplaySelection,
  currentHostDisplaySelection,
  displayLabelForId,
  hostDisplayCapabilities,
} from "../rendering/DesktopDisplayRuntime";
import {
  createShellState,
  SETTINGS_GROUPS,
  settingsGroup,
  howToPlayPages,
  isShellRunMode,
  menuCardSubtitle,
  LAB_ROUTES,
  MENU_COLUMNS,
  perkGridLayout,
  perkTilePosition,
  ROSTER,
  settingsRowsForDisplayCapabilities,
  stepShell,
  setShellSetting,
  type ShellIntent,
  type ShellRunMode,
  type ShellState,
} from "./ScreenFlow";
import { dailyLabel } from "../run/DailyDrop";
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
import { historyRecordPresentation } from "../run/RunRecordPresentation";
import { localDayKey } from "../run/LocalDayKey";
import { fitText, phaserTextMeasure } from "../ui/MeasuredText";
import {
  UI_BUTTON_SLICE,
  UI_FOCUS_SLICE,
  UI_PANEL_SLICE,
  uiButtonAssetId,
  uiChromeEnabled,
  type UiButtonState,
} from "../assets/UiChromeAssets";
import { requestedShellScreen } from "./ShellReviewRoute";
import { heroDossierCopy } from "./HeroDossierCopy";
import { SemanticShell, type BindingCapture } from "./SemanticShell";
import { careerRecordRows, controlActionLabel } from "./ShellPresentation";

type UiPanelWeight = "recessed" | "raised" | "emphasis";

const WIDTH = 960;
const HEIGHT = 540;

/** Character-select hero dossier. Its bottom is derived from the perk layout. */
const DOSSIER_LEFT = 470;
const DOSSIER_TOP = 108;
const DOSSIER_WRAP_WIDTH = 390;
const DOSSIER_PADDING = 4;
/** Clearance kept between the dossier last line and the PERK heading. */
const DOSSIER_HEADING_GAP = 8;
const DOSSIER_SIZES: readonly number[] = [12, 11];
const NAVY = 0x151e2b;
const PANEL = 0x1d2938;
const IVORY = "#e8e2d4";
const TEAL = "#68e4e8";
const TEAL_HEX = 0x68e4e8;
const ORANGE = "#ff9a52";
const MUTED = "#8fa1b3";

/**
 * Front-end shell: authored chrome plus ScreenFlow-owned state/effects.
 * Title/menu/settings/help/controls/records use native semantics; remaining screens retain
 * their canvas controls until separately accepted accessibility slices land.
 */
export class ShellScene extends Phaser.Scene {
  private semantic?: SemanticShell;
  private focusSemanticSelection = false;
  private saveStore!: LocalSaveStore;
  private state!: ShellState;
  private root!: Phaser.GameObjects.Container;
  private titlePulse = 0;
  private characterLoadFailed = false;
  private loadingAssetGroup: "shell-character" | null = null;
  private bindingCapture: BindingCapture | null = null;
  private bindingFeedback: string | null = null;
  private fullscreenFeedback: string | null = null;
  private saveTransferFeedback: string | null = null;

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
      { labEnabled: requestedLabAccess(), runMode: requestedRunMode() },
    );
    this.root = this.add.container(0, 0);
    this.semantic = new SemanticShell(this.game.canvas, {
      intent: intent => this.apply(intent),
      select: index => {
        const key = this.state.screen === "menu" ? "menuIndex" : this.state.screen === "controls" ? "controlIndex" : "settingsIndex";
        if (this.state[key] === index) return;
        this.state = { ...this.state, [key]: index }; this.render();
      },
      activate: index => {
        const key = this.state.screen === "menu" ? "menuIndex" : this.state.screen === "controls" ? "controlIndex" : "settingsIndex";
        this.state = { ...this.state, [key]: index }; this.apply("confirm");
      },
      group: name => {
        const index = this.state.settingsRows.findIndex(row => settingsGroup(row.key) === name);
        if (index >= 0) { this.state = { ...this.state, settingsIndex: index }; this.focusSemanticSelection = true; this.render(); }
      },
      setting: (index, value) => {
        this.state = { ...this.state, settingsIndex: index };
        this.applyResult(setShellSetting(this.state, value));
      },
      retrySave: () => { this.saveStore.retryPersistence(); this.render(); },
      device: device => { if (this.state.controlDevice !== device) this.apply("right"); },
      selection: (field, index) => {
        const count = field === "rosterIndex" ? ROSTER.length : field === "perkIndex" ? PERK_CATALOG.length : THREAT_TIERS.length;
        if (!Number.isInteger(index) || index < 0 || index >= count) return;
        this.state = { ...this.state, [field]: index }; this.render();
      },
      resetBindings: () => this.resetControlBindings(),
      cancelBinding: () => this.cancelBindingCapture(),
    });

    // One direct window listener instead of the Phaser keyboard plugin: the
    // plugin can deliver capture-list keys (Enter, Space, arrows) a second
    // time from its frame queue, which double-steps menu navigation.
    window.addEventListener("keydown", this.handleKey);
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
    this.events.once("shutdown", () => {
      this.semantic?.destroy();
      this.semantic = undefined;
      window.removeEventListener("keydown", this.handleKey);
      document.removeEventListener("fullscreenchange", this.handleFullscreenChange);
      this.input.gamepad?.off("down", this.handleGamepad);
    });
    this.input.gamepad?.on("down", this.handleGamepad);

    this.render();
  }

  private readonly handleGamepad = (_pad: unknown, button: { index: number }): void => {
      if (this.bindingCapture) {
        if (this.bindingCapture.device === "gamepad") {
          const mapped = gamepadButtonFromIndex(button.index);
          if (mapped) this.commitGamepadBinding(mapped);
        }
        return;
      }
      const intent = padButtonToIntent(button.index);
      if (intent === "confirm" && ["character-select", "threat-select"].includes(this.state.screen)
        && this.semantic?.owns(document.activeElement) && document.activeElement instanceof HTMLButtonElement) {
        document.activeElement.click(); return;
      }
      if (intent) { this.focusSemanticSelection = true; this.apply(intent); }
  };

  override update(_time: number, delta: number): void {
    this.titlePulse += delta;
    // Keep the call to action legible for the whole pulse; reduced motion is steady.
    if (this.state.screen === "title") {
      const prompt = this.root.getByName("title-prompt") as Phaser.GameObjects.Text | null;
      const reducedMotion = this.state.settings.reducedMotionEnabled;
      prompt?.setAlpha(reducedMotion ? 1 : 0.88 + Math.sin(this.titlePulse / 400) * 0.12);
    }
  }

  private readonly handleKey = (event: KeyboardEvent): void => {
    if (this.bindingCapture) {
      // The key that opened capture can still be held. Require a fresh
      // key-down so its repeats never silently assign that opener.
      if (event.repeat) { event.preventDefault(); return; }
      if (event.code === "Escape") {
        event.preventDefault(); this.cancelBindingCapture();
        return;
      }
      const cancel = event.target instanceof HTMLElement && event.target.closest('[data-shell-key="capture-cancel"]');
      // A native Cancel activation belongs to the dialog, not the binding.
      if (cancel && ["Enter", "NumpadEnter", "Space"].includes(event.code)) return;
      event.preventDefault();
      if (this.bindingCapture.device === "keyboard") this.commitKeyboardBinding(event.code);
      else if (event.code === "Tab") document.querySelector<HTMLButtonElement>('[data-shell-key="capture-cancel"]')?.focus();
      return;
    }
    if (this.semantic?.owns(event.target)) {
      // Native Enter/Space and form arrows must fire once through their own
      // controls, never a second time through the scene's global shortcut.
      const target = event.target as HTMLElement;
      if (target.closest("[data-native-scroll]") && ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", "Space"].includes(event.code)) return;
      const checkbox = target instanceof HTMLInputElement && target.type === "checkbox";
      if (checkbox && ["Enter", "NumpadEnter"].includes(event.code)) {
        event.preventDefault(); this.apply("confirm"); return;
      }
      const checkboxNavigation = checkbox && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code);
      if (event.code !== "Escape" && !checkboxNavigation && (target.matches("input, select, textarea")
        || ["Enter", "NumpadEnter", "Space", "Tab"].includes(event.code))) return;
    }
    if (event.code === "KeyP" && this.saveStore.persistence().kind === "failed") {
      event.preventDefault();
      this.saveStore.retryPersistence();
      this.render();
      return;
    }
    if (this.state.screen === "controls" && event.code === "Delete") {
      event.preventDefault();
      this.resetControlBindings();
      return;
    }
    const intent = keyToIntent(event.code);
    if (intent) {
      event.preventDefault();
      this.focusSemanticSelection = true;
      this.apply(intent);
    }
  };

  private apply(intent: ShellIntent): void {
    if (this.state.screen === "character-select" && (this.loadingAssetGroup || this.characterLoadFailed)) {
      if (intent === "back") {
        this.state = { ...this.state, screen: "menu" };
        this.render();
      } else if (intent === "confirm" && this.characterLoadFailed) {
        this.characterLoadFailed = false;
        this.render();
      }
      return;
    }
    this.applyResult(stepShell(this.state, intent));
  }

  private applyResult(result: ReturnType<typeof stepShell>): void {
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
        this.saveStore.selectHero(effect.heroId);
        if (effect.mode === "expedition") {
          this.saveStore.selectThreatTier(effect.threatTier);
          window.location.href = `?screen=map&hero=${effect.heroId}&threat=${effect.threatTier}`;
          return;
        }
        const params = new URLSearchParams({ screen: "game", hero: effect.heroId, perk: effect.perkId });
        // The day is fixed when the player presses deploy, so a run started at
        // 23:59 is still that day's Daily when it ends after midnight.
        if (effect.mode === "daily") params.set("daily", localDayKey(Date.now()));
        window.location.href = `?${params.toString()}`;
        return;
      } else if (effect.type === "open-url") {
        window.location.href = effect.url;
        return;
      } else if (effect.type === "capture-binding") {
        this.bindingCapture = { device: effect.device, action: effect.action };
        this.bindingFeedback = null;
      } else if (effect.type === "purchase-armory-node") {
        this.saveStore.purchaseArmoryNode(effect.nodeId);
      } else if (effect.type === "select-armory-node") {
        this.saveStore.selectArmoryNode(effect.nodeId);
      } else if (effect.type === "transfer-save") {
        if (effect.operation === "export") this.exportSaveBackup();
        else this.importSaveBackup();
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
    (window as unknown as { __savePersistence?: object }).__savePersistence = this.saveStore.persistence();
    const assetsReady = this.ensureScreenAssets();
    (window as unknown as { __shellAssetsReady?: boolean }).__shellAssetsReady = assetsReady;
    (window as unknown as { __shellLoadFailed?: boolean }).__shellLoadFailed = this.characterLoadFailed;
    if (!assetsReady) { this.renderSemantics(); return; }
    this.root.removeAll(true);
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, NAVY));
    const backdropId = this.state.screen === "title"
      ? titleBackdropAssetId()
      : "bastion-logistics-map-backdrop-v1";
    this.root.add(this.add.image(WIDTH / 2, HEIGHT / 2, backdropId)
      .setDisplaySize(WIDTH, this.state.screen === "title" ? HEIGHT : 640)
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
    this.renderPersistenceWarning();
    this.renderSemantics();
  }

  private renderSemantics(): void {
    const persistence = this.saveStore.persistence();
    this.semantic?.render({ state: this.state, progress: this.saveStore.load().progress,
      saved: persistence.kind === "saved", saveFailed: persistence.kind === "failed",
      feedback: this.saveTransferFeedback ?? this.fullscreenFeedback, formatValue: formatSettingValue,
      bindingCapture: this.bindingCapture, bindingFeedback: this.bindingFeedback,
      history: this.saveStore.load().runHistory,
      characterLoading: this.loadingAssetGroup !== null, characterLoadFailed: this.characterLoadFailed,
    }, this.focusSemanticSelection);
    this.focusSemanticSelection = false;
  }

  private renderPersistenceWarning(): void {
    const persistence = this.saveStore.persistence();
    (window as unknown as { __savePersistence?: object }).__savePersistence = persistence;
    if (persistence.kind === "saved" || (this.semantic && ["title", "menu", "settings", "how-to-play", "controls", "records"].includes(this.state.screen))) return;
    const message = persistence.kind === "memory-only"
      ? "SAVE UNAVAILABLE  •  PROGRESS LASTS UNTIL THIS WINDOW CLOSES"
      : "SAVE ERROR  •  PRESS P OR CLICK HERE TO RETRY";
    this.root.add(this.add.rectangle(WIDTH / 2, 14, WIDTH, 28, 0x4a211c, 0.98).setDepth(2000));
    this.root.add(this.text(WIDTH / 2, 14, message, ORANGE, "10px", true).setDepth(2001));
    if (persistence.kind === "failed") {
      this.root.add(this.add.zone(0, 0, WIDTH, 28).setOrigin(0, 0).setDepth(2002).setInteractive()
        .on("pointerdown", () => {
          this.saveStore.retryPersistence();
          this.render();
        }));
    }
  }

  private ensureScreenAssets(): boolean {
    const group = this.state.screen === "character-select" ? "shell-character" : null;
    const assets = group ? SHELL_CHARACTER_ASSETS : null;
    if (!assets || areGameAssetsLoaded(this, assets)) return true;
    if (this.characterLoadFailed) {
      this.renderLoadingPanel();
      return false;
    }
    if (this.loadingAssetGroup === group) {
      this.renderLoadingPanel();
      return false;
    }

    this.loadingAssetGroup = group;
    this.renderLoadingPanel();
    const queued = queueGameAssets(this, assets);
    if (queued === 0) {
      this.loadingAssetGroup = null;
      return true;
    }
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.loadingAssetGroup = null;
      this.characterLoadFailed = !areGameAssetsLoaded(this, assets);
      if (this.sys.isActive()) this.render();
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
    if (this.semantic) return;
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, 360, 94, PANEL)
      .setStrokeStyle(2, TEAL_HEX));
    this.root.add(this.text(WIDTH / 2, HEIGHT / 2 - 10, this.characterLoadFailed ? "CHARACTER ART UNAVAILABLE" : "PREPARING DOSSIERS", TEAL, "18px", true));
    this.root.add(this.text(WIDTH / 2, HEIGHT / 2 + 20, this.characterLoadFailed ? "ENTER / A: RETRY    ESC / B: BACK" : "LOADING CHARACTER ART...  ESC / B: BACK", MUTED, "10px", true));
    const back = this.text(WIDTH / 2 - 80, HEIGHT / 2 + 70, "BACK", TEAL, "16px", true).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.apply("back"));
    this.root.add(back);
    if (this.characterLoadFailed) {
      const retry = this.text(WIDTH / 2 + 80, HEIGHT / 2 + 70, "RETRY", TEAL, "16px", true).setInteractive({ useHandCursor: true });
      retry.on("pointerdown", () => this.apply("confirm"));
      this.root.add(retry);
    }

  }

  private renderTitle(): void {
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT - 54, WIDTH, 108, 0x0b121c, 0.76));
    this.root.add(this.text(WIDTH / 2, 170, "LAST BASTION", IVORY, "54px", true).setVisible(!this.semantic));
    this.root.add(this.text(WIDTH / 2, 225, "HOLD THE LINE", TEAL, "16px", true));
    const prompt = this.text(WIDTH / 2, 330, "PRESS ENTER", ORANGE, "22px", true);
    prompt.setName("title-prompt").setVisible(!this.semantic);
    const promptFrame = uiChromeEnabled()
      ? this.add.nineslice(
        prompt.x,
        prompt.y,
        "ui-button-selected-v1",
        undefined,
        Math.max(244, prompt.width + 64),
        72,
        UI_BUTTON_SLICE.left,
        UI_BUTTON_SLICE.right,
        UI_BUTTON_SLICE.top,
        UI_BUTTON_SLICE.bottom,
      )
      : this.panelBehind(prompt, 24);
    promptFrame.setName("title-prompt-frame");
    this.root.add(promptFrame);
    this.root.add(prompt);
    this.root.add(this.text(
      WIDTH / 2,
      HEIGHT - 28,
      "QUICK DROP  •  DAILY DROP  •  EXPEDITION  |  KEYBOARD & CONTROLLER",
      MUTED,
      "12px",
      true,
    ));
    if (!this.semantic) this.clickZone(0, 0, WIDTH, HEIGHT, () => this.apply("confirm"));
  }

  private renderMenu(): void {
    if (uiChromeEnabled()) this.root.add(this.uiHeaderPlate(220, 48, 330, 62));
    this.root.add(this.text(70, 48, "LAST BASTION", IVORY, "28px").setVisible(!this.semantic));
    const progress = this.saveStore.load().progress;
    const columns = MENU_COLUMNS;
    const cardWidth = 252, cardHeight = 72, originX = 90, originY = 100, gap = 12;
    this.state.menuCards.forEach((card, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = originX + column * (cardWidth + gap);
      const y = originY + row * (cardHeight + gap);
      const focused = index === this.state.menuIndex;
      const chromeFrame = uiChromeEnabled()
        ? this.uiButtonFrame(
          x + cardWidth / 2,
          y + cardHeight / 2,
          cardWidth,
          cardHeight,
          focused ? "selected" : "idle",
        )
        : null;
      this.root.add(chromeFrame ?? this.add.rectangle(
        x + cardWidth / 2,
        y + cardHeight / 2,
        cardWidth,
        cardHeight,
        focused ? 0x24384f : PANEL,
      ).setStrokeStyle(focused ? 3 : 1, focused ? TEAL_HEX : 0x3b4d63));
      if (focused && uiChromeEnabled()) {
        this.root.add(this.uiFocusBrackets(
          x + cardWidth / 2,
          y + cardHeight / 2,
          cardWidth + 12,
          cardHeight + 12,
        ));
      }
      this.root.add(this.text(x + 18, y + 16, card.label, focused ? TEAL : IVORY, "19px").setVisible(!this.semantic));
      const sub = menuCardSubtitle(card, progress, this.saveStore.persistence().kind === "saved", localDayKey(Date.now()));
      this.root.add(this.text(x + 18, y + 44, sub, card.id === "daily" ? TEAL : MUTED, "10px").setVisible(!this.semantic));
      if (!this.semantic) this.clickZone(x, y, cardWidth, cardHeight, () => {
        this.state = { ...this.state, menuIndex: index };
        this.apply("confirm");
      }, chromeFrame, focused ? "selected" : "idle");
    });
    if (uiChromeEnabled()) this.root.add(this.uiDivider(WIDTH / 2, HEIGHT - 52, 820));
    this.root.add(this.text(70, HEIGHT - 34, "ARROWS/WASD MOVE  •  ENTER CONFIRM  •  ESC BACK", MUTED, "12px"));
  }

  private renderHowToPlay(): void {
    const pages = howToPlayPages(this.state.controls);
    const page = pages[this.state.howToPlayPage]!;
    if (uiChromeEnabled()) this.root.add(this.uiHeaderPlate(220, 48, 330, 62));
    this.root.add(this.text(70, 35, "HOW TO PLAY", IVORY, "28px").setVisible(!this.semantic));
    this.root.add(this.add.rectangle(WIDTH / 2, 290, 740, 300, PANEL, 0.9));
    this.root.add(uiChromeEnabled()
      ? this.uiPanelFrame(WIDTH / 2, 290, 760, 320, "recessed")
      : this.add.rectangle(WIDTH / 2, 290, 760, 320, PANEL, 0).setStrokeStyle(1, 0x3b4d63));
    this.renderHowToPlayDiagram(this.state.howToPlayPage);
    this.root.add(this.text(WIDTH / 2, 330, page.title, TEAL, "20px", true).setVisible(!this.semantic));
    this.root.add(this.text(WIDTH / 2, 386, page.body, IVORY, "14px", true).setVisible(!this.semantic));
    this.root.add(this.text(
      WIDTH / 2,
      470,
      `PAGE ${this.state.howToPlayPage + 1}/${pages.length}  •  LEFT/RIGHT TO TURN  •  ESC BACK`,
      MUTED,
      "12px",
      true,
    ).setVisible(!this.semantic));
    if (!this.semantic) {
      this.clickZone(0, 0, WIDTH / 2, HEIGHT, () => this.apply("left"));
      this.clickZone(WIDTH / 2, 0, WIDTH / 2, HEIGHT, () => this.apply("right"));
    }
  }

  /** Vector teaching diagrams stay sharp at Full HD and 4K and carry no baked key labels. */
  private renderHowToPlayDiagram(page: number): void {
    const g = this.add.graphics();
    this.root.add(g);
    g.fillStyle(0x142334, 1).fillRoundedRect(290, 175, 380, 130, 8);
    g.lineStyle(1, 0x49657b, 1).strokeRoundedRect(290, 175, 380, 130, 8);
    const label = (x: number, y: number, value: string, color = MUTED): void => {
      this.root.add(this.text(x, y, value, color, "11px", true));
    };
    const node = (x: number, y: number, radius: number, color: number): void => {
      g.fillStyle(0x142334, 1).fillCircle(x, y, radius);
      g.lineStyle(3, color, 1).strokeCircle(x, y, radius);
    };
    if (page === 0) {
      g.lineStyle(3, TEAL_HEX, 1).lineBetween(354, 246, 445, 246);
      g.lineStyle(3, TEAL_HEX, 1).lineBetween(445, 246, 491, 214);
      g.fillStyle(0x51657a, 1).fillRoundedRect(455, 251, 58, 24, 3);
      node(354, 246, 15, TEAL_HEX);
      node(491, 214, 13, TEAL_HEX);
      g.fillStyle(0xff9a52, 1).fillTriangle(569, 238, 583, 255, 555, 255);
      label(354, 281, "MOVE", TEAL);
      label(491, 190, "EVADE", TEAL);
      label(485, 281, "COVER");
      label(569, 281, "THREAT", ORANGE);
    } else if (page === 1) {
      node(479, 239, 19, TEAL_HEX);
      for (const [x, y] of [[418, 206], [540, 206], [418, 271], [540, 271]] as const) {
        g.fillStyle(0x254051, 1).fillRoundedRect(x - 12, y - 12, 24, 24, 3);
        g.lineStyle(2, TEAL_HEX, 1).strokeRoundedRect(x - 12, y - 12, 24, 24, 3);
      }
      g.lineStyle(3, 0xff9a52, 1).lineBetween(501, 239, 608, 239);
      g.fillStyle(0xff9a52, 1).fillTriangle(616, 239, 604, 233, 604, 245);
      label(479, 186, "WEAPON RACK", TEAL);
      label(479, 287, "AUTO / MANUAL");
      label(608, 262, "TARGET", ORANGE);
    } else if (page === 2) {
      const statuses = [
        { x: 341, text: "FIRE", color: 0xff9a52 },
        { x: 431, text: "SHOCK", color: 0x68e4e8 },
        { x: 527, text: "CRYO", color: 0x9dc7ff },
        { x: 619, text: "TOXIC", color: 0x9ee388 },
      ];
      for (const status of statuses) {
        node(status.x, 218, 13, status.color);
        label(status.x, 246, status.text, `#${status.color.toString(16).padStart(6, "0")}`);
      }
      g.fillStyle(0x31465b, 1).fillRoundedRect(335, 268, 290, 7, 3);
      g.fillStyle(TEAL_HEX, 1).fillRoundedRect(335, 268, 218, 7, 3);
      g.lineStyle(2, 0xff9a52, 1).lineBetween(554, 260, 554, 282);
      label(479, 289, "BUILD STATUS TO THE THRESHOLD");
    } else {
      const points = [[333, 240], [411, 211], [411, 270], [492, 240], [571, 240], [638, 240]] as const;
      g.lineStyle(2, 0x58798d, 1);
      for (const [a, b] of [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]] as const) {
        g.lineBetween(points[a]![0], points[a]![1], points[b]![0], points[b]![1]);
      }
      points.forEach(([x, y], index) => node(x, y, index === 5 ? 15 : 11, index === 5 ? 0xff9a52 : TEAL_HEX));
      label(333, 274, "START", TEAL);
      label(411, 190, "CACHE");
      label(411, 289, "ELITE");
      label(638, 274, "BOSS", ORANGE);
    }
  }

  private renderSettings(): void {
    this.root.add(this.text(70, 48, "SETTINGS", IVORY, "28px").setVisible(!this.semantic));
    this.root.add(this.text(
      70,
      84,
      this.saveTransferFeedback ?? this.fullscreenFeedback ?? "Changes save automatically. Select a group to see its settings.",
      this.saveTransferFeedback || this.fullscreenFeedback ? ORANGE : MUTED,
      "12px",
    ).setVisible(!this.semantic));
    if (uiChromeEnabled()) this.root.add(this.uiDivider(WIDTH / 2, 448, 760));
    const group = settingsGroup(this.state.settingsRows[this.state.settingsIndex]!.key);
    SETTINGS_GROUPS.forEach((name, groupIndex) => {
      const x = 70 + groupIndex * 166;
      this.root.add(this.text(x, 112, name, name === group ? TEAL : IVORY, "12px").setVisible(!this.semantic));
      if (!this.semantic) this.clickZone(x - 4, 104, 160, 30, () => {
        const index = this.state.settingsRows.findIndex(row => settingsGroup(row.key) === name);
        if (index >= 0) { this.state = { ...this.state, settingsIndex: index }; this.render(); }
      });
    });
    const visibleRows = this.state.settingsRows.map((row, index) => ({ row, index }))
      .filter(({ row }) => settingsGroup(row.key) === group);
    const rowsPerColumn = Math.ceil(visibleRows.length / 2);
    visibleRows.forEach(({ row, index }, visibleIndex) => {
      const column = Math.floor(visibleIndex / rowsPerColumn);
      const rowIndex = visibleIndex % rowsPerColumn;
      const x = 70 + column * 420;
      const y = 158 + rowIndex * 38;
      const focused = index === this.state.settingsIndex;
      this.root.add(this.add.rectangle(x + 190, y + 11, 380, 26, focused ? 0x24384f : PANEL)
        .setStrokeStyle(focused ? 2 : 1, focused ? TEAL_HEX : 0x3b4d63));
      this.root.add(this.text(x + 12, y + 5, row.label, focused ? TEAL : IVORY, "10px").setVisible(!this.semantic));
      const actionRow = row.kind === "action";
      const enabled = actionRow || row.kind !== "toggle" || Boolean(this.state.settings[row.key]);
      const valueLabel = actionRow
        ? row.key === "controls" || row.key === "privacy" ? "OPEN >" : "RUN >"
        : row.kind === "toggle"
          ? enabled ? "ON" : "OFF"
          : formatSettingValue(row.key, this.state.settings[row.key]);
      this.root.add(this.text(x + 364, y + 5, valueLabel, enabled ? TEAL : ORANGE, "10px").setOrigin(1, 0).setVisible(!this.semantic));
      if (!this.semantic) this.clickZone(x, y - 2, 380, 27, () => {
        this.state = { ...this.state, settingsIndex: index };
        this.apply("confirm");
      });
    });
    this.root.add(this.text(70, HEIGHT - 22, "TAB BROWSE  •  NATIVE CONTROLS CHANGE  •  ESC BACK", MUTED, "11px"));
  }

  private exportSaveBackup(): void {
    const blob = new Blob([this.saveStore.exportSerialized()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `last-bastion-save-v${this.saveStore.load().version}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    this.saveTransferFeedback = "Save backup downloaded.";
  }

  private importSaveBackup(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      const serialized = await file.text();
      const validation = previewSaveImport(serialized);
      if (!validation.ok) {
        this.saveTransferFeedback = validation.error;
        this.render();
        return;
      }
      if (!window.confirm(`Replace this device's save?\n\n${validation.preview.summary}`)) {
        this.saveTransferFeedback = "Import cancelled; current save unchanged.";
        this.render();
        return;
      }
      this.saveStore.importSerialized(serialized);
      if (this.saveStore.persistence().kind !== "saved") {
        this.saveTransferFeedback = "Import loaded, but browser storage could not save it.";
        this.render();
        return;
      }
      window.location.href = "?screen=title";
    }, { once: true });
    input.click();
  }

  private renderControls(): void {
    this.root.add(this.text(70, 42, "CONTROL BINDINGS", IVORY, "27px").setVisible(!this.semantic));
    this.root.add(this.text(70, 76, "LEFT/RIGHT DEVICE  •  ENTER REBIND  •  DELETE RESET ALL  •  ESC CANCEL/BACK", MUTED, "11px").setVisible(!this.semantic));
    this.root.add(this.text(700, 42, this.state.controlDevice === "keyboard" ? "KEYBOARD" : "CONTROLLER", TEAL, "16px", true).setVisible(!this.semantic));
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
      if (this.semantic) return;
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
    if (this.bindingCapture && !this.semantic) {
      this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, 570, 120, 0x0b121c, 0.97).setStrokeStyle(3, TEAL_HEX));
      this.root.add(this.text(WIDTH / 2, HEIGHT / 2 - 18, `PRESS A ${this.bindingCapture.device === "keyboard" ? "KEY" : "CONTROLLER BUTTON"}`, IVORY, "20px", true));
      this.root.add(this.text(WIDTH / 2, HEIGHT / 2 + 22, "Duplicate assignments swap automatically  •  ESC cancels keyboard capture", MUTED, "10px", true));
    }
  }

  private commitKeyboardBinding(code: string): void {
    if (!this.bindingCapture || this.bindingCapture.device !== "keyboard") return;
    if (!isBindableKeyboardCode(code)) {
      this.bindingFeedback = "That key cannot be assigned. Press another key, or Escape to cancel.";
      this.render(); return;
    }
    const action = this.bindingCapture.action;
    const controls = rebindKeyboard(this.state.controls, this.bindingCapture.action as KeyboardBindableAction, code);
    this.saveStore.updateControlBindings(controls);
    this.state = { ...this.state, controls };
    this.bindingCapture = null;
    this.bindingFeedback = `${controlActionLabel(action)} bound to ${keyboardBindingLabel(code)}. Duplicate assignments swap automatically.`;
    this.focusSemanticSelection = true;
    this.render();
  }

  private commitGamepadBinding(button: GamepadButton): void {
    if (!this.bindingCapture || this.bindingCapture.device !== "gamepad") return;
    const action = this.bindingCapture.action;
    const controls = rebindGamepad(this.state.controls, action as GamepadBindableAction, button);
    this.saveStore.updateControlBindings(controls);
    this.state = { ...this.state, controls };
    this.bindingCapture = null;
    this.bindingFeedback = `${controlActionLabel(action)} bound to ${gamepadBindingLabel(button)}. Duplicate assignments swap automatically.`;
    this.focusSemanticSelection = true;
    this.render();
  }

  private cancelBindingCapture(): void {
    this.bindingCapture = null;
    this.bindingFeedback = "Rebinding cancelled. Bindings unchanged.";
    this.focusSemanticSelection = true;
    this.render();
  }

  private resetControlBindings(): void {
    if (this.bindingCapture) return;
    const controls = normalizeControlBindings(DEFAULT_CONTROL_BINDINGS);
    this.saveStore.updateControlBindings(controls);
    this.state = { ...this.state, controls };
    this.bindingFeedback = "All bindings reset to defaults.";
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
    this.root.add(this.text(70, 48, "RECORDS", IVORY, "28px").setVisible(!this.semantic));
    this.root.add(this.add.rectangle(250, 278, 360, 350, PANEL).setStrokeStyle(1, 0x3b4d63));
    this.root.add(this.add.rectangle(675, 278, 450, 350, PANEL).setStrokeStyle(1, 0x3b4d63));
    if (this.semantic) return;
    this.root.add(this.text(90, 92, "CAREER", TEAL, "13px"));
    const rows = careerRecordRows(progress);
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
      const record = historyRecordPresentation(entry);
      const y = 124 + index * 52;
      const resultColor = summary.outcome === "victory" ? TEAL : "#ff7d72";
      this.root.add(this.add.rectangle(675, y + 18, 410, 44, 0x172335).setStrokeStyle(1, 0x334860));
      this.root.add(this.text(484, y + 5, record.outcome, resultColor, "11px"));
      this.root.add(this.text(570, y + 5, record.progress, IVORY, "11px"));
      this.root.add(this.text(852, y + 5, record.date, MUTED, "9px", true));
      this.root.add(this.text(
        484,
        y + 24,
        record.detail,
        MUTED,
        "8px",
      ));
    });
    this.root.add(this.text(WIDTH / 2, 480, "UP/DOWN  SCROLL RUNS  •  ENTER / ESC  BACK", MUTED, "12px", true));
    this.clickZone(0, 450, WIDTH, 90, () => this.apply("back"));
  }

  private renderArmory(): void {
    const scoutReleased = ARMORY_NODES.some(({ id }) => id === "armory-scout-clearance");
    this.root.add(this.text(70, 42, "ARMORY", IVORY, "28px"));
    this.root.add(this.text(70, 78, `${COMMAND_MARKS_LABEL}  ${this.state.commandMarksBalance}`, TEAL, "16px"));
    const armoryHelp = this.text(
      scoutReleased ? 650 : 360,
      scoutReleased ? 52 : 80,
      "Permanent purchases • no refunds • selected kit applies to new runs",
      MUTED,
      scoutReleased ? "10px" : "11px",
    );
    if (scoutReleased) armoryHelp.setWordWrapWidth(250);
    this.root.add(armoryHelp);
    const { nodeWidth, positionById } = armoryLayout(ARMORY_NODES.map(({ id }) => id));
    for (const node of ARMORY_NODES) {
      const target = positionById.get(node.id)!;
      for (const prerequisiteId of node.prerequisiteIds) {
        const source = positionById.get(prerequisiteId);
        if (source) {
          this.root.add(this.add.line(0, 0, source.x, source.y + 59, target.x, target.y - 59, 0x68e4e8, 0.45).setOrigin(0));
        }
      }
    }
    ARMORY_NODES.forEach((node, index) => {
      const { x, y } = positionById.get(node.id)!;
      const focused = index === this.state.armoryIndex;
      const purchased = this.state.purchasedArmoryNodeIds.includes(node.id);
      const selected = this.state.selectedArmoryNodeId === node.id;
      const prerequisitesMet = node.prerequisiteIds.every((id) => this.state.purchasedArmoryNodeIds.includes(id));
      const affordable = this.state.commandMarksBalance >= node.cost;
      this.root.add(this.add.rectangle(x, y, nodeWidth, 118, focused ? 0x24384f : PANEL)
        .setStrokeStyle(focused ? 3 : 1, selected ? 0xffd36b : focused ? TEAL_HEX : 0x3b4d63));
      this.root.add(this.text(x, y - 40, node.name, purchased ? TEAL : focused ? IVORY : MUTED, "14px", true));
      this.root.add(this.text(x, y - 11, node.description, IVORY, "10px", true).setWordWrapWidth(nodeWidth - 40));
      const status = selected ? "SELECTED"
        : purchased ? node.kind === "hero-unlock" ? "CLEARANCE GRANTED" : "OWNED • ENTER TO EQUIP"
          : !prerequisitesMet ? `REQUIRES ${node.prerequisiteIds.map((id) => armoryNode(id).name).join(", ")}`
            : affordable ? `${node.cost} MARKS • ENTER TO PURCHASE` : `${node.cost} MARKS • NEED ${node.cost - this.state.commandMarksBalance}`;
      this.root.add(this.text(x, y + 37, status, selected || (affordable && prerequisitesMet) ? TEAL : ORANGE, "9px", true));
      this.clickZone(x - nodeWidth / 2, y - 59, nodeWidth, 118, () => {
        if (this.state.armoryIndex === index) this.apply("confirm");
        else {
          this.state = { ...this.state, armoryIndex: index };
          this.render();
        }
      });
    });
    this.root.add(this.text(70, HEIGHT - 26, "ARROWS SELECT • ENTER PURCHASE/EQUIP • ESC BACK", MUTED, "11px"));
  }

  private renderCharacterSelect(): void {
    this.root.add(this.text(70, 48, "CHARACTER SELECT", IVORY, "28px").setVisible(!this.semantic));
    this.root.add(this.text(890, 52, runModeLabel(this.state.runMode), TEAL, "14px").setOrigin(1, 0));
    const hero = ROSTER[this.state.rosterIndex]!;
    const perk = PERK_CATALOG[this.state.perkIndex]!;
    const perkUnlocked = this.state.unlockedPerkIds.includes(perk.id);
    const heroUnlocked = isHeroId(hero.id)
      && isHeroDeploymentUnlocked(hero.id, this.state.purchasedArmoryNodeIds);
    const perkLayout = perkGridLayout(PERK_CATALOG.length);

    // Left: full-height select portrait; gameplay sheets remain separate.
    this.root.add(this.add.rectangle(250, 250, 300, 320, PANEL).setStrokeStyle(1, 0x3b4d63));
    const c3Preview = requestedHeroC3Preview(hero.id);
    if (hero.status === "playable" || c3Preview) {
      const portraitKey = hero.id === "medic"
        ? "medic-select-portrait-v1"
        : hero.id === "assault"
          ? "assault-select-portrait-v1"
          : hero.id === "tactician"
            ? "tactician-select-portrait-v1"
            : hero.id === "scout" ? "scout-select-portrait-v1" : "marine-select-portrait-v1";
      this.root.add(this.add.image(250, 258, portraitKey).setDisplaySize(196, 294));
    } else {
      this.root.add(this.add.rectangle(250, 250, 120, 220, 0x232c3a)
        .setStrokeStyle(2, 0x3b4d63));
    }
    if (this.semantic) return; // Native selectors and dossier own the foreground.
    this.root.add(this.text(250, 415, hero.status === "playable" ? `${hero.name}${heroUnlocked ? "" : " — LOCKED"}`
      : hero.status === "in-development" ? `${hero.name} — IN DEVELOPMENT` : "????", IVORY, "16px", true));

    // Right: dossier.
    this.root.add(this.add.rectangle(660, perkLayout.panelCenterY, 440, perkLayout.panelHeight, PANEL)
      .setStrokeStyle(1, 0x3b4d63));
    if (isHeroId(hero.id)) {
      const definition = heroDefinition(hero.id);
      this.root.add(this.fittedDossier(
        heroDossierCopy(definition, heroUnlocked, true),
        heroDossierCopy(definition, heroUnlocked),
        perkLayout.headingY,
      ));
    } else {
      this.root.add(this.text(660, 240, "Signal lost.\nFuture hero slot.", MUTED, "14px", true));
    }

    this.root.add(this.text(470, perkLayout.headingY, `PERK  ${perkUnlocked ? perk.name.toUpperCase() : "LOCKED"}`, perkUnlocked ? TEAL : ORANGE, "14px"));
    this.root.add(this.text(470, perkLayout.descriptionY, perkUnlocked ? perk.description : perk.unlockText, perkUnlocked ? IVORY : MUTED, "11px")
      .setWordWrapWidth(390));
    PERK_CATALOG.forEach((entry, index) => {
      const { x, y } = perkTilePosition(index);
      const selected = index === this.state.perkIndex;
      const unlocked = this.state.unlockedPerkIds.includes(entry.id);
      // One atlas frame per perk, in catalogue order (Batch K added 7-9).
      this.root.add(this.add.sprite(x, y, "canonical-perk-tiles-v3", index)
        .setDisplaySize(38, 38)
        .setAlpha(unlocked ? 1 : 0.3)
        .setTint(selected ? 0xffffff : 0xb7c2cf));
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
      const entryUnlocked = isHeroId(entry.id)
        && isHeroDeploymentUnlocked(entry.id, this.state.purchasedArmoryNodeIds);
      this.root.add(this.add.rectangle(x, 470, 120, 44, focused ? 0x24384f : PANEL)
        .setStrokeStyle(focused ? 3 : 1, focused ? TEAL_HEX : 0x3b4d63));
      this.root.add(this.text(x, 462, entry.status === "silhouette" ? "????" : entry.name,
        focused ? TEAL : entry.status === "playable" && entryUnlocked ? IVORY : MUTED, "13px", true));
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
    this.root.add(uiChromeEnabled()
      ? this.add.image(850, 470, uiButtonAssetId(canDeploy ? "selected" : "disabled")).setDisplaySize(120, 44)
      : this.add.rectangle(850, 470, 120, 44, canDeploy ? 0x24384f : PANEL)
        .setStrokeStyle(2, canDeploy ? TEAL_HEX : 0x3b4d63));
    this.root.add(this.text(850, 470, "DEPLOY", canDeploy ? TEAL : MUTED, "13px", true));
    if (canDeploy) this.clickZone(790, 448, 120, 44, () => this.apply("confirm"));
    this.root.add(this.text(70, HEIGHT - 24, "LEFT/RIGHT HERO  •  UP/DOWN PERK  •  ENTER DEPLOY  •  ESC BACK", MUTED, "12px"));
  }

  private renderThreatSelect(): void {
    if (this.semantic) return;
    this.root.add(this.text(70, 48, "THREAT TIER", IVORY, "28px"));
    this.root.add(this.text(70, 84, "Modifiers stack. Clear a tier to unlock the next.", MUTED, "12px"));
    THREAT_TIERS.forEach((definition, index) => {
      const y = 150 + index * 105;
      const focused = index === this.state.threatTierIndex;
      const unlocked = this.state.unlockedThreatTiers.includes(definition.tier);
      const tierFrame = uiChromeEnabled()
        ? this.uiButtonFrame(WIDTH / 2, y, 760, 82, focused ? "selected" : unlocked ? "idle" : "disabled")
        : null;
      this.root.add(tierFrame ?? this.add.rectangle(WIDTH / 2, y, 760, 82, focused ? 0x24384f : PANEL)
        .setStrokeStyle(focused ? 3 : 1, focused ? (unlocked ? TEAL_HEX : 0xff9a52) : 0x3b4d63));
      if (focused && uiChromeEnabled()) this.root.add(this.uiFocusBrackets(WIDTH / 2, y, 772, 94));
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
    this.root.add(this.text(70, HEIGHT - 24, "ARROWS SELECT  •  ENTER DEPLOY  •  ESC BACK", MUTED, "12px"));
  }

  /**
   * The hero dossier, shrunk to clear the PERK heading below it.
   *
   * Found by the 5.4 overflow audit rather than by looking: at a fixed 12px
   * wrapped to 390px, four of the five heroes ran past the heading — the locked
   * Tactician by 51px. Locked heroes are exactly what a new player reads, since
   * only the Marine starts unlocked, so this was the common case, not an edge one.
   *
   * The bottom bound is the perk layout own headingY rather than a constant, so
   * the two cannot drift apart — which is how the overflow arrived.
   */
  private fittedDossier(spacedContent: string, compactContent: string, headingY: number): Phaser.GameObjects.Text {
    const style = { fontFamily: "Consolas, monospace", align: "left" };
    const fitFor = (content: string) => fitText({
      content,
      maxWidth: DOSSIER_WRAP_WIDTH + DOSSIER_PADDING * 2,
      maxHeight: (headingY - DOSSIER_HEADING_GAP) - DOSSIER_TOP + DOSSIER_PADDING * 2,
      sizesPx: DOSSIER_SIZES,
      padding: DOSSIER_PADDING,
    }, phaserTextMeasure(this, style));
    // Prefer separated fields; a long locked-hero dossier keeps the compact form.
    const spaced = fitFor(spacedContent);
    const content = spaced.overflowed ? compactContent : spacedContent;
    const fit = spaced.overflowed ? fitFor(compactContent) : spaced;
    return this.add.text(DOSSIER_LEFT, DOSSIER_TOP, content, {
      ...style,
      color: IVORY,
      fontSize: fit.fontSizePx + "px",
      wordWrap: { width: fit.wrapWidth },
    }).setResolution(uiTextResolution());
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
    }).setResolution(uiTextResolution());
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

  private uiButtonFrame(
    x: number,
    y: number,
    width: number,
    height: number,
    state: UiButtonState,
  ): Phaser.GameObjects.NineSlice {
    return this.add.nineslice(
      x,
      y,
      uiButtonAssetId(state),
      undefined,
      width,
      height,
      UI_BUTTON_SLICE.left,
      UI_BUTTON_SLICE.right,
      UI_BUTTON_SLICE.top,
      UI_BUTTON_SLICE.bottom,
    );
  }

  private uiPanelFrame(
    x: number,
    y: number,
    width: number,
    height: number,
    weight: UiPanelWeight = "raised",
  ): Phaser.GameObjects.NineSlice {
    return this.add.nineslice(
      x,
      y,
      `ui-panel-${weight}-v1`,
      undefined,
      width,
      height,
      UI_PANEL_SLICE.left,
      UI_PANEL_SLICE.right,
      UI_PANEL_SLICE.top,
      UI_PANEL_SLICE.bottom,
    );
  }

  private uiFocusBrackets(x: number, y: number, width: number, height: number): Phaser.GameObjects.NineSlice {
    return this.add.nineslice(
      x,
      y,
      "ui-focus-brackets-v1",
      undefined,
      width,
      height,
      UI_FOCUS_SLICE.left,
      UI_FOCUS_SLICE.right,
      UI_FOCUS_SLICE.top,
      UI_FOCUS_SLICE.bottom,
    );
  }

  private uiHeaderPlate(x: number, y: number, width: number, height: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, "ui-header-plate-v1").setDisplaySize(width, height).setAlpha(0.9);
  }

  private uiDivider(x: number, y: number, width: number): Phaser.GameObjects.Image {
    return this.add.image(x, y, "ui-divider-rule-v1").setDisplaySize(width, 16).setAlpha(0.72);
  }

  private clickZone(
    x: number,
    y: number,
    width: number,
    height: number,
    onClick: () => void,
    chromeFrame: Phaser.GameObjects.NineSlice | null = null,
    restingState: UiButtonState = "idle",
  ): void {
    const zone = this.add.zone(x, y, width, height).setOrigin(0, 0).setInteractive();
    if (chromeFrame) {
      zone.on("pointerover", () => chromeFrame.setTexture(uiButtonAssetId(
        restingState === "selected" ? "selected" : "hover",
      )));
      zone.on("pointerout", () => chromeFrame.setTexture(uiButtonAssetId(restingState)));
      zone.on("pointerdown", () => {
        chromeFrame.setTexture(uiButtonAssetId("pressed"));
        onClick();
      });
      zone.on("pointerupoutside", () => chromeFrame.setTexture(uiButtonAssetId(restingState)));
    } else {
      zone.on("pointerdown", onClick);
    }
    this.root.add(zone);
  }
}

function requestedInitialScreen() {
  if (typeof window === "undefined") return "title";
  return requestedShellScreen(window.location.search);
}

/** LAB is a review tool: reachable by URL for QA, never listed for players. */
function requestedLabAccess(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("debug") === "1" || params.get("lab") === "1";
}

/** `?flow=character-select&mode=quick-drop` lets the debrief return to the same mode. */
function requestedRunMode(): ShellRunMode | undefined {
  if (typeof window === "undefined") return undefined;
  const mode = new URLSearchParams(window.location.search).get("mode");
  return isShellRunMode(mode) ? mode : undefined;
}

function runModeLabel(mode: ShellRunMode): string {
  if (mode === "daily") return `DAILY DROP  •  ${dailyLabel(localDayKey(Date.now()))}`;
  return mode === "quick-drop" ? "QUICK DROP  •  10 WAVES" : "EXPEDITION  •  20 NODES";
}


function requestedHeroC3Preview(heroId: string): boolean {
  return typeof window !== "undefined"
    && new URLSearchParams(window.location.search).get("c3") === heroId;
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
