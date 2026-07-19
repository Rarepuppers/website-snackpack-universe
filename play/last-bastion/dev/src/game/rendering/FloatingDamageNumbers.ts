import Phaser from "phaser";
import { DAMAGE_TYPE_COLOURS, type DamageType } from "../combat/damageTypes";
import { formatStat } from "../stats/formatStat";
import { uiTextResolution } from "./DisplayScaling";

/**
 * Floating combat damage numbers, pooled like the visual effects.
 *
 * Two rules keep a twelve-weapon build from burying the arena in text
 * (wave_balance.md "Damage numbers"):
 * - hits on the same enemy inside a short window merge into one rising number,
 *   so a five-pellet Scattergun blast reads as a single growing total, and
 * - a hard cap on live labels recycles the oldest rather than spawning more.
 *
 * The merge/cap decision lives in `findMergeIndex` so it can be unit-tested
 * without a Phaser scene; everything else here is thin rendering glue.
 */

export interface MergeableNumber {
  enemyId: number;
  spawnedAtMs: number;
}

/** Window during which further hits on one enemy fold into the same number. */
export const MERGE_WINDOW_MS = 100;

/** Maximum live labels before low-priority enemy text is recycled or dropped. */
export const MAX_ACTIVE_NUMBERS = 24;

const RISE_PIXELS = 26;
const LIFETIME_MS = 620;
const DEPTH = 1200;

export function playerDamageLabel(damage: number): string {
  return `−${formatStat(Math.max(0, damage))}`;
}

/**
 * Index of the number a new hit should merge into, or -1 for a fresh label.
 * A hit merges into the most recent still-young number for the same enemy.
 */
export function findMergeIndex(
  active: readonly MergeableNumber[],
  enemyId: number,
  nowMs: number,
  windowMs: number = MERGE_WINDOW_MS,
): number {
  let best = -1;
  let bestSpawn = -Infinity;
  for (let index = 0; index < active.length; index += 1) {
    const entry = active[index];
    if (!entry || entry.enemyId !== enemyId) continue;
    if (nowMs - entry.spawnedAtMs > windowMs) continue;
    if (entry.spawnedAtMs > bestSpawn) {
      bestSpawn = entry.spawnedAtMs;
      best = index;
    }
  }
  return best;
}

/**
 * Select the oldest recyclable label. Enemy hits are disposable; incoming
 * player damage and healing (negative ids) remain legible under crowd load.
 */
export function findRecycleIndex(
  active: readonly MergeableNumber[],
  allowPriorityRecycle: boolean,
): number {
  let oldestIndex = -1;
  let oldestSpawn = Infinity;
  for (let index = 0; index < active.length; index += 1) {
    const entry = active[index];
    if (!entry || (!allowPriorityRecycle && entry.enemyId < 0)) continue;
    if (entry.spawnedAtMs < oldestSpawn) {
      oldestSpawn = entry.spawnedAtMs;
      oldestIndex = index;
    }
  }
  return oldestIndex;
}

interface ActiveNumber extends MergeableNumber {
  text: Phaser.GameObjects.Text;
  total: number;
  type: DamageType;
}

export class FloatingDamageNumbers {
  private readonly active: ActiveNumber[] = [];
  private readonly free: Phaser.GameObjects.Text[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly maxActive = MAX_ACTIVE_NUMBERS,
  ) {}

  get activeCount(): number {
    return this.active.length;
  }

  /**
   * Report a mitigated hit for display. `xPx`/`yPx` are world-space pixels
   * (metres × PIXELS_PER_METRE); `nowMs` is the scene clock so the caller
   * controls time for deterministic tests.
   */
  report(
    enemyId: number,
    damage: number,
    type: DamageType,
    xPx: number,
    yPx: number,
    nowMs: number,
  ): void {
    if (!(damage > 0)) return;

    const mergeIndex = findMergeIndex(this.active, enemyId, nowMs);
    const entry = mergeIndex >= 0 ? this.active[mergeIndex] : undefined;
    if (entry) {
      entry.total += damage;
      entry.text.setText(formatStat(entry.total));
      // A tiny pop signals the number grew rather than a second label appearing.
      entry.text.setScale(1.18);
      this.scene.tweens.add({ targets: entry.text, scale: 1, duration: 90, ease: "Quad.easeOut" });
      return;
    }

    const text = this.acquire(false);
    if (!text) return;
    text
      .setText(formatStat(damage))
      .setPosition(xPx, yPx)
      .setColor(hexToCss(DAMAGE_TYPE_COLOURS[type]))
      .setFontSize(13)
      .setStroke("#0a0f16", 3)
      .setScale(1)
      .setAlpha(1)
      .setVisible(true)
      .setActive(true);

    const record: ActiveNumber = { text, enemyId, spawnedAtMs: nowMs, total: damage, type };
    this.active.push(record);

    this.scene.tweens.add({
      targets: text,
      y: yPx - RISE_PIXELS,
      alpha: 0,
      duration: LIFETIME_MS,
      ease: "Quad.easeOut",
      onComplete: () => this.release(record),
    });
  }

  reportHealing(amount: number, xPx: number, yPx: number, nowMs: number): void {
    if (!(amount > 0)) return;
    const text = this.acquire(true);
    if (!text) return;
    text
      .setText(`+${formatStat(amount)}`)
      .setPosition(xPx, yPx)
      .setColor("#7ed957")
      .setFontSize(13)
      .setStroke("#0a0f16", 3)
      .setScale(0.9)
      .setAlpha(1)
      .setVisible(true)
      .setActive(true);
    const record: ActiveNumber = {
      text, enemyId: -1, spawnedAtMs: nowMs, total: amount, type: "toxic",
    };
    this.active.push(record);
    this.scene.tweens.add({
      targets: text, y: yPx - RISE_PIXELS, alpha: 0, duration: LIFETIME_MS,
      ease: "Quad.easeOut", onComplete: () => this.release(record),
    });
  }

  reportPlayerDamage(amount: number, xPx: number, yPx: number, nowMs: number): void {
    if (!(amount > 0)) return;
    const text = this.acquire(true);
    if (!text) return;
    text
      .setText(playerDamageLabel(amount))
      .setPosition(xPx, yPx - 10)
      .setColor("#fff1dc")
      .setFontSize(18)
      .setStroke("#641f29", 5)
      .setScale(1.12)
      .setAlpha(1)
      .setVisible(true)
      .setActive(true);
    const record: ActiveNumber = {
      text, enemyId: -2, spawnedAtMs: nowMs, total: amount, type: "physical",
    };
    this.active.push(record);
    this.scene.tweens.add({
      targets: text, y: yPx - RISE_PIXELS - 12, alpha: 0, scale: 1,
      duration: 950, ease: "Quad.easeOut", onComplete: () => this.release(record),
    });
  }

  private acquire(priority: boolean): Phaser.GameObjects.Text | null {
    const reused = this.free.pop();
    if (reused) return reused;

    if (this.active.length >= this.maxActive) {
      // Priority feedback displaces ordinary hits first. Ordinary hits never
      // erase a player-damage/heal label just to add more arena noise.
      let oldestIndex = findRecycleIndex(this.active, false);
      if (oldestIndex < 0 && priority) oldestIndex = findRecycleIndex(this.active, true);
      if (oldestIndex < 0) return null;
      const [oldest] = this.active.splice(oldestIndex, 1);
      if (oldest) {
        this.scene.tweens.killTweensOf(oldest.text);
        return oldest.text;
      }
    }

    return this.scene.add
      .text(0, 0, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#0a0f16",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(DEPTH)
      .setResolution(uiTextResolution())
      .setVisible(false);
  }

  private release(record: ActiveNumber): void {
    const index = this.active.indexOf(record);
    if (index < 0) return;
    this.active.splice(index, 1);
    record.text.setVisible(false).setActive(false);
    this.free.push(record.text);
  }
}

/** Phaser text colours are CSS strings; the palette stores packed hex numbers. */
function hexToCss(value: number): string {
  return `#${value.toString(16).padStart(6, "0")}`;
}
