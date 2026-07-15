import Phaser from "phaser";
import { KeyboardMouseInput } from "../input/KeyboardMouseInput";
import {
  CombatSimulation,
  type CombatSnapshot,
  type EnemySnapshot,
  type ExperiencePickupSnapshot,
  type ProjectileSnapshot,
  type CombatEvent,
} from "../combat/CombatSimulation";
import type { UpgradeDefinition } from "../content/upgradeCatalog";
import type { EquippedWeapon } from "../equipment/WeaponLoadout";
import { clampWeaponCount } from "../equipment/WeaponLoadout";
import { calculateWeaponRingLayout } from "../equipment/WeaponRingLayout";
import {
  angleToward,
  brainBlobFrame,
  cardinalFacingColumn,
  eggClusterFrame,
  offsetGaitRow,
} from "../rendering/EnemyVisualState";
import { loadGameAssets } from "../assets/PhaserAssetLoader";
import { GAME_ASSETS, type GameAssetId } from "../assets/GameAssetManifest";
import { renderArena } from "../rendering/ArenaRenderer";
import { worldDepth } from "../rendering/WorldDepth";
import { VisualEffectPool } from "../effects/VisualEffectPool";
import { CombatHud } from "../ui/CombatHud";

const PIXELS_PER_METRE = 32;

type EnemyView =
  | Phaser.GameObjects.Arc
  | Phaser.GameObjects.Ellipse
  | Phaser.GameObjects.Triangle
  | Phaser.GameObjects.Sprite;
type WeaponView = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
type ProjectileView = Phaser.GameObjects.Arc | Phaser.GameObjects.Sprite;
type PickupView = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;

export class PrototypeScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private marineSprite: Phaser.GameObjects.Sprite | null = null;
  private marineHelmetSprite: Phaser.GameObjects.Sprite | null = null;
  private controls!: KeyboardMouseInput;
  private hud!: CombatHud;
  private effectPool!: VisualEffectPool;
  private readonly stressProfile = readStressProfile();
  private readonly startingWeaponCount = this.stressProfile ?? readStartingWeaponCount();
  private readonly useMarineArt = readMarineArtPreview();
  private readonly useMarineHelmet = this.useMarineArt && readMarineHelmetPreview();
  private readonly showDebug = readDebugMode();
  private simulation = createSimulation(this.startingWeaponCount, this.stressProfile);
  private readonly enemyViews = new Map<number, EnemyView>();
  private readonly projectileViews = new Map<number, ProjectileView>();
  private readonly pickupViews = new Map<number, PickupView>();
  private readonly weaponViews = new Map<number, WeaponView>();
  private upgradeOverlay: Phaser.GameObjects.Container | null = null;
  private visibleUpgradeKey = "";
  private isPaused = false;
  private lastAimAngle = 0;
  private marineFacingColumn = 0;
  private lastRollTrailMilliseconds = -1000;
  private lastSnapshot = this.simulation.snapshot();

  constructor() {
    super("prototype");
  }

  preload(): void {
    loadGameAssets(this);
  }

  create(): void {
    const { width, height } = this.scale;
    renderArena(this, this.simulation.arena, PIXELS_PER_METRE, this.showDebug, this.useMarineArt);
    this.effectPool = new VisualEffectPool(this, this.stressProfile === 12 ? 192 : 96);

    const shadow = this.useMarineArt
      ? this.add.sprite(0, 10, "combat-effects-v1", 0).setScale(0.62)
      : this.add.ellipse(0, 10, 34, 16, 0x05080c, 0.55);
    const playerLayers: Phaser.GameObjects.GameObject[] = [shadow];
    if (this.useMarineArt) {
      this.marineSprite = this.add.sprite(0, 0, "marine-base-v1", 0);
      applyManifestOrigin(this.marineSprite, "marine-base-v1");
      playerLayers.push(this.marineSprite);
      if (this.useMarineHelmet) {
        this.marineHelmetSprite = this.add.sprite(0, 0, "marine-helmet-v1", 0);
        applyManifestOrigin(this.marineHelmetSprite, "marine-helmet-v1");
        playerLayers.push(this.marineHelmetSprite);
      }
    } else {
      const body = this.add.circle(0, 0, 16, 0x253d5f).setStrokeStyle(3, 0xe9e3cf);
      const visor = this.add.rectangle(3, -7, 15, 5, 0xffa31a);
      playerLayers.push(body, visor);
    }
    this.player = this.add.container(width / 2, height / 2, playerLayers);
    this.player.setDepth(worldDepth(this.simulation.snapshot().playerPosition.y));

    this.add.text(width / 2, height - 14, "WASD / ARROWS MOVE   •   MOUSE AIM / FIRE   •   SPACE ROLL   •   ESC PAUSE", {
      color: "#9fb3c8",
      fontFamily: "monospace",
      fontSize: "10px",
    }).setOrigin(0.5, 1).setDepth(2000);

    this.hud = new CombatHud(this, this.showDebug, this.useMarineArt);

    this.controls = new KeyboardMouseInput(this);
    this.lastSnapshot = this.simulation.snapshot();
    this.renderSnapshot(this.lastSnapshot, false);
  }

  update(_time: number, deltaMilliseconds: number): void {
    const deltaSeconds = Math.min(deltaMilliseconds / 1000, 0.05);
    const intent = this.controls.read(this.player);

    if (
      intent.restartPressed
      && (this.lastSnapshot.status === "victory" || this.lastSnapshot.status === "defeat")
    ) {
      this.restartRun();
      return;
    }

    if (intent.pausePressed && this.lastSnapshot.pendingUpgradeChoices.length === 0) {
      this.isPaused = !this.isPaused;
    }

    if (this.isPaused) {
      this.renderSnapshot(this.lastSnapshot, false);
      return;
    }

    const snapshot = this.simulation.step(intent, deltaSeconds);
    this.lastSnapshot = snapshot;
    this.updateMarineFrame(snapshot.heroState, intent.move);

    if (intent.aim.x !== 0 || intent.aim.y !== 0) {
      this.lastAimAngle = Math.atan2(intent.aim.y, intent.aim.x);
    }

    this.renderSnapshot(snapshot, intent.fireHeld);
    this.playCombatEvents(snapshot.events);
    if (snapshot.heroState === "evading" && this.time.now - this.lastRollTrailMilliseconds >= 70) {
      this.lastRollTrailMilliseconds = this.time.now;
      if (this.useMarineArt) {
        this.emitAuthoredEffect(1, snapshot.playerPosition, 180, 0.7, 1.25, this.lastAimAngle);
        return;
      }
      this.effectPool.emit({
        x: snapshot.playerPosition.x * PIXELS_PER_METRE,
        y: snapshot.playerPosition.y * PIXELS_PER_METRE,
        radius: 12,
        color: 0x68e4e8,
        duration: 180,
        targetScale: 1.8,
        alpha: 0.35,
        outlineOnly: true,
      });
    }
  }

  private renderSnapshot(snapshot: CombatSnapshot, firing: boolean): void {
    this.player.setPosition(
      snapshot.playerPosition.x * PIXELS_PER_METRE,
      snapshot.playerPosition.y * PIXELS_PER_METRE,
    );
    this.player.setAlpha(snapshot.playerInvulnerable ? 0.55 : 1);
    this.player.setDepth(worldDepth(snapshot.playerPosition.y));

    this.syncWeapons(snapshot.equippedWeapons, snapshot.playerPosition, firing);
    this.syncEnemies(snapshot.enemies, snapshot.playerPosition);
    this.syncProjectiles(snapshot.projectiles);
    this.syncPickups(snapshot.pickups);
    this.syncUpgradeOverlay(snapshot.pendingUpgradeChoices);
    this.hud.update(snapshot, this.isPaused, this.effectPool.activeCount);
  }

  private updateMarineFrame(heroState: string, move: { x: number; y: number }): void {
    if (!this.marineSprite) {
      return;
    }

    if (move.x !== 0 || move.y !== 0) {
      if (Math.abs(move.x) > Math.abs(move.y)) {
        this.marineFacingColumn = move.x > 0 ? 2 : 3;
      } else {
        this.marineFacingColumn = move.y > 0 ? 0 : 1;
      }
    }

    const row = heroState === "evading" ? 2 : heroState === "moving" ? 1 : 0;
    const frame = row * 4 + this.marineFacingColumn;
    this.marineSprite.setFrame(frame);
    this.marineHelmetSprite?.setFrame(frame);
  }

  private restartRun(): void {
    this.simulation = createSimulation(this.startingWeaponCount, this.stressProfile);
    this.lastSnapshot = this.simulation.snapshot();
    this.isPaused = false;
    this.visibleUpgradeKey = "";
    this.upgradeOverlay?.destroy(true);
    this.upgradeOverlay = null;

    for (const views of [this.enemyViews, this.projectileViews, this.pickupViews]) {
      for (const view of views.values()) {
        view.destroy();
      }
      views.clear();
    }

    this.renderSnapshot(this.lastSnapshot, false);
  }

  private playCombatEvents(events: readonly CombatEvent[]): void {
    for (const event of events) {
      switch (event.type) {
        case "weapon-fired":
          this.pulseWeapon(event.weaponInstanceId);
          this.emitAuthoredEffect(5, event.position, 90, 0.48, 0.9, Math.atan2(event.direction.y, event.direction.x));
          break;
        case "enemy-hit":
          this.emitAuthoredEffect(7, event.position, 110, 0.55, 0.95);
          break;
        case "enemy-defeated":
          this.emitAuthoredEffect(event.enemyType === "brain-blob" ? 18 : event.enemyType === "egg-cluster" ? 13 : 11, event.position, 210, 0.72, 1.2);
          break;
        case "explosion":
          this.emitAuthoredEffect(9, event.position, 240, event.radiusMetres, event.radiusMetres * 1.5);
          break;
        case "player-hit":
          this.cameras.main.shake(120, 0.006);
          this.emitAuthoredEffect(3, event.position, 180, 0.85, 1.4);
          break;
        case "xp-collected":
          this.emitAuthoredEffect(19, event.position, 130, 0.4, 0.8);
          break;
        case "level-up":
          this.cameras.main.flash(160, 104, 228, 232);
          this.emitAuthoredEffect(2, this.lastSnapshot.playerPosition, 420, 0.9, 2.2);
          break;
        case "enemy-spawned":
          this.emitAuthoredEffect(event.enemyType === "egg-cluster" ? 12 : event.enemyType === "scuttler" ? 10 : 19, event.position, 230, 0.65, 1.25);
          break;
        case "egg-hatched":
          this.emitAuthoredEffect(14, event.position, 280, 0.9, 1.45);
          this.cameras.main.shake(90, 0.0025);
          break;
        case "projectile-blocked":
          this.emitAuthoredEffect(7, event.position, 130, 0.5, 0.95);
          break;
      }
    }
  }

  private emitAuthoredEffect(
    frame: number,
    position: { x: number; y: number },
    duration: number,
    scale: number,
    targetScale: number,
    rotation = 0,
  ): void {
    if (!this.useMarineArt) {
      this.flashCircle(position, 8, 0x68e4e8, duration, targetScale);
      return;
    }
    this.effectPool.emitSprite({
      x: position.x * PIXELS_PER_METRE,
      y: position.y * PIXELS_PER_METRE,
      frame, duration, scale, targetScale, rotation,
    });
  }

  private flashCircle(
    position: { x: number; y: number },
    radiusPixels: number,
    color: number,
    duration: number,
    targetScale: number,
    outlineOnly = false,
  ): void {
    this.effectPool.emit({
      x: position.x * PIXELS_PER_METRE,
      y: position.y * PIXELS_PER_METRE,
      radius: radiusPixels,
      color,
      duration,
      targetScale,
      outlineOnly,
    });
  }

  private syncWeapons(
    weapons: readonly Readonly<EquippedWeapon>[],
    playerPosition: { x: number; y: number },
    firing: boolean,
  ): void {
    const liveIds = new Set(weapons.map((weapon) => weapon.instanceId));
    this.destroyMissing(this.weaponViews, liveIds);
    const slots = calculateWeaponRingLayout(weapons.length, this.lastAimAngle);

    weapons.forEach((weapon, index) => {
      let view = this.weaponViews.get(weapon.instanceId);
      if (!view) {
        view = this.useMarineArt
          ? this.add.image(0, 0, "service-rifle-v1")
            .setOrigin(GAME_ASSETS["service-rifle-v1"].pivot.x, GAME_ASSETS["service-rifle-v1"].pivot.y)
          : this.add.rectangle(0, 0, 34, 8, 0xe9e3cf)
            .setOrigin(0.2, 0.5)
            .setStrokeStyle(2, 0x101720);
        this.weaponViews.set(weapon.instanceId, view);
      }

      const slot = slots[index]!;
      view.setPosition(
        (playerPosition.x + slot.x) * PIXELS_PER_METRE,
        (playerPosition.y + slot.y) * PIXELS_PER_METRE,
      );
      view.setRotation(this.lastAimAngle);
      view.setDepth(worldDepth(playerPosition.y) + slot.depthOffset * 2);
      if (view instanceof Phaser.GameObjects.Rectangle) {
        view.setFillStyle(firing ? 0xffffff : 0xe9e3cf);
      } else {
        firing ? view.setTint(0xffffff) : view.clearTint();
      }
    });
  }

  private pulseWeapon(instanceId: number): void {
    const weapon = this.weaponViews.get(instanceId);
    if (!weapon) {
      return;
    }

    weapon.setScale(1.08, 1.18);
    this.tweens.add({
      targets: weapon,
      scaleX: 1,
      scaleY: 1,
      duration: 70,
      ease: "Quad.easeOut",
    });
  }

  private syncEnemies(
    enemies: readonly EnemySnapshot[],
    playerPosition: { x: number; y: number },
  ): void {
    const liveIds = new Set(enemies.map((enemy) => enemy.id));
    this.destroyMissing(this.enemyViews, liveIds);

    for (const enemy of enemies) {
      let view = this.enemyViews.get(enemy.id);
      if (!view) {
        view = this.createEnemyView(enemy);
        this.enemyViews.set(enemy.id, view);
      }

      view.setPosition(
        enemy.position.x * PIXELS_PER_METRE,
        enemy.position.y * PIXELS_PER_METRE,
      );
      view.setDepth(worldDepth(enemy.position.y));
      this.styleEnemyView(view, enemy);
      if (view instanceof Phaser.GameObjects.Sprite) {
        this.updateEnemySprite(view, enemy, playerPosition);
      }
    }
  }

  private createEnemyView(enemy: EnemySnapshot): EnemyView {
    switch (enemy.type) {
      case "egg-cluster":
        if (this.useMarineArt) {
          return createManifestSprite(this, "egg-cluster-v1");
        }
        return this.add.ellipse(0, 0, 42, 52, 0xb7d84a).setStrokeStyle(3, 0x4b6327);
      case "brain-blob":
        if (this.useMarineArt) {
          return createManifestSprite(this, "brain-blob-v1");
        }
        return this.add.circle(0, 0, 18, 0xc06cdb).setStrokeStyle(3, 0x55236b);
      default:
        if (this.useMarineArt) {
          return createManifestSprite(this, "scuttler-v1");
        }
        return this.add.triangle(0, 0, 0, -17, 15, 13, -15, 13, 0xff6654)
          .setStrokeStyle(3, 0x6f1d24);
    }
  }

  private styleEnemyView(view: EnemyView, enemy: EnemySnapshot): void {
    if (view instanceof Phaser.GameObjects.Sprite) {
      view.setScale(1);
      return;
    }

    const healthScale = 0.82 + 0.18 * Math.max(enemy.health / enemy.maxHealth, 0);
    view.setScale(healthScale);

    if (enemy.type === "egg-cluster") {
      const pulse = 1 + Math.sin(enemy.hatchProgress * Math.PI * 8) * 0.06 * enemy.hatchProgress;
      view.setScale(healthScale * pulse);
    }

    if (enemy.type === "brain-blob") {
      const colors: Record<string, number> = {
        drift: 0xc06cdb,
        windup: 0xffd55c,
        lunge: 0xff5fa2,
        recover: 0x76518f,
      };
      view.setFillStyle(colors[enemy.brainPhase ?? "drift"] ?? 0xc06cdb);
    }
  }

  private updateEnemySprite(
    view: Phaser.GameObjects.Sprite,
    enemy: EnemySnapshot,
    playerPosition: { x: number; y: number },
  ): void {
    switch (enemy.type) {
      case "egg-cluster":
        view.setFrame(eggClusterFrame(enemy.hatchProgress));
        view.setRotation(0);
        return;
      case "brain-blob":
        view.setFrame(brainBlobFrame(enemy.brainPhase ?? "drift"));
        view.setRotation(angleToward(enemy.position, playerPosition));
        return;
      default: {
        const facingColumn = cardinalFacingColumn(enemy.position, playerPosition);
        const gaitRow = offsetGaitRow(this.time.now, enemy.id);
        view.setFrame(gaitRow * 4 + facingColumn);
        view.setRotation(0);
      }
    }
  }

  private syncProjectiles(projectiles: readonly ProjectileSnapshot[]): void {
    const liveIds = new Set(projectiles.map((projectile) => projectile.id));
    this.destroyMissing(this.projectileViews, liveIds);

    for (const projectile of projectiles) {
      let view = this.projectileViews.get(projectile.id);
      if (!view) {
        view = this.useMarineArt
          ? this.add.sprite(0, 0, "combat-effects-v1", 6).setScale(0.3)
          : this.add.circle(0, 0, 4, 0xffd36b).setStrokeStyle(1, 0xffffff);
        view.setDepth(700);
        this.projectileViews.set(projectile.id, view);
      }
      view.setPosition(
        projectile.position.x * PIXELS_PER_METRE,
        projectile.position.y * PIXELS_PER_METRE,
      );
      view.setRotation(projectile.rotationRadians);
    }
  }

  private syncPickups(pickups: readonly ExperiencePickupSnapshot[]): void {
    const liveIds = new Set(pickups.map((pickup) => pickup.id));
    this.destroyMissing(this.pickupViews, liveIds);

    for (const pickup of pickups) {
      let view = this.pickupViews.get(pickup.id);
      if (!view) {
        view = this.useMarineArt
          ? this.add.sprite(0, 0, "pickups-v1", 0).setScale(0.55)
          : this.add.rectangle(0, 0, 10, 10, 0x58e6ef).setRotation(Math.PI / 4).setStrokeStyle(2, 0xffffff);
        view.setDepth(worldDepth(pickup.position.y) - 3);
        this.pickupViews.set(pickup.id, view);
      }
      view.setPosition(
        pickup.position.x * PIXELS_PER_METRE,
        pickup.position.y * PIXELS_PER_METRE,
      );
      view.setDepth(worldDepth(pickup.position.y) - 3);
      if (view instanceof Phaser.GameObjects.Sprite) {
        view.setFrame((Math.floor(this.time.now / 180) + pickup.id) % 2);
      }
    }
  }

  private syncUpgradeOverlay(choices: readonly UpgradeDefinition[]): void {
    const nextKey = choices.map((choice) => choice.id).join("|");
    if (nextKey === this.visibleUpgradeKey) {
      return;
    }

    this.upgradeOverlay?.destroy(true);
    this.upgradeOverlay = null;
    this.visibleUpgradeKey = nextKey;

    if (choices.length === 0) {
      return;
    }

    const { width, height } = this.scale;
    const children: Phaser.GameObjects.GameObject[] = [];
    children.push(this.useMarineArt
      ? this.add.image(0, 0, "hud-panels-v1", 4).setDisplaySize(760, 330)
      : this.add.rectangle(0, 0, 760, 330, 0x101722, 0.96).setStrokeStyle(3, 0x68e4e8));
    children.push(this.add.text(0, -125, "LEVEL UP — CHOOSE AN UPGRADE", {
      color: "#ffffff",
      fontFamily: "monospace",
      fontSize: "22px",
    }).setOrigin(0.5));

    choices.forEach((choice, index) => {
      const y = -60 + index * 86;
      const button = this.useMarineArt
        ? this.add.image(0, y, "hud-panels-v1", 3).setDisplaySize(670, 66)
          .setInteractive({ useHandCursor: true })
        : this.add.rectangle(0, y, 670, 66, 0x22334a)
          .setStrokeStyle(2, 0x4f6e8d).setInteractive({ useHandCursor: true });
      const label = this.add.text(-310, y - 18, `${index + 1}. ${choice.name}\n${choice.description}`, {
        color: "#edf4ff",
        fontFamily: "monospace",
        fontSize: "15px",
        lineSpacing: 5,
      });
      button.on("pointerover", () => button.setAlpha(0.82));
      button.on("pointerout", () => button.setAlpha(1));
      button.on("pointerdown", () => this.simulation.chooseUpgrade(choice.id));
      children.push(button, label);
    });

    this.upgradeOverlay = this.add.container(width / 2, height / 2, children).setDepth(2200);
  }

  private destroyMissing<T extends Phaser.GameObjects.GameObject>(
    views: Map<number, T>,
    liveIds: ReadonlySet<number>,
  ): void {
    for (const [id, view] of views) {
      if (!liveIds.has(id)) {
        view.destroy();
        views.delete(id);
      }
    }
  }
}

function readStartingWeaponCount(): number {
  const rawCount = new URLSearchParams(window.location.search).get("weapons");
  if (rawCount === null || rawCount.trim() === "") {
    return 1;
  }

  return clampWeaponCount(Number(rawCount));
}

function readMarineArtPreview(): boolean {
  return new URLSearchParams(window.location.search).get("art") !== "placeholder";
}

function readMarineHelmetPreview(): boolean {
  return new URLSearchParams(window.location.search).get("helmet") !== "0";
}

function readStressProfile(): 4 | 12 | null {
  const stress = Number(new URLSearchParams(window.location.search).get("stress"));
  return stress === 4 || stress === 12 ? stress : null;
}

function readDebugMode(): boolean {
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

function createSimulation(startingWeaponCount: number, stressProfile: 4 | 12 | null): CombatSimulation {
  return new CombatSimulation({
    startingWeaponCount,
    stressProfile: stressProfile ?? undefined,
  });
}

function applyManifestOrigin(
  view: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
  assetId: GameAssetId,
): void {
  const asset = GAME_ASSETS[assetId];
  view.setOrigin(asset.pivot.x, asset.pivot.y);
}

function createManifestSprite(
  scene: Phaser.Scene,
  assetId: "scuttler-v1" | "egg-cluster-v1" | "brain-blob-v1",
): Phaser.GameObjects.Sprite {
  const sprite = scene.add.sprite(0, 0, assetId, 0);
  applyManifestOrigin(sprite, assetId);
  return sprite;
}
