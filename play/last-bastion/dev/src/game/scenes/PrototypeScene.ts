import Phaser from "phaser";
import { KeyboardMouseInput } from "../input/KeyboardMouseInput";
import { MARINE } from "../hero/marine";
import { PROTOTYPE_EVASIVE_RECOVERY_SECONDS } from "../hero/HeroMotionController";
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
import marineBaseSheetUrl from "../../../../art/production-tests/marine-base-spritesheet-v1-96.png";
import marineHelmetSheetUrl from "../../../../art/production-tests/marine-bastion-helmet-overlay-v1-96.png";
import serviceRifleUrl from "../../../../art/production-tests/bastion-service-rifle-gameplay-v1-64.png";

const PIXELS_PER_METRE = 32;

type EnemyView = Phaser.GameObjects.Arc | Phaser.GameObjects.Ellipse | Phaser.GameObjects.Triangle;
type WeaponView = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;

export class PrototypeScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private marineSprite: Phaser.GameObjects.Sprite | null = null;
  private marineHelmetSprite: Phaser.GameObjects.Sprite | null = null;
  private statusText!: Phaser.GameObjects.Text;
  private encounterText!: Phaser.GameObjects.Text;
  private rollReadinessFill!: Phaser.GameObjects.Rectangle;
  private controls!: KeyboardMouseInput;
  private readonly startingWeaponCount = readStartingWeaponCount();
  private readonly useMarineArt = readMarineArtPreview();
  private readonly useMarineHelmet = this.useMarineArt && readMarineHelmetPreview();
  private simulation = new CombatSimulation({ startingWeaponCount: this.startingWeaponCount });
  private readonly enemyViews = new Map<number, EnemyView>();
  private readonly projectileViews = new Map<number, Phaser.GameObjects.Arc>();
  private readonly pickupViews = new Map<number, Phaser.GameObjects.Rectangle>();
  private readonly weaponViews = new Map<number, WeaponView>();
  private upgradeOverlay: Phaser.GameObjects.Container | null = null;
  private visibleUpgradeKey = "";
  private isPaused = false;
  private lastAimAngle = 0;
  private marineFacingColumn = 0;
  private lastSnapshot = this.simulation.snapshot();

  constructor() {
    super("prototype");
  }

  preload(): void {
    this.load.spritesheet("marine-base-v1", marineBaseSheetUrl, {
      frameWidth: 96,
      frameHeight: 96,
    });
    this.load.spritesheet("marine-helmet-v1", marineHelmetSheetUrl, {
      frameWidth: 96,
      frameHeight: 96,
    });
    this.load.image("service-rifle-v1", serviceRifleUrl);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width - 32, height - 32, 0x192534)
      .setStrokeStyle(2, 0x354a61);

    const grid = this.add.grid(
      width / 2,
      height / 2,
      width - 36,
      height - 36,
      PIXELS_PER_METRE,
      PIXELS_PER_METRE,
      0x192534,
      1,
      0x243548,
      0.5,
    );
    grid.setDepth(-2);

    const shadow = this.add.ellipse(0, 10, 34, 16, 0x05080c, 0.55);
    const playerLayers: Phaser.GameObjects.GameObject[] = [shadow];
    if (this.useMarineArt) {
      this.marineSprite = this.add.sprite(0, -17, "marine-base-v1", 0);
      playerLayers.push(this.marineSprite);
      if (this.useMarineHelmet) {
        this.marineHelmetSprite = this.add.sprite(0, -17, "marine-helmet-v1", 0);
        playerLayers.push(this.marineHelmetSprite);
      }
    } else {
      const body = this.add.circle(0, 0, 16, 0x253d5f).setStrokeStyle(3, 0xe9e3cf);
      const visor = this.add.rectangle(3, -7, 15, 5, 0xffa31a);
      playerLayers.push(body, visor);
    }
    this.player = this.add.container(width / 2, height / 2, playerLayers);
    this.player.setDepth(20);

    this.add.text(24, 18, "LAST BASTION — COMBAT PROTOTYPE", {
      color: "#edf4ff",
      fontFamily: "monospace",
      fontSize: "18px",
    }).setDepth(50);
    this.add.text(24, 44, "WASD / arrows: move   Mouse: aim/fire   Space: roll   Esc: pause   Enter: restart after run", {
      color: "#9fb3c8",
      fontFamily: "monospace",
      fontSize: "13px",
    }).setDepth(50);
    this.statusText = this.add.text(24, height - 58, "", {
      color: "#68e4e8",
      fontFamily: "monospace",
      fontSize: "13px",
      lineSpacing: 3,
    }).setDepth(50);
    this.encounterText = this.add.text(width / 2, 82, "", {
      align: "center",
      color: "#ffffff",
      fontFamily: "monospace",
      fontSize: "24px",
      stroke: "#101720",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(60);

    this.add.text(width - 180, height - 37, "ROLL", {
      color: "#9fb3c8",
      fontFamily: "monospace",
      fontSize: "12px",
    }).setDepth(50);
    this.add.rectangle(width - 66, height - 30, 110, 12, 0x0c1119)
      .setStrokeStyle(2, 0x4f6e8d)
      .setDepth(50);
    this.rollReadinessFill = this.add.rectangle(width - 120, height - 30, 106, 8, 0x68e4e8)
      .setOrigin(0, 0.5)
      .setDepth(51);

    this.controls = new KeyboardMouseInput(this);
    this.renderSnapshot(this.simulation.snapshot(), false);
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
      this.encounterText.setText("PAUSED\nPress Esc to continue");
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
  }

  private renderSnapshot(snapshot: CombatSnapshot, firing: boolean): void {
    this.player.setPosition(
      snapshot.playerPosition.x * PIXELS_PER_METRE,
      snapshot.playerPosition.y * PIXELS_PER_METRE,
    );
    this.player.setAlpha(snapshot.playerInvulnerable ? 0.55 : 1);

    this.syncWeapons(snapshot.equippedWeapons, snapshot.playerPosition, firing);
    this.syncEnemies(snapshot.enemies);
    this.syncProjectiles(snapshot.projectiles);
    this.syncPickups(snapshot.pickups);
    this.syncUpgradeOverlay(snapshot.pendingUpgradeChoices);

    const totalCooldown = MARINE.evasiveMove.durationSeconds + PROTOTYPE_EVASIVE_RECOVERY_SECONDS;
    const readiness = snapshot.evasiveReady
      ? 1
      : 1 - Math.min(snapshot.evasiveCooldownRemainingSeconds / totalCooldown, 1);
    this.rollReadinessFill.setScale(Math.max(readiness, 0.02), 1);
    this.rollReadinessFill.setFillStyle(snapshot.evasiveReady ? 0x68e4e8 : 0xffa31a);

    this.statusText.setText([
      `Wave ${snapshot.waveNumber}/${snapshot.totalWaves}  HP ${Math.ceil(snapshot.playerHealth)}/${snapshot.playerMaxHealth}  Level ${snapshot.level}  XP ${snapshot.experience}/${snapshot.experienceForNextLevel}`,
      `State ${snapshot.heroState}  Roll ${snapshot.evasiveReady ? "READY" : `${snapshot.evasiveCooldownRemainingSeconds.toFixed(2)}s`}  ${MARINE.evasiveMove.durationSeconds.toFixed(2)}s / ${MARINE.evasiveMove.distanceMetres.toFixed(1)}m / ${MARINE.evasiveMove.invulnerabilitySeconds.toFixed(2)}s invulnerable`,
      `${snapshot.equippedWeapons.length} weapon(s)  Rifle ${snapshot.weapon.projectileCount} shot(s)  ${snapshot.weapon.projectileDamage.toFixed(0)} damage  ${snapshot.weapon.pierceCount} pierce`,
    ]);

    switch (snapshot.status) {
      case "intermission":
        this.encounterText.setText("WAVE CLEARED");
        break;
      case "victory":
        this.encounterText.setText("PROTOTYPE VICTORY\nPress Enter to restart");
        break;
      case "defeat":
        this.encounterText.setText("BASTION SOLDIER DOWN\nPress Enter to restart");
        break;
      default:
        this.encounterText.setText("");
    }
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
    this.simulation = new CombatSimulation({ startingWeaponCount: this.startingWeaponCount });
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
          this.flashCircle(event.position, 5, 0xffd36b, 90, 2.2);
          break;
        case "enemy-hit":
          this.flashCircle(event.position, 7, 0xffffff, 110, 1.8);
          break;
        case "enemy-defeated":
          this.flashCircle(event.position, 14, 0xff6654, 210, 2.4);
          break;
        case "explosion":
          this.flashCircle(
            event.position,
            event.radiusMetres * PIXELS_PER_METRE,
            0xffa31a,
            240,
            1,
            true,
          );
          break;
        case "player-hit":
          this.cameras.main.shake(120, 0.006);
          this.flashCircle(event.position, 22, 0xff3d55, 180, 2);
          break;
        case "xp-collected":
          this.flashCircle(event.position, 6, 0x58e6ef, 130, 1.7);
          break;
        case "level-up":
          this.cameras.main.flash(160, 104, 228, 232);
          break;
      }
    }
  }

  private flashCircle(
    position: { x: number; y: number },
    radiusPixels: number,
    color: number,
    duration: number,
    targetScale: number,
    outlineOnly = false,
  ): void {
    const effect = this.add.circle(
      position.x * PIXELS_PER_METRE,
      position.y * PIXELS_PER_METRE,
      radiusPixels,
      color,
      outlineOnly ? 0 : 0.85,
    ).setDepth(40);

    if (outlineOnly) {
      effect.setStrokeStyle(3, color, 0.9);
      effect.setScale(0.2);
    }

    this.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: targetScale,
      scaleY: targetScale,
      duration,
      ease: "Quad.easeOut",
      onComplete: () => effect.destroy(),
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
          ? this.add.image(0, 0, "service-rifle-v1").setOrigin(0.25, 0.5)
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
      view.setDepth(20 + slot.depthOffset * 2);
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

  private syncEnemies(enemies: readonly EnemySnapshot[]): void {
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
      view.setDepth(12);
      this.styleEnemyView(view, enemy);
    }
  }

  private createEnemyView(enemy: EnemySnapshot): EnemyView {
    switch (enemy.type) {
      case "egg-cluster":
        return this.add.ellipse(0, 0, 42, 52, 0xb7d84a).setStrokeStyle(3, 0x4b6327);
      case "brain-blob":
        return this.add.circle(0, 0, 18, 0xc06cdb).setStrokeStyle(3, 0x55236b);
      default:
        return this.add.triangle(0, 0, 0, -17, 15, 13, -15, 13, 0xff6654)
          .setStrokeStyle(3, 0x6f1d24);
    }
  }

  private styleEnemyView(view: EnemyView, enemy: EnemySnapshot): void {
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

  private syncProjectiles(projectiles: readonly ProjectileSnapshot[]): void {
    const liveIds = new Set(projectiles.map((projectile) => projectile.id));
    this.destroyMissing(this.projectileViews, liveIds);

    for (const projectile of projectiles) {
      let view = this.projectileViews.get(projectile.id);
      if (!view) {
        view = this.add.circle(0, 0, 4, 0xffd36b).setStrokeStyle(1, 0xffffff);
        view.setDepth(16);
        this.projectileViews.set(projectile.id, view);
      }
      view.setPosition(
        projectile.position.x * PIXELS_PER_METRE,
        projectile.position.y * PIXELS_PER_METRE,
      );
    }
  }

  private syncPickups(pickups: readonly ExperiencePickupSnapshot[]): void {
    const liveIds = new Set(pickups.map((pickup) => pickup.id));
    this.destroyMissing(this.pickupViews, liveIds);

    for (const pickup of pickups) {
      let view = this.pickupViews.get(pickup.id);
      if (!view) {
        view = this.add.rectangle(0, 0, 10, 10, 0x58e6ef).setRotation(Math.PI / 4);
        view.setStrokeStyle(2, 0xffffff);
        view.setDepth(8);
        this.pickupViews.set(pickup.id, view);
      }
      view.setPosition(
        pickup.position.x * PIXELS_PER_METRE,
        pickup.position.y * PIXELS_PER_METRE,
      );
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
    children.push(this.add.rectangle(0, 0, 760, 330, 0x101722, 0.96).setStrokeStyle(3, 0x68e4e8));
    children.push(this.add.text(0, -125, "LEVEL UP — CHOOSE AN UPGRADE", {
      color: "#ffffff",
      fontFamily: "monospace",
      fontSize: "22px",
    }).setOrigin(0.5));

    choices.forEach((choice, index) => {
      const y = -60 + index * 86;
      const button = this.add.rectangle(0, y, 670, 66, 0x22334a)
        .setStrokeStyle(2, 0x4f6e8d)
        .setInteractive({ useHandCursor: true });
      const label = this.add.text(-310, y - 18, `${index + 1}. ${choice.name}\n${choice.description}`, {
        color: "#edf4ff",
        fontFamily: "monospace",
        fontSize: "15px",
        lineSpacing: 5,
      });
      button.on("pointerover", () => button.setFillStyle(0x315071));
      button.on("pointerout", () => button.setFillStyle(0x22334a));
      button.on("pointerdown", () => this.simulation.chooseUpgrade(choice.id));
      children.push(button, label);
    });

    this.upgradeOverlay = this.add.container(width / 2, height / 2, children).setDepth(100);
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
  return new URLSearchParams(window.location.search).get("art") === "marine";
}

function readMarineHelmetPreview(): boolean {
  return new URLSearchParams(window.location.search).get("helmet") !== "0";
}
