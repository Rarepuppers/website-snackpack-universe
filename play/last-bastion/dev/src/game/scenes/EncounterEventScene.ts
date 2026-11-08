import { eventOutcomeSummary } from "../expedition/EventOutcomeSummary";
import { renderEventResultPanel } from "../ui/EventResultPanel";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import Phaser from "phaser";
import { uiTextResolution } from "../rendering/DisplayScaling";
import type { ExpeditionBuildSnapshot } from "../expedition/ExpeditionRun";
import {
  ENCOUNTER_EVENT_CATALOG,
  applyEventResolutionToBuild,
  isChoiceAvailable,
  eventChoiceUnavailableReason,
  resolveEventChoice,
  type EncounterEventDefinition,
  type EventChoice,
  type EventResolution,
} from "../expedition/EncounterEventCatalog";

const WIDTH = 960;
const HEIGHT = 540;
const NAVY = 0x111a26;
const PANEL = 0x1d2938;
const PANEL_SELECTED = 0x263a4a;
const PANEL_LOCKED = 0x161f2a;
const IVORY = "#e8e2d4";
const TEAL = "#68e4e8";
const ORANGE = "#ff9a52";
const GREEN = "#8fd66a";
const MUTED = "#8fa1b3";

/** Demo hero used by the lab; the run supplies the real snapshot in production. */
const DEMO_MAX_HEALTH = 18;
function demoBuild(): ExpeditionBuildSnapshot {
  return {
    health: 14,
    shield: 0,
    level: 6,
    experience: 120,
    scrap: 100,
    weapons: [
      { weaponId: "bastion-service-rifle", tier: 1 },
      { weaponId: "scattergun", tier: 2 },
    ],
    upgrades: [],
  };
}

/**
 * Deterministic review route (`?screen=event-lab`) for the Shrine/Event
 * catalogue (Task 94), mirroring the transformation decision lab: it renders
 * every card, gates choices against an in-memory demo build, and resolves the
 * chosen option so the decision surface, requirement gating, and both
 * deterministic and gamble outcomes can be judged with keyboard, controller,
 * and pointer. It applies the same build resolution in memory without writing
 * a save or entering combat.
 */
export class EncounterEventScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private eventIndex = 0;
  private choiceIndex = 0;
  private build = demoBuild();
  private rollTick = 0;
  private outcome: { choice: EventChoice; resolution: EventResolution } | null = null;
  private outcomePage = 0;
  private resultPanel: ReturnType<typeof renderEventResultPanel> | null = null;

  constructor() {
    super("encounter-event");
  }

  create(): void {
    this.root = this.add.container(0, 0);
    window.addEventListener("keydown", this.handleKeyDown);
    this.events.once("shutdown", () => window.removeEventListener("keydown", this.handleKeyDown));
    this.input.gamepad?.on("down", (_pad: unknown, button: { index: number }) => this.handlePadDown(button.index));
    this.render();
  }

  private get event(): EncounterEventDefinition {
    return ENCOUNTER_EVENT_CATALOG[this.eventIndex]!;
  }

  private get maxHealth(): number {
    return DEMO_MAX_HEALTH + (this.build.maxHealthBonus ?? 0);
  }

  private get roll(): number {
    // A stable pseudo-roll the player can step with R to expose gamble variance.
    const hashed = Math.sin((this.rollTick + 1) * 12.9898) * 43758.5453;
    return hashed - Math.floor(hashed);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "Enter", "Escape", "KeyR"].includes(event.code)) {
      event.preventDefault();
    }
    if (this.outcome) {
      if (event.code === "KeyR") this.reroll();
      else if (event.code === "ArrowLeft") this.changeOutcomePage(-1);
      else if (event.code === "ArrowRight") this.changeOutcomePage(1);
      else if (event.code === "Enter" || event.code === "Space") this.dismissOutcome();
      return;
    }
    if (event.code === "ArrowLeft") this.moveEvent(-1);
    else if (event.code === "ArrowRight") this.moveEvent(1);
    else if (event.code === "ArrowUp") this.moveChoice(-1);
    else if (event.code === "ArrowDown") this.moveChoice(1);
    else if (event.code === "Enter" || event.code === "Space") this.resolveSelected();
    else if (event.code === "KeyR") this.reroll();
    else if (event.code === "Escape") window.location.href = "?screen=title";
  };

  private handlePadDown(index: number): void {
    if (this.outcome) {
      if (index === 2) this.reroll();
      else if (index === 14) this.changeOutcomePage(-1);
      else if (index === 15) this.changeOutcomePage(1);
      else if (index === 0) this.dismissOutcome();
      return;
    }
    if (index === 14) this.moveEvent(-1);
    else if (index === 15) this.moveEvent(1);
    else if (index === 12) this.moveChoice(-1);
    else if (index === 13) this.moveChoice(1);
    else if (index === 0) this.resolveSelected();
    else if (index === 2) this.reroll();
    else if (index === 1) window.location.href = "?screen=title";
  }

  private moveEvent(delta: number): void {
    this.eventIndex = (this.eventIndex + delta + ENCOUNTER_EVENT_CATALOG.length) % ENCOUNTER_EVENT_CATALOG.length;
    this.choiceIndex = 0;
    this.build = demoBuild();
    this.render();
  }

  private moveChoice(delta: number): void {
    const count = this.event.choices.length;
    this.choiceIndex = (this.choiceIndex + delta + count) % count;
    this.render();
  }

  private reroll(): void {
    this.rollTick += 1;
    if (this.outcome) {
      this.resolveChoice(this.outcome.choice);
    } else {
      this.render();
    }
  }

  private resolveSelected(): void {
    const choice = this.event.choices[this.choiceIndex];
    if (!choice || !isChoiceAvailable(this.build, this.maxHealth, choice)) {
      return;
    }
    this.resolveChoice(choice);
  }

  private resolveChoice(choice: EventChoice): void {
    const resolution = resolveEventChoice(this.build, this.maxHealth, choice, this.roll);
    this.outcomePage = 0;
    this.outcome = { choice, resolution };
    this.render();
  }

  private dismissOutcome(): void {
    // Apply the resolved build so repeated choices reflect prior effects, the
    // way a real run would carry the snapshot forward.
    if (this.outcome) {
      this.build = applyEventResolutionToBuild(this.outcome.resolution);
    }
    this.outcome = null;
    this.render();
  }

  private render(): void {
    this.root.removeAll(true);
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, NAVY));
    this.root.add(this.text(38, 22, "ENCOUNTER EVENT LAB", IVORY, "22px"));
    this.root.add(this.text(38, 52, "IN-MEMORY REVIEW  •  NO SAVE WRITES  •  ← → CARD  ↑ ↓ CHOICE  ENTER SELECT  R REROLL", MUTED, "11px"));

    const event = this.event;
    const kindColor = event.kind === "shrine" ? ORANGE : TEAL;
    this.root.add(this.text(38, 84, `${event.kind.toUpperCase()}  ${this.eventIndex + 1}/${ENCOUNTER_EVENT_CATALOG.length}`, kindColor, "11px"));
    this.root.add(this.text(38, 104, event.name.toUpperCase(), kindColor, "20px"));
    this.root.add(this.text(38, 134, event.text, IVORY, "12px", false, false, 620));

    this.renderBuild();
    this.renderChoices();

    this.root.add(this.text(38, HEIGHT - 26, "ESC / B  EXIT", MUTED, "11px"));
    this.resultPanel = null;
    if (this.outcome) this.renderOutcome();
    this.publishState();
  }

  private renderBuild(): void {
    const b = this.build;
    const weapons = b.weapons.map((w) => `${WEAPON_CATALOG[w.weaponId as WeaponId]?.displayName ?? "Unknown weapon"} T${w.tier}`).join(", ") || "—";
    this.root.add(this.add.rectangle(660, 84, 262, 118, PANEL).setOrigin(0, 0).setStrokeStyle(1, 0x3b4d63));
    this.root.add(this.text(672, 92, "DEMO BUILD", MUTED, "10px"));
    this.root.add(this.text(672, 110, `HEALTH  ${b.health} / ${this.maxHealth}`, IVORY, "12px"));
    this.root.add(this.text(672, 128, `SHIELD  ${b.shield}`, IVORY, "12px"));
    this.root.add(this.text(672, 146, `SCRAP   ${b.scrap}`, IVORY, "12px"));
    this.root.add(this.text(672, 164, `LEVEL   ${b.level}  (XP ${b.experience})`, IVORY, "12px"));
    this.root.add(this.text(672, 182, weapons, TEAL, "10px", false, false, 240));
  }

  private renderChoices(): void {
    this.event.choices.forEach((choice, index) => {
      const y = 226 + index * 68;
      const unavailableReason = eventChoiceUnavailableReason(this.build, this.maxHealth, choice);
      const available = unavailableReason === null;
      const selected = index === this.choiceIndex;
      const fill = !available ? PANEL_LOCKED : selected ? PANEL_SELECTED : PANEL;
      const card = this.add.rectangle(38, y, 884, 58, fill)
        .setOrigin(0, 0)
        .setStrokeStyle(selected ? 2 : 1, selected ? 0x68e4e8 : 0x3b4d63)
        .setInteractive()
        .on("pointerdown", () => {
          this.choiceIndex = index;
          if (available) this.resolveChoice(choice);
          else this.render();
        });
      this.root.add(card);
      const titleColor = !available ? MUTED : selected ? IVORY : "#c4ccd6";
      this.root.add(this.text(52, y + 8, choice.label.toUpperCase(), titleColor, "13px"));
      const detail = unavailableReason ?? choice.detail ?? (choice.randomOutcomes ? "Uncertain outcome" : "");
      if (detail) this.root.add(this.text(52, y + 30, detail, !available || choice.randomOutcomes ? ORANGE : GREEN, "10px"));
      if (!available) {
        this.root.add(this.text(910, y + 8, "LOCKED", ORANGE, "10px", false, true));
      } else if (choice.randomOutcomes) {
        this.root.add(this.text(910, y + 8, "GAMBLE", ORANGE, "10px", false, true));
      }
    });
  }

  private renderOutcome(): void {
    const { resolution } = this.outcome!;
    this.resultPanel = renderEventResultPanel(this, this.root, resolution.resultText,
      eventOutcomeSummary(this.build, resolution), this.outcomePage,
      () => this.dismissOutcome(), delta => this.changeOutcomePage(delta));
  }

  private changeOutcomePage(delta: number): void {
    if (!this.outcome || !this.resultPanel) return;
    this.outcomePage = Math.max(0, Math.min(this.resultPanel.pageCount - 1, this.outcomePage + delta));
    this.render();
  }

  private publishState(): void {
    (window as unknown as { __encounterEventLab?: object }).__encounterEventLab = {
      eventId: this.event.id,
      kind: this.event.kind,
      choiceId: this.event.choices[this.choiceIndex]?.id,
      outcomeShown: this.outcome !== null,
      build: this.build,
      result: this.resultPanel,
      outcome: this.outcome
        ? { resultText: this.outcome.resolution.resultText, effects: this.outcome.resolution.effects }
        : null,
    };
  }

  private text(
    x: number,
    y: number,
    value: string,
    color: string,
    fontSize: string,
    centred = false,
    right = false,
    wordWrapWidth?: number,
  ): Phaser.GameObjects.Text {
    const text = this.add.text(x, y, value, {
      color,
      fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
      fontSize,
      lineSpacing: 5,
      ...(wordWrapWidth ? { wordWrap: { width: wordWrapWidth } } : {}),
    }).setResolution(uiTextResolution());
    if (centred) text.setOrigin(0.5, 0);
    else if (right) text.setOrigin(1, 0);
    return text;
  }
}
