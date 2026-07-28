import Phaser from "phaser";
import type { EnemySnapshot } from "../combat/CombatSimulation";
import type { GameSettings } from "../save/LocalSaveStore";

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

function drawHealthBar(graphics: Phaser.GameObjects.Graphics, enemy: EnemyHealthBarTarget): void {
  const width = 34;
  const healthRatio = Math.max(0, Math.min(1, enemy.health / Math.max(1, enemy.maxHealth)));
  const shieldRatio = Math.max(0, Math.min(1, enemy.shield / Math.max(1, enemy.maxShield)));
  graphics.clear();
  graphics.fillStyle(0x160f16, 0.9).fillRect(-width / 2, 0, width, 4);
  graphics.fillStyle(0xd94b5f, 1).fillRect(-width / 2, 0, width * healthRatio, 4);
  if (enemy.maxShield > 0 && enemy.shield > 0) {
    graphics.fillStyle(0x5ec9e8, 1).fillRect(-width / 2, 5, width * shieldRatio, 3);
  }
  if (enemy.threatClass === "elite" || enemy.threatClass === "mini-boss" || enemy.threatClass === "boss") {
    graphics.fillStyle(0xffcf70, 1).fillRect(width / 2 + 3, 0, 3, 3);
  }
}
