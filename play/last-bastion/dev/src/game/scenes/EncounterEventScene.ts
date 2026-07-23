import Phaser from "phaser";
import type { ExpeditionBuildSnapshot } from "../expedition/ExpeditionRun";
import {
  ENCOUNTER_EVENT_CATALOG,
  isChoiceAvailable,
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
      { weaponId: "wpn-service-rifle", tier: 1 },
      { weaponId: "wpn-scattergun", tier: 2 },
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
 * and pointer. It never writes a save and never touches combat — granting the
 * real relic/slot/max-health effects waits for those live systems.
 */
export class EncounterEventScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private eventIndex = 0;
  private choiceIndex = 0;
  private build = demoBuild();
  private rollTick = 0;
  private outcome: { choice: EventChoice; resolution: EventResolution } | null = null;

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

  private get roll(): number {
    // A stable pseudo-roll the player can step with R to expose gamble variance.
    const hashed = Math.sin((this.rollTick + 1) * 12.9898) * 43758.5453;
    return hashed - Math.floor(hashed);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "Enter", "Escape", "KeyR"].includes(event.code)) {
      event.preventDefault();
    }
    if (this.outcome) {
      if (event.code === "KeyR") this.reroll();
      else this.dismissOutcome();
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
      else this.dismissOutcome();
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
    if (!choice || !isChoiceAvailable(this.build, DEMO_MAX_HEALTH, choice)) {
      return;
    }
    this.resolveChoice(choice);
  }

  private resolveChoice(choice: EventChoice): void {
    const resolution = resolveEventChoice(this.build, DEMO_MAX_HEALTH, choice, this.roll);
    this.outcome = { choice, resolution };
    this.render();
  }

  private dismissOutcome(): void {
    // Apply the resolved build so repeated choices reflect prior effects, the
    // way a real run would carry the snapshot forward.
    if (this.outcome) {
      this.build = this.outcome.resolution.build;
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
    this.publishState();

    if (this.outcome) this.renderOutcome();
  }

  private renderBuild(): void {
    const b = this.build;
    const weapons = b.weapons.map((w) => `${w.weaponId.replace("wpn-", "")} T${w.tier}`).join(", ") || "—";
    this.root.add(this.add.rectangle(660, 84, 262, 118, PANEL).setOrigin(0, 0).setStrokeStyle(1, 0x3b4d63));
    this.root.add(this.text(672, 92, "DEMO BUILD", MUTED, "10px"));
    this.root.add(this.text(672, 110, `HEALTH  ${b.health} / ${DEMO_MAX_HEALTH}`, IVORY, "12px"));
    this.root.add(this.text(672, 128, `SHIELD  ${b.shield}`, IVORY, "12px"));
    this.root.add(this.text(672, 146, `SCRAP   ${b.scrap}`, IVORY, "12px"));
    this.root.add(this.text(672, 164, `LEVEL   ${b.level}  (XP ${b.experience})`, IVORY, "12px"));
    this.root.add(this.text(672, 182, weapons, TEAL, "10px", false, false, 240));
  }

  private renderChoices(): void {
    this.event.choices.forEach((choice, index) => {
      const y = 226 + index * 68;
      const available = isChoiceAvailable(this.build, DEMO_MAX_HEALTH, choice);
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
      const detail = choice.detail ?? (choice.randomOutcomes ? "Uncertain outcome" : "");
      if (detail) this.root.add(this.text(52, y + 30, detail, choice.randomOutcomes ? ORANGE : GREEN, "10px"));
      if (!available) {
        this.root.add(this.text(910, y + 8, requirementReason(choice), ORANGE, "10px", false, true));
      } else if (choice.randomOutcomes) {
        this.root.add(this.text(910, y + 8, "GAMBLE", ORANGE, "10px", false, true));
      }
    });
  }

  private renderOutcome(): void {
    const { resolution } = this.outcome!;
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x05090e, 0.8));
    this.root.add(this.add.rectangle(170, 150, 620, 240, PANEL).setOrigin(0, 0).setStrokeStyle(3, 0x68e4e8));
    this.root.add(this.text(WIDTH / 2, 172, "RESULT", TEAL, "18px", true));
    this.root.add(this.text(200, 208, resolution.resultText || "You move on.", IVORY, "13px", false, false, 560));

    const deltas = describeDeltas(this.build, resolution);
    deltas.slice(0, 6).forEach((line, index) => {
      this.root.add(this.text(200, 262 + index * 20, line.text, line.color, "12px"));
    });

    this.root.add(this.text(WIDTH / 2, 366, "ANY KEY / A  CONTINUE      R  REROLL", MUTED, "10px", true));
  }

  private publishState(): void {
    (window as unknown as { __encounterEventLab?: object }).__encounterEventLab = {
      eventId: this.event.id,
      kind: this.event.kind,
      choiceId: this.event.choices[this.choiceIndex]?.id,
      outcomeShown: this.outcome !== null,
      build: this.build,
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
    });
    if (centred) text.setOrigin(0.5, 0);
    else if (right) text.setOrigin(1, 0);
    return text;
  }
}

/** A short reason a gated choice is unavailable, derived from its requirement. */
function requirementReason(choice: EventChoice): string {
  const requirement = choice.requirement;
  if (!requirement) return "";
  if (requirement.minScrap !== undefined) return `NEEDS ${requirement.minScrap} SCRAP`;
  if (requirement.minHealth !== undefined) return `NEEDS ${requirement.minHealth} HP`;
  if (requirement.minMaxHealthAfterCost !== undefined) return "MAX HP TOO LOW";
  if (requirement.minWeapons !== undefined) return "NEEDS A WEAPON";
  return "LOCKED";
}

/** Human-readable before/after summary of a resolution for the outcome panel. */
function describeDeltas(before: ExpeditionBuildSnapshot, resolution: EventResolution): { text: string; color: string }[] {
  const after = resolution.build;
  const effects = resolution.effects;
  const lines: { text: string; color: string }[] = [];
  const gain = (n: number) => (n >= 0 ? GREEN : ORANGE);
  if (after.health !== before.health) lines.push({ text: `HEALTH  ${before.health} → ${after.health}`, color: gain(after.health - before.health) });
  if (after.shield !== before.shield) lines.push({ text: `SHIELD  +${after.shield - before.shield}`, color: GREEN });
  if (after.scrap !== before.scrap) lines.push({ text: `SCRAP   ${before.scrap} → ${after.scrap}`, color: gain(after.scrap - before.scrap) });
  if (after.experience !== before.experience) lines.push({ text: `XP      +${after.experience - before.experience}`, color: GREEN });
  before.weapons.forEach((w, i) => {
    const now = after.weapons[i];
    if (now && now.tier !== w.tier) lines.push({ text: `${w.weaponId.replace("wpn-", "")}  T${w.tier} → T${now.tier}`, color: GREEN });
  });
  if (after.weapons.length < before.weapons.length) lines.push({ text: "LOST A WEAPON", color: ORANGE });
  if (effects.maxHealthDelta !== 0) lines.push({ text: `MAX HEALTH  ${effects.maxHealthDelta > 0 ? "+" : ""}${effects.maxHealthDelta}`, color: gain(effects.maxHealthDelta) });
  if (effects.weaponSlotsGranted > 0) lines.push({ text: `+${effects.weaponSlotsGranted} WEAPON SLOT`, color: GREEN });
  for (const relic of effects.relicIds) lines.push({ text: `RELIC  ${relic.replace("rel-", "")}`, color: TEAL });
  for (const artifact of effects.artifactIds) lines.push({ text: `ARTIFACT  ${artifact.replace("art-", "")}`, color: TEAL });
  if (effects.upgradeRerolls > 0) lines.push({ text: `+${effects.upgradeRerolls} UPGRADE REROLL`, color: GREEN });
  if (effects.guaranteedEliteRelicNextNode) lines.push({ text: "NEXT NODE: +ELITE, +RELIC", color: ORANGE });
  if (effects.duplicateUpgradeWithPenalty) lines.push({ text: "DUPLICATE UPGRADE (cooldown penalty)", color: ORANGE });
  if (effects.ambush) lines.push({ text: `AMBUSH!  threat ${effects.ambush.threatBudget}`, color: ORANGE });
  if (lines.length === 0) lines.push({ text: "No change.", color: MUTED });
  return lines;
}
