import Phaser from "phaser";
import { LocalSaveStore } from "../save/LocalSaveStore";
import { ARENA_THEMES } from "../rendering/arenaThemes";
import {
  expeditionNodeById,
  type ExpeditionNode,
  type ExpeditionNodeType,
} from "../expedition/ExpeditionMap";
import {
  isExpeditionComplete,
  moveToNode,
  nodePresentation,
  resumeExpeditionRun,
  selectableNodeIds,
  startExpeditionRun,
  type ExpeditionRun,
} from "../expedition/ExpeditionRun";

const WIDTH = 960;
const HEIGHT = 540;
const NAVY = 0x151e2b;
const PANEL = 0x1d2938;
const IVORY = "#e8e2d4";
const TEAL = "#68e4e8";
const TEAL_HEX = 0x68e4e8;
const ORANGE = "#ff9a52";
const MUTED = "#8fa1b3";
const MAP_LEFT = 90;
const MAP_RIGHT = WIDTH - 90;
const LANE_TOP = 130;
const LANE_GAP = 110;

const NODE_GLYPHS: Readonly<Record<ExpeditionNodeType, string>> = Object.freeze({
  combat: "✕",
  elite: "◆",
  "mini-boss": "⬢",
  "supply-depot": "+",
  "weapon-cache": "▣",
  boss: "☠",
});

const NODE_LABELS: Readonly<Record<ExpeditionNodeType, string>> = Object.freeze({
  combat: "COMBAT",
  elite: "ELITE — guaranteed cache",
  "mini-boss": "MINI-BOSS — arsenal reward",
  "supply-depot": "SUPPLY DEPOT — safe",
  "weapon-cache": "WEAPON CACHE — safe",
  boss: "THE BASTION EATER",
});

/**
 * Task 38 behavior gate: the 20-node starchart screen with code-native
 * medallions and route lines. Traversal advances the dropship and autosaves
 * schema-v2 state on every arrival; node → encounter wiring is Task 39, so
 * selecting a node currently scouts it directly. Batch G2 replaces the
 * medallion dressing later without touching the run rules.
 */
export class ExpeditionScene extends Phaser.Scene {
  private saveStore!: LocalSaveStore;
  private run!: ExpeditionRun;
  private root!: Phaser.GameObjects.Container;
  private focusIndex = 0;
  private travelling = false;
  private pulseTime = 0;

  constructor() {
    super("expedition");
  }

  create(): void {
    this.saveStore = new LocalSaveStore(
      typeof window !== "undefined" ? window.localStorage : null,
    );
    this.run = this.restoreOrStartRun();
    this.root = this.add.container(0, 0);
    window.addEventListener("keydown", this.handleKey);
    this.events.once("shutdown", () => window.removeEventListener("keydown", this.handleKey));
    this.render();
  }

  override update(_time: number, delta: number): void {
    this.pulseTime += delta;
    const token = this.root.getByName("current-pulse") as Phaser.GameObjects.Arc | null;
    token?.setScale(1 + Math.sin(this.pulseTime / 260) * 0.12);
  }

  /** `?mapseed=N` reviews a deterministic fresh chart; otherwise resume or roll. */
  private restoreOrStartRun(): ExpeditionRun {
    const requested = Number(new URLSearchParams(window.location.search).get("mapseed"));
    if (Number.isFinite(requested) && requested > 0) {
      return startExpeditionRun(Math.floor(requested));
    }
    const saved = this.saveStore.load().expedition;
    if (saved) {
      const resumed = resumeExpeditionRun({
        mapSeed: saved.mapSeed,
        currentNodeId: saved.currentNodeId,
        clearedNodeIds: saved.clearedNodeIds,
        build: saved.build,
      });
      if (resumed) {
        return resumed;
      }
      this.saveStore.clearExpedition();
    }
    return startExpeditionRun((Date.now() % 100000) + 1);
  }

  private readonly handleKey = (event: KeyboardEvent): void => {
    if (this.travelling) {
      return;
    }
    switch (event.code) {
      case "ArrowUp": case "KeyW": case "ArrowLeft": case "KeyA":
        event.preventDefault();
        this.moveFocus(-1);
        break;
      case "ArrowDown": case "KeyS": case "ArrowRight": case "KeyD":
        event.preventDefault();
        this.moveFocus(1);
        break;
      case "Enter": case "Space": case "NumpadEnter":
        event.preventDefault();
        this.travelToFocused();
        break;
      case "Escape":
        event.preventDefault();
        window.location.href = "?screen=title";
        break;
    }
  };

  private moveFocus(step: number): void {
    const selectable = selectableNodeIds(this.run);
    if (selectable.length === 0) {
      return;
    }
    this.focusIndex = (this.focusIndex + step + selectable.length) % selectable.length;
    this.render();
  }

  private travelToFocused(): void {
    const selectable = selectableNodeIds(this.run);
    const targetId = selectable[this.focusIndex];
    if (targetId === undefined) {
      return;
    }
    this.travelTo(targetId);
  }

  private travelTo(targetId: number): void {
    const next = moveToNode(this.run, targetId);
    if (!next || this.travelling) {
      return;
    }
    // State advances and autosaves immediately — the dropship flight is pure
    // decoration, so a hidden tab (paused render loop) can never wedge a run.
    const from = this.nodePosition(expeditionNodeById(this.run.map, this.run.state.currentNodeId)!);
    const to = this.nodePosition(expeditionNodeById(this.run.map, targetId)!);
    this.run = next;
    this.focusIndex = 0;
    this.autosave();
    this.render();

    this.travelling = true;
    const token = this.add.triangle(from.x, from.y, 0, -9, 8, 7, -8, 7, 0xffd36b)
      .setDepth(50)
      .setRotation(Math.atan2(to.y - from.y, to.x - from.x) + Math.PI / 2);
    this.tweens.add({ targets: token, x: to.x, y: to.y, duration: 420 });
    // Wall-clock unlock: tweens pause with the render loop, input must not.
    window.setTimeout(() => {
      if (token.active) {
        token.destroy();
      }
      this.travelling = false;
    }, 450);
  }

  /** Autosave on every arrival back at the map, per the persistence design. */
  private autosave(): void {
    if (isExpeditionComplete(this.run)) {
      this.saveStore.clearExpedition();
      return;
    }
    this.saveStore.saveExpedition({
      mapSeed: this.run.state.mapSeed,
      currentNodeId: this.run.state.currentNodeId,
      clearedNodeIds: [...this.run.state.clearedNodeIds],
      build: this.run.state.build === null ? null : {
        ...this.run.state.build,
        weapons: this.run.state.build.weapons.map((weapon) => ({ ...weapon })),
        upgrades: this.run.state.build.upgrades.map((upgrade) => ({ ...upgrade })),
      },
    });
  }

  private nodePosition(node: ExpeditionNode): { x: number; y: number } {
    const x = MAP_LEFT + (node.column / (this.run.map.columns - 1)) * (MAP_RIGHT - MAP_LEFT);
    return { x, y: LANE_TOP + node.lane * LANE_GAP };
  }

  private render(): void {
    (window as unknown as { __expeditionState?: object }).__expeditionState = {
      currentNodeId: this.run.state.currentNodeId,
      cleared: this.run.state.clearedNodeIds.length,
      selectable: selectableNodeIds(this.run),
      complete: isExpeditionComplete(this.run),
      seed: this.run.state.mapSeed,
    };
    this.root.removeAll(true);
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, NAVY));
    this.root.add(this.text(70, 32, "EXPEDITION MAP", IVORY, "24px"));
    this.root.add(this.text(WIDTH - 70, 38, `SEED ${this.run.state.mapSeed}`, MUTED, "12px").setOrigin(1, 0));

    this.renderEdges();
    this.renderNodes();
    this.renderIntelCard();

    if (isExpeditionComplete(this.run)) {
      this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, 560, 130, PANEL).setStrokeStyle(2, TEAL_HEX).setDepth(60));
      this.root.add(this.text(WIDTH / 2, HEIGHT / 2 - 22, "EXPEDITION COMPLETE", TEAL, "24px", true).setDepth(61));
      this.root.add(this.text(WIDTH / 2, HEIGHT / 2 + 18, "The Bastion Eater's node is cleared. ESC returns to the title.", IVORY, "13px", true).setDepth(61));
    } else {
      this.root.add(this.text(
        70,
        HEIGHT - 30,
        "ARROWS CYCLE ROUTES  •  ENTER TRAVEL (scout mode until encounters wire in)  •  ESC TITLE",
        MUTED,
        "12px",
      ));
    }
  }

  private renderEdges(): void {
    const lines = this.add.graphics().setDepth(1);
    for (const node of this.run.map.nodes) {
      const from = this.nodePosition(node);
      for (const nextId of node.next) {
        const target = expeditionNodeById(this.run.map, nextId)!;
        const to = this.nodePosition(target);
        const activeEdge = node.id === this.run.state.currentNodeId
          && selectableNodeIds(this.run).includes(nextId);
        lines.lineStyle(activeEdge ? 3 : 1.5, activeEdge ? TEAL_HEX : 0x33475e, activeEdge ? 0.95 : 0.7);
        lines.lineBetween(from.x, from.y, to.x, to.y);
      }
    }
    this.root.add(lines);
  }

  private renderNodes(): void {
    const selectable = selectableNodeIds(this.run);
    const focusedId = selectable[this.focusIndex];
    for (const node of this.run.map.nodes) {
      const { x, y } = this.nodePosition(node);
      const presentation = nodePresentation(this.run, node.id);
      const focused = node.id === focusedId;
      const fill = presentation === "current" ? 0x24506b
        : presentation === "reachable" ? 0x24384f
          : presentation === "cleared" ? 0x1a222e
            : presentation === "open" ? PANEL : 0x181f29;
      const stroke = presentation === "current" || focused ? TEAL_HEX
        : presentation === "reachable" ? 0x4f8ca3
          : presentation === "cleared" ? 0x2c3947 : 0x33475e;
      const radius = node.type === "boss" ? 26 : node.type === "mini-boss" || node.type === "elite" ? 21 : 18;
      const medallion = this.add.circle(x, y, radius, fill)
        .setStrokeStyle(focused ? 3 : 2, stroke)
        .setDepth(10)
        .setAlpha(presentation === "unreachable" ? 0.35 : presentation === "cleared" ? 0.55 : 1);
      this.root.add(medallion);
      const glyphColor = presentation === "current" || presentation === "reachable" || focused
        ? (node.type === "boss" ? ORANGE : TEAL)
        : MUTED;
      this.root.add(this.text(x, y - 1, NODE_GLYPHS[node.type], glyphColor, "16px", true)
        .setDepth(11)
        .setAlpha(presentation === "unreachable" ? 0.4 : 1));
      if (presentation === "cleared") {
        this.root.add(this.text(x + radius - 4, y - radius + 2, "✓", TEAL, "11px", true).setDepth(12).setAlpha(0.8));
      }
      if (presentation === "current") {
        const pulse = this.add.circle(x, y, radius + 7).setStrokeStyle(2, TEAL_HEX, 0.85).setDepth(9);
        pulse.setName("current-pulse");
        this.root.add(pulse);
      }
      if (presentation === "reachable") {
        const zone = this.add.zone(x - radius, y - radius, radius * 2, radius * 2).setOrigin(0, 0).setInteractive();
        zone.on("pointerdown", () => this.travelTo(node.id));
        this.root.add(zone);
      }
    }
  }

  private renderIntelCard(): void {
    const selectable = selectableNodeIds(this.run);
    const focusedId = selectable[this.focusIndex];
    if (focusedId === undefined) {
      return;
    }
    const node = expeditionNodeById(this.run.map, focusedId)!;
    const theme = ARENA_THEMES.find((candidate) => candidate.id === node.themeId);
    const threat = node.type === "boss" ? "EXTREME"
      : node.type === "mini-boss" ? "SEVERE"
        : node.type === "elite" ? "HIGH"
          : node.type === "combat" ? (node.column >= 5 ? "ELEVATED" : "MODERATE") : "NONE";
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT - 78, 620, 58, PANEL).setStrokeStyle(1, 0x3b4d63).setDepth(20));
    this.root.add(this.text(WIDTH / 2, HEIGHT - 90, NODE_LABELS[node.type], TEAL, "15px", true).setDepth(21));
    this.root.add(this.text(
      WIDTH / 2,
      HEIGHT - 68,
      `${theme?.name ?? "Unknown region"}  •  THREAT ${threat}  •  COLUMN ${node.column + 1}/${this.run.map.columns}`,
      MUTED,
      "12px",
      true,
    ).setDepth(21));
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
}
