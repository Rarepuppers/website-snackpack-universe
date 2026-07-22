import Phaser from "phaser";
import { normalizeTransformationAffinityState, transformationProgress, transformationStage } from "../transformations/TransformationAffinity";
import { TRANSFORMATION_CHOICE_CATALOG, transformationChoicesForPath } from "../transformations/TransformationChoiceCatalog";
import {
  advanceTransformationDecision,
  beginTransformationChoice,
  beginTransformationPurge,
  cancelTransformationDecision,
  createTransformationDecisionState,
  selectedChoiceRank,
  type TransformationDecisionState,
} from "../transformations/TransformationDecision";
import { TRANSFORMATION_PATH_CATALOG, type TransformationPathId } from "../transformations/TransformationPathCatalog";

const WIDTH = 960;
const HEIGHT = 540;
const NAVY = 0x111a26;
const PANEL = 0x1d2938;
const PANEL_SELECTED = 0x263a4a;
const IVORY = "#e8e2d4";
const TEAL = "#68e4e8";
const ORANGE = "#ff9a52";
const MUTED = "#8fa1b3";

/**
 * Mechanics-only review route. It operates on an in-memory demo snapshot and
 * deliberately never writes saves or resolves any transformation stat effect.
 */
export class TransformationDecisionScene extends Phaser.Scene {
  private root!: Phaser.GameObjects.Container;
  private state!: TransformationDecisionState;
  private pathIndex = 2;
  private choiceIndex = 0;
  private confirmHeld = false;
  private holdBar!: Phaser.GameObjects.Rectangle;

  constructor() {
    super("transformation-decision");
  }

  create(): void {
    this.state = createTransformationDecisionState(normalizeTransformationAffinityState({
      paths: [
        { pathId: "mutagenic-evolution", choiceIds: ["dense-tissue"] },
        { pathId: "cybernetic-ascension", choiceIds: ["targeting-suite", "shield-lattice"] },
      ],
    }));
    this.root = this.add.container(0, 0);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.events.once("shutdown", () => {
      window.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener("keyup", this.handleKeyUp);
    });
    this.input.gamepad?.on("down", (_pad: unknown, button: { index: number }) => this.handlePadDown(button.index));
    this.input.gamepad?.on("up", (_pad: unknown, button: { index: number }) => {
      if (button.index === 0) this.confirmHeld = false;
    });
    this.render();
  }

  override update(_time: number, delta: number): void {
    if (!this.state.pending) return;
    const previousPending = this.state.pending;
    this.state = advanceTransformationDecision(this.state, this.confirmHeld, delta);
    if (this.state.pending !== previousPending && !this.state.pending) {
      this.confirmHeld = false;
      this.render();
      return;
    }
    const pending = this.state.pending;
    if (pending && this.holdBar) {
      this.holdBar.setScale(Math.max(0.001, pending.holdElapsedMs / pending.holdRequiredMs), 1);
    }
    this.publishState();
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "Enter", "Escape", "KeyP"].includes(event.code)) {
      event.preventDefault();
    }
    if (this.state.pending) {
      if (event.code === "Escape") this.cancelPending();
      else if (event.code === "Enter" || event.code === "Space") this.confirmHeld = true;
      return;
    }
    if (event.code === "ArrowLeft") this.movePath(-1);
    else if (event.code === "ArrowRight") this.movePath(1);
    else if (event.code === "ArrowUp") this.moveChoice(-1);
    else if (event.code === "ArrowDown") this.moveChoice(1);
    else if (event.code === "KeyP") this.beginPurge();
    else if (event.code === "Enter" || event.code === "Space") this.beginChoice();
    else if (event.code === "Escape") window.location.href = "?screen=title";
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (event.code === "Enter" || event.code === "Space") this.confirmHeld = false;
  };

  private handlePadDown(index: number): void {
    if (this.state.pending) {
      if (index === 0) this.confirmHeld = true;
      else if (index === 1) this.cancelPending();
      return;
    }
    if (index === 14) this.movePath(-1);
    else if (index === 15) this.movePath(1);
    else if (index === 12) this.moveChoice(-1);
    else if (index === 13) this.moveChoice(1);
    else if (index === 0) this.beginChoice();
    else if (index === 3) this.beginPurge();
    else if (index === 1) window.location.href = "?screen=title";
  }

  private movePath(delta: number): void {
    this.pathIndex = (this.pathIndex + delta + TRANSFORMATION_PATH_CATALOG.length) % TRANSFORMATION_PATH_CATALOG.length;
    this.choiceIndex = 0;
    this.render();
  }

  private moveChoice(delta: number): void {
    this.choiceIndex = (this.choiceIndex + delta + 3) % 3;
    this.render();
  }

  private beginChoice(): void {
    const path = TRANSFORMATION_PATH_CATALOG[this.pathIndex]!;
    const choice = transformationChoicesForPath(path.id)[this.choiceIndex]!;
    const result = beginTransformationChoice(this.state, path.id, choice.id);
    this.state = result.state;
    this.render();
  }

  private beginPurge(): void {
    const path = TRANSFORMATION_PATH_CATALOG[this.pathIndex]!;
    const result = beginTransformationPurge(this.state, path.id);
    this.state = result.state;
    this.render();
  }

  private cancelPending(): void {
    this.confirmHeld = false;
    this.state = cancelTransformationDecision(this.state);
    this.render();
  }

  private render(): void {
    this.root.removeAll(true);
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, NAVY));
    this.root.add(this.text(38, 24, "TRANSFORMATION DECISION LAB", IVORY, "24px"));
    this.root.add(this.text(38, 58, "IN-MEMORY REVIEW  •  NO STATS APPLIED  •  NO SAVE WRITES", MUTED, "11px"));

    TRANSFORMATION_PATH_CATALOG.forEach((path, index) => {
      const x = 38 + index * 148;
      const selected = index === this.pathIndex;
      const progress = transformationProgress(this.state.affinity, path.id);
      const committed = this.state.affinity.committedPathId === path.id;
      const panel = this.add.rectangle(x, 88, 136, 58, selected ? PANEL_SELECTED : PANEL)
        .setOrigin(0, 0).setStrokeStyle(selected ? 2 : 1, selected ? 0x68e4e8 : 0x3b4d63)
        .setInteractive().on("pointerdown", () => { if (!this.state.pending) { this.pathIndex = index; this.choiceIndex = 0; this.render(); } });
      this.root.add(panel);
      this.root.add(this.text(x + 8, 98, path.name.toUpperCase(), selected ? TEAL : IVORY, "9px"));
      this.root.add(this.text(x + 8, 121, `${committed ? "LOCKED" : transformationStage(progress?.affinity ?? 0).toUpperCase()}  ${progress?.affinity ?? 0}/7`, committed ? ORANGE : MUTED, "9px"));
    });

    const path = TRANSFORMATION_PATH_CATALOG[this.pathIndex]!;
    const progress = transformationProgress(this.state.affinity, path.id);
    this.root.add(this.text(38, 168, path.name.toUpperCase(), TEAL, "18px"));
    this.root.add(this.text(38, 195, path.identity, MUTED, "11px"));
    this.root.add(this.text(38, 216, `SITE: ${path.siteFamily.toUpperCase()}`, MUTED, "10px"));

    const choices = transformationChoicesForPath(path.id);
    choices.forEach((choice, index) => {
      const y = 250 + index * 74;
      const selected = index === this.choiceIndex;
      const rank = selectedChoiceRank(this.state, path.id, choice.id);
      const card = this.add.rectangle(38, y, 884, 64, selected ? PANEL_SELECTED : PANEL)
        .setOrigin(0, 0).setStrokeStyle(selected ? 2 : 1, selected ? 0x68e4e8 : 0x3b4d63)
        .setInteractive().on("pointerdown", () => { if (!this.state.pending) { this.choiceIndex = index; this.beginChoice(); } });
      this.root.add(card);
      this.root.add(this.text(52, y + 9, `${choice.boon.name.toUpperCase()}  ${roman(rank)} → ${roman(Math.min(3, rank + 1))}`, selected ? IVORY : MUTED, "12px"));
      this.root.add(this.text(52, y + 31, choice.boon.summary, TEAL, "9px"));
      this.root.add(this.text(504, y + 31, `SCAR: ${choice.scar.summary}`, ORANGE, "9px"));
    });

    const canPurge = Boolean(progress) && this.state.affinity.committedPathId !== path.id;
    const purge = this.text(38, 484, `P / Y  PURGE EXPOSURE${canPurge ? ` (${progress!.affinity})` : " — UNAVAILABLE"}`, canPurge ? ORANGE : MUTED, "11px")
      .setInteractive().on("pointerdown", () => { if (!this.state.pending) this.beginPurge(); });
    this.root.add(purge);
    this.root.add(this.text(922, 484, "ESC / B  EXIT", MUTED, "11px", false, true));
    if (this.state.notice) this.root.add(this.text(WIDTH / 2, 515, this.state.notice, ORANGE, "11px", true));

    if (this.state.pending) this.renderWarning(this.state.pending.warning === "commitment");
    this.publishState();
  }

  private renderWarning(commitment: boolean): void {
    const pending = this.state.pending!;
    this.root.add(this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x05090e, 0.78));
    this.root.add(this.add.rectangle(150, 142, 660, 254, PANEL).setOrigin(0, 0)
      .setStrokeStyle(3, commitment ? 0xff9a52 : 0x68e4e8));
    this.root.add(this.text(WIDTH / 2, 168, pending.title, commitment ? ORANGE : TEAL, "20px", true));
    this.root.add(this.text(190, 218, pending.body, IVORY, "12px", false, false, 580));
    this.root.add(this.add.rectangle(190, 318, 580, 16, 0x0b1119).setOrigin(0, 0));
    this.holdBar = this.add.rectangle(190, 318, 580, 16, commitment ? 0xff9a52 : 0x68e4e8)
      .setOrigin(0, 0).setScale(0.001, 1);
    this.root.add(this.holdBar);
    const confirm = this.text(WIDTH / 2, 352, "HOLD ENTER / SPACE / A TO CONFIRM", IVORY, "12px", true)
      .setInteractive().on("pointerdown", () => { this.confirmHeld = true; })
      .on("pointerup", () => { this.confirmHeld = false; })
      .on("pointerout", () => { this.confirmHeld = false; });
    this.root.add(confirm);
    const cancel = this.text(WIDTH / 2, 376, "ESC / B  CANCEL", MUTED, "10px", true)
      .setInteractive().on("pointerdown", () => this.cancelPending());
    this.root.add(cancel);
  }

  private publishState(): void {
    (window as unknown as { __transformationDecisionLab?: object }).__transformationDecisionLab = {
      selectedPathId: TRANSFORMATION_PATH_CATALOG[this.pathIndex]!.id,
      selectedChoiceId: transformationChoicesForPath(TRANSFORMATION_PATH_CATALOG[this.pathIndex]!.id)[this.choiceIndex]!.id,
      state: this.state,
      inertEffects: TRANSFORMATION_CHOICE_CATALOG.length === 18,
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

function roman(rank: number): string {
  return rank <= 0 ? "—" : rank === 1 ? "I" : rank === 2 ? "II" : "III";
}
