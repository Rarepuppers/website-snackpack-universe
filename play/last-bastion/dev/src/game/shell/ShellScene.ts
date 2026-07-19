import Phaser from "phaser";
import { LocalSaveStore, type GameProgress } from "../save/LocalSaveStore";
import { MARINE } from "../hero/marine";
import {
  createShellState,
  HOW_TO_PLAY_PAGES,
  LAB_ROUTES,
  MENU_CARDS,
  ROSTER,
  SETTINGS_ROWS,
  stepShell,
  type ShellIntent,
  type ShellState,
} from "./ScreenFlow";

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

  constructor() {
    super("shell");
  }

  create(): void {
    this.saveStore = new LocalSaveStore(
      typeof window !== "undefined" ? window.localStorage : null,
    );
    this.state = createShellState(this.saveStore.load().settings);
    this.root = this.add.container(0, 0);

    // One direct window listener instead of the Phaser keyboard plugin: the
    // plugin can deliver capture-list keys (Enter, Space, arrows) a second
    // time from its frame queue, which double-steps menu navigation.
    window.addEventListener("keydown", this.handleKey);
    this.events.once("shutdown", () => window.removeEventListener("keydown", this.handleKey));
    this.input.gamepad?.on("down", (_pad: unknown, button: { index: number }) => {
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
    const intent = keyToIntent(event.code);
    if (intent) {
      event.preventDefault();
      this.apply(intent);
    }
  };

  private apply(intent: ShellIntent): void {
    const result = stepShell(this.state, intent);
    this.state = result.state;
    for (const effect of result.effects) {
      if (effect.type === "set-setting") {
        this.saveStore.updateSettings({ [effect.key]: effect.value });
      } else if (effect.type === "start-run") {
        // Deploy via the direct-run route: each mode boots its own scene set,
        // and the future expedition map will carry run state through the save
        // store, so a reload-based transition stays correct.
        window.location.href = "?screen=game";
        return;
      } else if (effect.type === "open-url") {
        window.location.href = effect.url;
        return;
      }
    }
    this.render();
  }

  private render(): void {
    // Review hook: the harness and browser checks read the flow state directly.
    (window as unknown as { __shellState?: ShellState }).__shellState = this.state;
    this.root.removeAll(true);
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, NAVY));
    switch (this.state.screen) {
      case "title": this.renderTitle(); break;
      case "menu": this.renderMenu(); break;
      case "how-to-play": this.renderHowToPlay(); break;
      case "settings": this.renderSettings(); break;
      case "lab": this.renderLab(); break;
      case "character-select": this.renderCharacterSelect(); break;
    }
  }

  private renderTitle(): void {
    // Placeholder backdrop: ridge silhouette and searchlight bands.
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT - 90, WIDTH, 180, 0x0e141d));
    this.root.add(this.add.rectangle(240, HEIGHT - 200, 260, 12, 0x223349));
    this.root.add(this.add.rectangle(700, HEIGHT - 230, 340, 12, 0x223349));
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
    const cardWidth = 380, cardHeight = 96, originX = 90, originY = 110, gap = 26;
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
        : card.id === "records" ? recordsLine(progress)
          : card.id === "codex" ? "The encyclopedia — discoveries fill the Monsterdex"
            : card.id === "lab" ? "Review scenarios and art galleries"
              : card.id === "settings" ? "Persisted immediately to local save"
                : "Four short pages";
      this.root.add(this.text(x + 22, y + 54, sub, MUTED, "12px"));
      this.clickZone(x, y, cardWidth, cardHeight, () => {
        this.state = { ...this.state, menuIndex: index };
        this.apply("confirm");
      });
    });
    this.root.add(this.text(70, HEIGHT - 34, "ARROWS/WASD MOVE  •  ENTER CONFIRM  •  ESC BACK", MUTED, "12px"));
  }

  private renderHowToPlay(): void {
    const page = HOW_TO_PLAY_PAGES[this.state.howToPlayPage]!;
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
      `PAGE ${this.state.howToPlayPage + 1}/${HOW_TO_PLAY_PAGES.length}  •  LEFT/RIGHT TO TURN  •  ESC BACK`,
      MUTED,
      "12px",
      true,
    ));
    this.clickZone(0, 0, WIDTH / 2, HEIGHT, () => this.apply("left"));
    this.clickZone(WIDTH / 2, 0, WIDTH / 2, HEIGHT, () => this.apply("right"));
  }

  private renderSettings(): void {
    this.root.add(this.text(70, 48, "SETTINGS", IVORY, "28px"));
    this.root.add(this.text(70, 84, "Changes persist immediately. URL parameters remain as review overrides.", MUTED, "12px"));
    SETTINGS_ROWS.forEach((row, index) => {
      const y = 140 + index * 64;
      const focused = index === this.state.settingsIndex;
      this.root.add(this.add.rectangle(WIDTH / 2, y + 22, 640, 52, focused ? 0x24384f : PANEL)
        .setStrokeStyle(focused ? 3 : 1, focused ? TEAL_HEX : 0x3b4d63));
      this.root.add(this.text(190, y + 8, row.label, focused ? TEAL : IVORY, "17px"));
      const enabled = this.state.settings[row.key];
      this.root.add(this.text(690, y + 8, enabled ? "ON" : "OFF", enabled ? TEAL : ORANGE, "17px"));
      this.clickZone(160, y - 4, 640, 52, () => {
        this.state = { ...this.state, settingsIndex: index };
        this.apply("confirm");
      });
    });
    this.root.add(this.text(70, HEIGHT - 34, "UP/DOWN SELECT  •  ENTER/LEFT/RIGHT TOGGLE  •  ESC BACK", MUTED, "12px"));
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

  private renderCharacterSelect(): void {
    this.root.add(this.text(70, 48, "CHARACTER SELECT", IVORY, "28px"));
    const hero = ROSTER[this.state.rosterIndex]!;

    // Left: oversized hero placeholder.
    this.root.add(this.add.rectangle(250, 250, 300, 300, PANEL).setStrokeStyle(1, 0x3b4d63));
    this.root.add(this.add.rectangle(250, 250, 120, 220,
      hero.status === "playable" ? 0x3d5a75 : 0x232c3a)
      .setStrokeStyle(2, hero.status === "playable" ? TEAL_HEX : 0x3b4d63));
    this.root.add(this.text(250, 415, hero.status === "playable" ? hero.name
      : hero.status === "in-development" ? `${hero.name} — IN DEVELOPMENT` : "????", IVORY, "16px", true));

    // Right: dossier.
    this.root.add(this.add.rectangle(660, 250, 440, 300, PANEL).setStrokeStyle(1, 0x3b4d63));
    if (hero.status === "playable") {
      const dossier = [
        "ROLE  Durable all-round ranged fighter",
        "",
        `PASSIVE  ${MARINE.passive.name}`,
        MARINE.passive.description,
        "",
        `ULTIMATE  ${MARINE.ultimate.name}`,
        MARINE.ultimate.description,
        "",
        "STARTING WEAPON  Bastion Service Rifle",
        "PER LEVEL  +1 ALL STATS  •  +1 LIGHT PROFICIENCY",
      ].join("\n");
      this.root.add(this.text(470, 130, dossier, IVORY, "13px"));
    } else {
      this.root.add(this.text(660, 240, hero.status === "in-development"
        ? "Dossier sealed.\nThe Medic deploys with the Web MVP."
        : "Signal lost.\nFuture hero slot.", MUTED, "14px", true));
    }

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
    this.root.add(this.text(70, HEIGHT - 24, "LEFT/RIGHT SELECT  •  ENTER DEPLOY  •  ESC BACK", MUTED, "12px"));
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
  return `Runs ${progress.runsFinished}  •  Victories ${progress.victories}  •  Best wave ${progress.bestWaveReached}`;
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
