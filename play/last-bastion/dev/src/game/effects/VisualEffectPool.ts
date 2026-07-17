import Phaser from "phaser";

export interface PooledCircleEffect {
  x: number;
  y: number;
  radius: number;
  color: number;
  duration: number;
  targetScale: number;
  alpha?: number;
  outlineOnly?: boolean;
}

export interface PooledSpriteEffect {
  x: number;
  y: number;
  frame: number;
  duration: number;
  scale?: number;
  targetScale?: number;
  rotation?: number;
  texture?: "combat-effects-v1" | "batch-b-effects-v1" | "batch-c-effects-v1" | "batch-c-rewards-v1" | "brood-warden-effects-v1" | "ripper-effects-v1" | "quillback-effects-v1" | "spinewheel-effects-v1" | "tether-bloom-effects-v1" | "bastion-eater-effects-v1" | "bastion-eater-environment-v1";
}

export class VisualEffectPool {
  private readonly free: Phaser.GameObjects.Arc[] = [];
  private readonly active: Phaser.GameObjects.Arc[] = [];
  private readonly freeSprites: Phaser.GameObjects.Sprite[] = [];
  private readonly activeSprites: Phaser.GameObjects.Sprite[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly maximumSize = 96,
  ) {}

  get activeCount(): number {
    return this.active.length + this.activeSprites.length;
  }

  emitSprite(effect: PooledSpriteEffect): void {
    const view = this.acquireSprite();
    const startScale = effect.scale ?? 1;
    view.setTexture(effect.texture ?? "combat-effects-v1", effect.frame)
      .setPosition(effect.x, effect.y)
      .setRotation(effect.rotation ?? 0)
      .setAlpha(1)
      .setScale(startScale)
      .setVisible(true)
      .setActive(true)
      .setDepth(900);
    this.scene.tweens.add({
      targets: view,
      alpha: 0,
      scaleX: effect.targetScale ?? startScale * 1.35,
      scaleY: effect.targetScale ?? startScale * 1.35,
      duration: effect.duration,
      ease: "Quad.easeOut",
      onComplete: () => this.releaseSprite(view),
    });
  }

  emit(effect: PooledCircleEffect): void {
    const view = this.acquire();
    view
      .setPosition(effect.x, effect.y)
      .setRadius(effect.radius)
      .setFillStyle(effect.color, effect.outlineOnly ? 0 : effect.alpha ?? 0.85)
      .setStrokeStyle(effect.outlineOnly ? 3 : 0, effect.color, effect.alpha ?? 0.9)
      .setAlpha(1)
      .setScale(effect.outlineOnly ? 0.2 : 1)
      .setVisible(true)
      .setActive(true)
      .setDepth(900);

    this.scene.tweens.add({
      targets: view,
      alpha: 0,
      scaleX: effect.targetScale,
      scaleY: effect.targetScale,
      duration: effect.duration,
      ease: "Quad.easeOut",
      onComplete: () => this.release(view),
    });
  }

  emitBurst(x: number, y: number, color: number, count = 4): void {
    for (let index = 0; index < count; index += 1) {
      const angle = index * Math.PI * 2 / count;
      this.emit({
        x: x + Math.cos(angle) * 7,
        y: y + Math.sin(angle) * 7,
        radius: 4 + index,
        color,
        duration: 150 + index * 18,
        targetScale: 2.2,
        alpha: 0.8,
      });
    }
  }

  private acquire(): Phaser.GameObjects.Arc {
    const freeView = this.free.pop();
    if (freeView) {
      this.active.push(freeView);
      return freeView;
    }

    if (this.active.length >= this.maximumSize) {
      const reused = this.active.shift()!;
      this.scene.tweens.killTweensOf(reused);
      this.active.push(reused);
      return reused;
    }

    const created = this.scene.add.circle(0, 0, 1, 0xffffff, 0).setVisible(false);
    this.active.push(created);
    return created;
  }

  private release(view: Phaser.GameObjects.Arc): void {
    const index = this.active.indexOf(view);
    if (index < 0) return;
    this.active.splice(index, 1);
    view.setVisible(false).setActive(false);
    this.free.push(view);
  }

  private acquireSprite(): Phaser.GameObjects.Sprite {
    const freeView = this.freeSprites.pop();
    if (freeView) {
      this.activeSprites.push(freeView);
      return freeView;
    }
    if (this.activeSprites.length >= this.maximumSize) {
      const reused = this.activeSprites.shift()!;
      this.scene.tweens.killTweensOf(reused);
      this.activeSprites.push(reused);
      return reused;
    }
    const created = this.scene.add.sprite(0, 0, "combat-effects-v1", 0).setVisible(false);
    this.activeSprites.push(created);
    return created;
  }

  private releaseSprite(view: Phaser.GameObjects.Sprite): void {
    const index = this.activeSprites.indexOf(view);
    if (index < 0) return;
    this.activeSprites.splice(index, 1);
    view.setVisible(false).setActive(false);
    this.freeSprites.push(view);
  }
}
