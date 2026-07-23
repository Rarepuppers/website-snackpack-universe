import Phaser from "phaser";
import { LocalSaveStore } from "../save/LocalSaveStore";
import { cloneTransformationAffinityState } from "../transformations/TransformationAffinity";
import { MARINE } from "../hero/marine";
import { MEDIC } from "../hero/medic";
import { heroGrowthAtLevel } from "../hero/LevelGrowth";
import { PLAYER_MAX_HEALTH } from "../combat/CombatSimulation";
import {
  completeCurrentNode,
  resumeExpeditionRun,
  type ExpeditionBuildSnapshot,
  type ExpeditionRun,
} from "../expedition/ExpeditionRun";
import { expeditionNodeById, type ExpeditionNode } from "../expedition/ExpeditionMap";
import {
  ambushEncounterForNode,
  expeditionEncounterForNode,
  expeditionEncounterUrl,
} from "../expedition/ExpeditionEncounter";
import {
  applyEventResolutionToBuild,
  encounterEventById,
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

/**
 * In-run Shrine/Event resolution screen (Task 94, step 3). Reached from the
 * expedition map when the dropship arrives at a shrine or event node. Unlike
 * the `?screen=event-lab` review route, this reads the real run build, commits
 * the resolved reward carrier through the v9 save, and routes `ambush`
 * outcomes into a real one-wave combat that clears the node on victory.
 */
export class ExpeditionEventScene extends Phaser.Scene {
  private saveStore!: LocalSaveStore;
  private run!: ExpeditionRun;
  private node!: ExpeditionNode;
  private event!: EncounterEventDefinition;
  private build!: ExpeditionBuildSnapshot;
  private maxHealth = PLAYER_MAX_HEALTH;
  private roll = 0;
  private root!: Phaser.GameObjects.Container;
  private choiceIndex = 0;
  private outcome: { choice: EventChoice; resolution: EventResolution } | null = null;

  constructor() {
    super("expedition-event");
  }

  create(): void {
    this.saveStore = new LocalSaveStore(typeof window !== "undefined" ? window.localStorage : null);
    if (!this.loadContext()) {
      window.location.href = "?screen=map";
      return;
    }
    this.root = this.add.container(0, 0);
    window.addEventListener("keydown", this.handleKeyDown);
    this.events.once("shutdown", () => window.removeEventListener("keydown", this.handleKeyDown));
    this.input.gamepad?.on("down", (_pad: unknown, button: { index: number }) => this.handlePadDown(button.index));
    this.render();
  }

  /** Resolves the run, current node, event card, build, and gamble roll. Returns false to bounce to the map. */
  private loadContext(): boolean {
    const saved = this.saveStore.load().expedition;
    if (!saved) return false;
    const resumed = resumeExpeditionRun({
      mapSeed: saved.mapSeed,
      currentNodeId: saved.currentNodeId,
      clearedNodeIds: saved.clearedNodeIds,
      build: saved.build,
      metrics: saved.metrics,
    });
    if (!resumed) return false;
    const node = expeditionNodeById(resumed.map, resumed.state.currentNodeId);
    if (!node || (node.type !== "shrine" && node.type !== "event")) return false;
    if (resumed.state.clearedNodeIds.includes(node.id)) return false;
    const encounter = expeditionEncounterForNode(resumed.state.mapSeed, node);
    const event = encounter.eventId ? encounterEventById(encounter.eventId) : null;
    if (!event) return false;

    this.run = resumed;
    this.node = node;
    this.event = event;
    this.build = resumed.state.build ?? this.baselineBuild();
    const hero = this.saveStore.load().selectedHeroId === "medic" ? MEDIC : MARINE;
    this.maxHealth = Math.max(
      3,
      PLAYER_MAX_HEALTH + heroGrowthAtLevel(hero, Math.max(1, this.build.level)).maxHealthBonus + (this.build.maxHealthBonus ?? 0),
    );
    // Deterministic gamble roll from the encounter seed — reproducible per seed.
    this.roll = ((encounter.seed >>> 0) % 100_000) / 100_000;
    return true;
  }

  private baselineBuild(): ExpeditionBuildSnapshot {
    return { health: PLAYER_MAX_HEALTH, shield: 0, level: 1, experience: 0, scrap: 0, weapons: [], upgrades: [] };
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (["ArrowUp", "ArrowDown", "Enter", "Space", "Escape"].includes(event.code)) event.preventDefault();
    if (this.outcome) {
      this.commitOutcome();
      return;
    }
    if (event.code === "ArrowUp") this.moveChoice(-1);
    else if (event.code === "ArrowDown") this.moveChoice(1);
    else if (event.code === "Enter" || event.code === "Space") this.resolveSelected();
  };

  private handlePadDown(index: number): void {
    if (this.outcome) { this.commitOutcome(); return; }
    if (index === 12) this.moveChoice(-1);
    else if (index === 13) this.moveChoice(1);
    else if (index === 0) this.resolveSelected();
  }

  private moveChoice(delta: number): void {
    const count = this.event.choices.length;
    this.choiceIndex = (this.choiceIndex + delta + count) % count;
    this.render();
  }

  private resolveSelected(): void {
    const choice = this.event.choices[this.choiceIndex];
    if (!choice || !isChoiceAvailable(this.build, this.maxHealth, choice)) return;
    this.outcome = { choice, resolution: resolveEventChoice(this.build, this.maxHealth, choice, this.roll) };
    this.render();
  }

  /** Applies the resolved outcome: ambush → combat, otherwise commit the node and return to the map. */
  private commitOutcome(): void {
    if (!this.outcome) return;
    const { resolution } = this.outcome;
    const nextBuild = applyEventResolutionToBuild(resolution);

    if (resolution.effects.ambush) {
      // Keep the node pending; persist the build so combat resumes with it, then
      // fight the ambush. Victory commits the node through the normal combat path.
      this.persistRun(this.run, nextBuild);
      const encounter = ambushEncounterForNode(this.run.state.mapSeed, this.node, resolution.effects.ambush.threatBudget);
      window.location.href = `${expeditionEncounterUrl(encounter)}&ambush=${resolution.effects.ambush.threatBudget}`;
      return;
    }

    const completed = completeCurrentNode(this.run, nextBuild);
    this.saveStore.recordNodeCleared();
    this.persistRun(completed, completed.state.build);
    window.location.href = "?screen=map";
  }

  private persistRun(run: ExpeditionRun, build: ExpeditionBuildSnapshot | null): void {
    this.saveStore.saveExpedition({
      mapSeed: run.state.mapSeed,
      currentNodeId: run.state.currentNodeId,
      clearedNodeIds: [...run.state.clearedNodeIds],
      build: build === null ? null : {
        ...build,
        weapons: build.weapons.map((weapon) => ({ ...weapon })),
        upgrades: build.upgrades.map((upgrade) => ({ ...upgrade })),
        transformation: cloneTransformationAffinityState(build.transformation),
        ...(build.relicIds ? { relicIds: [...build.relicIds] } : {}),
      },
      metrics: run.state.metrics,
    });
  }

  private render(): void {
    this.root.removeAll(true);
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, NAVY));
    const kindColor = this.event.kind === "shrine" ? ORANGE : TEAL;
    this.root.add(this.text(48, 40, this.event.kind.toUpperCase(), kindColor, "12px"));
    this.root.add(this.text(48, 62, this.event.name.toUpperCase(), kindColor, "24px"));
    this.root.add(this.text(48, 100, this.event.text, IVORY, "13px", false, false, 640));

    // Compact build readout.
    this.root.add(this.text(WIDTH - 48, 44, `HEALTH ${Math.round(this.build.health)}/${this.maxHealth}   SCRAP ${this.build.scrap}`, MUTED, "12px").setOrigin(1, 0));

    this.event.choices.forEach((choice, index) => {
      const y = 200 + index * 74;
      const available = isChoiceAvailable(this.build, this.maxHealth, choice);
      const selected = index === this.choiceIndex;
      const fill = !available ? PANEL_LOCKED : selected ? PANEL_SELECTED : PANEL;
      const card = this.add.rectangle(48, y, WIDTH - 96, 62, fill).setOrigin(0, 0)
        .setStrokeStyle(selected ? 2 : 1, selected ? 0x68e4e8 : 0x3b4d63)
        .setInteractive()
        .on("pointerdown", () => { this.choiceIndex = index; if (available) this.resolveSelected(); else this.render(); });
      this.root.add(card);
      this.root.add(this.text(64, y + 10, choice.label.toUpperCase(), !available ? MUTED : selected ? IVORY : "#c4ccd6", "14px"));
      const detail = choice.detail ?? (choice.randomOutcomes ? "Uncertain outcome" : "");
      if (detail) this.root.add(this.text(64, y + 34, detail, choice.randomOutcomes ? ORANGE : GREEN, "11px"));
      if (!available) this.root.add(this.text(WIDTH - 64, y + 10, "LOCKED", ORANGE, "11px").setOrigin(1, 0));
    });

    this.root.add(this.text(48, HEIGHT - 30, "↑ ↓ CHOICE   ENTER SELECT", MUTED, "12px"));
    this.publishState();
    if (this.outcome) this.renderOutcome();
  }

  private renderOutcome(): void {
    const { resolution } = this.outcome!;
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x05090e, 0.82));
    this.root.add(this.add.rectangle(190, 170, 580, 200, PANEL).setOrigin(0, 0).setStrokeStyle(3, 0x68e4e8));
    this.root.add(this.text(WIDTH / 2, 190, "RESULT", TEAL, "18px", true));
    this.root.add(this.text(214, 226, resolution.resultText || "You move on.", IVORY, "13px", false, false, 530));
    const line = resolution.effects.ambush
      ? "You are ambushed — into combat!"
      : summarizeEffects(this.build, resolution);
    this.root.add(this.text(214, 300, line, resolution.effects.ambush ? ORANGE : GREEN, "12px", false, false, 530));
    this.root.add(this.text(WIDTH / 2, 344, "ANY KEY / A  CONTINUE", MUTED, "11px", true));
  }

  private publishState(): void {
    (window as unknown as { __expeditionEvent?: object }).__expeditionEvent = {
      nodeId: this.node.id,
      eventId: this.event.id,
      choiceId: this.event.choices[this.choiceIndex]?.id,
      outcomeShown: this.outcome !== null,
      ambush: this.outcome?.resolution.effects.ambush ?? null,
    };
  }

  private text(x: number, y: number, value: string, color: string, size: string, centred = false, right = false, wrap?: number): Phaser.GameObjects.Text {
    const t = this.add.text(x, y, value, {
      color, fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", fontSize: size, lineSpacing: 5,
      ...(wrap ? { wordWrap: { width: wrap } } : {}),
    });
    if (centred) t.setOrigin(0.5, 0);
    else if (right) t.setOrigin(1, 0);
    return t;
  }
}

/** One-line before/after summary for the outcome panel (non-ambush). */
function summarizeEffects(before: ExpeditionBuildSnapshot, resolution: EventResolution): string {
  const after = resolution.build;
  const effects = resolution.effects;
  const parts: string[] = [];
  if (after.health !== before.health) parts.push(`HP ${Math.round(before.health)}→${Math.round(after.health)}`);
  if (after.shield !== before.shield) parts.push(`+${after.shield - before.shield} shield`);
  if (after.scrap !== before.scrap) parts.push(`scrap ${before.scrap}→${after.scrap}`);
  if (after.experience !== before.experience) parts.push(`+${after.experience - before.experience} XP`);
  if (effects.maxHealthDelta !== 0) parts.push(`max HP ${effects.maxHealthDelta > 0 ? "+" : ""}${effects.maxHealthDelta}`);
  if (effects.weaponSlotsGranted > 0) parts.push(`+${effects.weaponSlotsGranted} slot`);
  for (const relic of effects.relicIds) parts.push(`relic: ${relic.replace("rel-", "")}`);
  for (const artifact of effects.artifactIds) parts.push(`artifact: ${artifact.replace("art-", "")}`);
  if (effects.guaranteedEliteRelicNextNode) parts.push("next node: +elite +relic");
  if (effects.duplicateUpgradeWithPenalty) parts.push("duplicate upgrade");
  return parts.length > 0 ? parts.join("   ") : "You move on.";
}
