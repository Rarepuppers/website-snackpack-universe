import Phaser from "phaser";
import type { EnemySnapshot } from "../combat/CombatSimulation";
import type { GameSettings } from "../save/LocalSaveStore";
import { DAMAGE_TYPE_COLOURS } from "../combat/damageTypes";
import {
  damageTypeForStatus,
  dominantBuildupProgress,
  primaryDamageAffinity,
} from "./EnemyDamageReadout";
import { buildupRowY, enemyBarStyle, shieldRowY, type EnemyBarStyle } from "./EnemyBarStyle";

export type EnemyHealthBarMode = GameSettings["enemyHealthBars"];
export type EnemyThreatClass = "standard" | "specialist" | "elite" | "mini-boss" | "boss";

export interface EnemyHealthBarTarget {
  threatClass: EnemyThreatClass;
  health: number;
  maxHealth: number;
  shield: number;
  maxShield: number;
  recentDamageRemainingSeconds: number;
  hasActiveStatus: boolean;
  majorAttackWindup: boolean;
}

export function shouldShowEnemyHealthBar(target: EnemyHealthBarTarget, mode: EnemyHealthBarMode): boolean {
  if (mode === "off" || target.health <= 0) return false;
  if (target.threatClass === "boss" || target.threatClass === "mini-boss") return true;
  const tacticallyActive = target.recentDamageRemainingSeconds > 0
    || target.hasActiveStatus
    || target.majorAttackWindup;
  if (target.threatClass === "elite" || target.threatClass === "specialist") {
    return mode === "all" || tacticallyActive;
  }
  return mode === "all" && tacticallyActive;
}

interface HealthBarView {
  readonly graphics: Phaser.GameObjects.Graphics;
}

/** Pooled world-space health bars; visibility is pure policy, drawing is presentation-only. */
export class EnemyHealthBars {
  private readonly active = new Map<number, HealthBarView>();
  private readonly pool: HealthBarView[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  get activeViewCount(): number {
    return this.active.size;
  }

  get pooledViewCount(): number {
    return this.pool.length;
  }

  sync(
    enemies: readonly (EnemySnapshot & EnemyHealthBarTarget)[],
    mode: EnemyHealthBarMode,
    reducedMotion: boolean,
    pixelsPerMetre: number,
  ): void {
    const visibleIds = new Set<number>();
    for (const enemy of enemies) {
      if (!shouldShowEnemyHealthBar(enemy, mode)) continue;
      visibleIds.add(enemy.id);
      const view = this.active.get(enemy.id) ?? this.acquire(enemy.id);
      drawHealthBar(view.graphics, enemy);
      view.graphics.setPosition(enemy.position.x * pixelsPerMetre, enemy.position.y * pixelsPerMetre - 26);
      view.graphics.setDepth(1800 + enemy.position.y * 0.01);
      view.graphics.setVisible(true);
      view.graphics.setAlpha(1);
      if (!reducedMotion) {
        this.scene.tweens.killTweensOf(view.graphics);
        view.graphics.setAlpha(0.25);
        this.scene.tweens.add({ targets: view.graphics, alpha: 1, duration: 180 });
      }
    }
    for (const [id, view] of this.active) {
      if (visibleIds.has(id)) continue;
      view.graphics.setVisible(false);
      this.active.delete(id);
      this.pool.push(view);
    }
  }

  private acquire(id: number): HealthBarView {
    const view = this.pool.pop() ?? { graphics: this.scene.add.graphics() };
    this.active.set(id, view);
    return view;
  }
}

function drawHealthBar(
  graphics: Phaser.GameObjects.Graphics,
  enemy: EnemyHealthBarTarget & Partial<EnemySnapshot>,
): void {
  const style = enemyBarStyle(enemy.threatClass);
  const { width, height } = style;
  const healthRatio = Math.max(0, Math.min(1, enemy.health / Math.max(1, enemy.maxHealth)));
  const shieldRatio = Math.max(0, Math.min(1, enemy.shield / Math.max(1, enemy.maxShield)));
  graphics.clear();
  graphics.fillStyle(0x160f16, 0.9).fillRect(-width / 2, 0, width, height);
  graphics.fillStyle(0xd94b5f, 1).fillRect(-width / 2, 0, width * healthRatio, height);
  // Segment dividers on the big pools, so a mini-boss bar that barely moves per
  // hit still shows measurable progress.
  if (style.segments > 1) {
    graphics.fillStyle(0x160f16, 0.85);
    for (let index = 1; index < style.segments; index += 1) {
      graphics.fillRect(-width / 2 + (width * index) / style.segments, 0, 1, height);
    }
  }
  if (style.framed && style.accent !== null) {
    graphics.lineStyle(1, style.accent, 0.9).strokeRect(-width / 2, 0, width, height);
  }
  if (enemy.maxShield > 0 && enemy.shield > 0) {
    graphics.fillStyle(0x5ec9e8, 1).fillRect(-width / 2, shieldRowY(style), width * shieldRatio, 3);
  }
  if (style.accent !== null) {
    graphics.fillStyle(style.accent, 1);
    for (let index = 0; index < style.pips; index += 1) {
      graphics.fillRect(width / 2 + 3 + index * 5, 0, 3, 3);
    }
  }
  drawBuildupTick(graphics, enemy, style);
  drawAffinityMark(graphics, enemy, style);
}

/**
 * A thin tick creeping along under the bar as a status builds toward its
 * threshold. Without it an elemental build gives no feedback at all until the
 * status fires, which made `statusBuildupPercent` feel inert.
 */
function drawBuildupTick(
  graphics: Phaser.GameObjects.Graphics,
  enemy: EnemyHealthBarTarget & Partial<EnemySnapshot>,
  style: EnemyBarStyle,
): void {
  if (!enemy.statusBuildup) return;
  const building = dominantBuildupProgress(enemy.statusBuildup, enemy.statuses ?? []);
  if (!building) return;
  const damageType = damageTypeForStatus(building.status);
  const colour = damageType ? DAMAGE_TYPE_COLOURS[damageType] : 0xffffff;
  graphics.fillStyle(colour, 0.85)
    .fillRect(-style.width / 2, buildupRowY(style), style.width * building.progress, 1);
}

/**
 * Weakness and resistance, as a shape plus a colour rather than colour alone —
 * four colour-vision modes ship, so the triangle direction has to carry the
 * meaning on its own. Up means the enemy takes extra from that type.
 */
function drawAffinityMark(
  graphics: Phaser.GameObjects.Graphics,
  enemy: EnemyHealthBarTarget & Partial<EnemySnapshot>,
  style: EnemyBarStyle,
): void {
  if (!enemy.type) return;
  const mark = primaryDamageAffinity(enemy.type);
  if (!mark) return;
  const colour = DAMAGE_TYPE_COLOURS[mark.damageType];
  const left = -style.width / 2 - 6;
  graphics.fillStyle(colour, 1);
  if (mark.affinity === "weak") {
    graphics.fillTriangle(left, 4, left + 4, 4, left + 2, 0);
  } else {
    graphics.fillTriangle(left, 0, left + 4, 0, left + 2, 4);
  }
}
