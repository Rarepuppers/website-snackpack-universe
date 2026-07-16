import Phaser from "phaser";
import { KeyboardMouseInput } from "../input/KeyboardMouseInput";
import {
  CombatSimulation,
  type CombatSnapshot,
  type EnemySnapshot,
  type ExperiencePickupSnapshot,
  type EnemyProjectileSnapshot,
  type GroundHazardSnapshot,
  type EliteRewardSnapshot,
  type CombatScenario,
  type ProjectileSnapshot,
  type CombatEvent,
  type PendingDecision,
  type PowerupPickupSnapshot,
  type PowerupType,
} from "../combat/CombatSimulation";
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
import { LocalSaveStore } from "../save/LocalSaveStore";
import { cueForEvent, EVASIVE_MOVE_CUE, UI_CONFIRM_CUE } from "../audio/AudioCueMap";
import { WebAudioSynth } from "../audio/WebAudioSynth";
import { worldDepth } from "../rendering/WorldDepth";
import { VisualEffectPool } from "../effects/VisualEffectPool";
import { CombatHud } from "../ui/CombatHud";
import {
  VERTICAL_SLICE_WEAPON_IDS,
  WEAPON_CATALOG,
  type WeaponId,
} from "../content/weaponCatalog";

const PIXELS_PER_METRE = 32;

type EnemyView =
  | Phaser.GameObjects.Arc
  | Phaser.GameObjects.Ellipse
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Triangle
  | Phaser.GameObjects.Sprite;
type WeaponView = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
type ProjectileView = Phaser.GameObjects.Arc | Phaser.GameObjects.Sprite;
type EnemyProjectileView = Phaser.GameObjects.Arc | Phaser.GameObjects.Sprite;
type HazardView = Phaser.GameObjects.Ellipse | Phaser.GameObjects.Sprite;
type TelegraphView = Phaser.GameObjects.Arc | Phaser.GameObjects.Sprite;
type PickupView = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
type EliteRewardView = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;

export class PrototypeScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private marineSprite: Phaser.GameObjects.Sprite | null = null;
  private marineHelmetSprite: Phaser.GameObjects.Sprite | null = null;
  private controls!: KeyboardMouseInput;
  private hud!: CombatHud;
  private effectPool!: VisualEffectPool;
  private readonly stressProfile = readStressProfile();
  private readonly scenario = readScenario();
  private readonly startingWeaponIds = this.stressProfile === null ? readStartingWeaponIds() : null;
  private readonly startingWeaponCount = this.stressProfile ?? this.startingWeaponIds?.length ?? readStartingWeaponCount();
  private readonly useMarineArt = readMarineArtPreview();
  private readonly useMarineHelmet = this.useMarineArt && readMarineHelmetPreview();
  private readonly showDebug = readDebugMode();
  private simulation = createSimulation(this.startingWeaponCount, this.stressProfile, this.startingWeaponIds, this.scenario);
  private readonly enemyViews = new Map<number, EnemyView>();
  private readonly projectileViews = new Map<number, ProjectileView>();
  private readonly enemyProjectileViews = new Map<number, EnemyProjectileView>();
  private readonly hazardViews = new Map<number, HazardView>();
  private readonly spitterTelegraphs = new Map<number, TelegraphView>();
  private readonly eliteArmorViews = new Map<number, Phaser.GameObjects.Triangle>();
  private readonly eliteRewardViews = new Map<number, EliteRewardView>();
  private readonly miniBossTelegraphs = new Map<number, Phaser.GameObjects.Graphics>();
  private readonly warpTelegraphs = new Map<number, TelegraphView>();
  private readonly pickupViews = new Map<number, PickupView>();
  private readonly powerupViews = new Map<number, PickupView>();
  private readonly weaponViews = new Map<number, WeaponView>();
  private decisionOverlay: Phaser.GameObjects.Container | null = null;
  private visibleDecisionKey = "";
  private isPaused = false;
  private lastAimAngle = 0;
  private marineFacingColumn = 0;
  private lastRollTrailMilliseconds = -1000;
  private lastSnapshot = this.simulation.snapshot();
  private fenceLine: Phaser.GameObjects.Line | Phaser.GameObjects.Image | null = null;
  private fenceSwitch: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite | null = null;
  private fencePrompt: Phaser.GameObjects.Text | null = null;
  private readonly saveStore = createSaveStore();
  private settings = applySettingOverrides(this.saveStore);
  private readonly synth = new WebAudioSynth(this.settings.soundEnabled);
  private runOutcomeRecorded = false;
  private previousHeroState = "idle";

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

    this.add.text(width / 2, height - 14, "WASD MOVE   •   MOUSE AIM / FIRE   •   SPACE ROLL   •   R ULTIMATE   •   E INTERACT   •   ESC PAUSE", {
      color: "#9fb3c8",
      fontFamily: "monospace",
      fontSize: "10px",
    }).setOrigin(0.5, 1).setDepth(2000);

    this.hud = new CombatHud(this, this.showDebug, this.useMarineArt);
    this.createFenceViews();

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

    if (intent.pausePressed && this.lastSnapshot.pendingDecision === null) {
      this.isPaused = !this.isPaused;
    }

    if (this.isPaused) {
      this.renderSnapshot(this.lastSnapshot, false);
      return;
    }

    const snapshot = this.simulation.step(intent, deltaSeconds);
    this.lastSnapshot = snapshot;
    this.recordRunOutcome(snapshot);
    this.updateMarineFrame(snapshot.heroState, intent.move);

    if (intent.aim.x !== 0 || intent.aim.y !== 0) {
      this.lastAimAngle = Math.atan2(intent.aim.y, intent.aim.x);
    }

    this.renderSnapshot(snapshot, intent.fireHeld);
    this.synth.beginFrame();
    this.playCombatEvents(snapshot.events);
    if (snapshot.heroState === "evading" && this.previousHeroState !== "evading") {
      this.synth.play(EVASIVE_MOVE_CUE);
    }
    this.previousHeroState = snapshot.heroState;
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
    this.syncEnemyProjectiles(snapshot.enemyProjectiles);
    this.syncGroundHazards(snapshot.groundHazards);
    this.syncSpitterTelegraphs(snapshot.enemies);
    this.syncEliteArmor(snapshot.enemies);
    this.syncEliteRewards(snapshot.eliteRewards);
    this.syncMiniBossTelegraphs(snapshot.enemies);
    this.syncWarpTelegraphs(snapshot.enemies);
    this.syncObstacleDamage(snapshot.damagedObstacleIds, snapshot.destroyedObstacleIds);
    this.syncPickups(snapshot.pickups);
    this.syncPowerups(snapshot.powerups);
    this.syncFence(snapshot);
    this.syncDecisionOverlay(snapshot.pendingDecision);
    this.hud.update(snapshot, this.isPaused, this.effectPool.activeCount);
    const marineTint = snapshot.playerSlowed ? 0xb9ef62 : 0xffffff;
    snapshot.playerSlowed ? this.marineSprite?.setTint(marineTint) : this.marineSprite?.clearTint();
    snapshot.playerSlowed ? this.marineHelmetSprite?.setTint(marineTint) : this.marineHelmetSprite?.clearTint();
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
    this.simulation = createSimulation(this.startingWeaponCount, this.stressProfile, this.startingWeaponIds, this.scenario);
    this.lastSnapshot = this.simulation.snapshot();
    this.isPaused = false;
    this.runOutcomeRecorded = false;
    this.previousHeroState = "idle";
    this.visibleDecisionKey = "";
    this.decisionOverlay?.destroy(true);
    this.decisionOverlay = null;

    for (const views of [
      this.enemyViews,
      this.projectileViews,
      this.enemyProjectileViews,
      this.hazardViews,
      this.spitterTelegraphs,
      this.eliteArmorViews,
      this.eliteRewardViews,
      this.miniBossTelegraphs,
      this.warpTelegraphs,
      this.pickupViews,
      this.powerupViews,
    ]) {
      for (const view of views.values()) {
        view.destroy();
      }
      views.clear();
    }

    this.renderSnapshot(this.lastSnapshot, false);
  }

  private recordRunOutcome(snapshot: CombatSnapshot): void {
    if (this.runOutcomeRecorded) {
      return;
    }
    if (snapshot.status === "victory" || snapshot.status === "defeat") {
      this.runOutcomeRecorded = true;
      if (snapshot.stressProfile === null && snapshot.scenario === null) {
        this.saveStore.recordRunEnd({
          victory: snapshot.status === "victory",
          waveReached: snapshot.waveNumber,
        });
      }
    }
  }

  private shakeCamera(durationMilliseconds: number, intensity: number): void {
    if (this.settings.screenShakeEnabled) {
      this.cameras.main.shake(durationMilliseconds, intensity);
    }
  }

  private playCombatEvents(events: readonly CombatEvent[]): void {
    for (const event of events) {
      const audioCue = cueForEvent(event.type);
      if (audioCue) {
        this.synth.play(audioCue);
      }
      switch (event.type) {
        case "weapon-fired":
          this.pulseWeapon(event.weaponInstanceId);
          this.emitAuthoredEffect(
            event.weaponId === "scattergun" ? 0 : event.weaponId === "arc-carbine" ? 5 : 5,
            event.position,
            90,
            0.48,
            0.9,
            Math.atan2(event.direction.y, event.direction.x),
            event.weaponId === "bastion-service-rifle" ? "combat-effects-v1" : "batch-b-effects-v1",
          );
          break;
        case "chain-arc":
          this.drawChainArc(event.from, event.to);
          break;
        case "enemy-hit":
          this.emitAuthoredEffect(7, event.position, 110, 0.55, 0.95);
          break;
        case "enemy-defeated":
          if (event.enemyType === "siege-crusher") {
            this.emitAuthoredEffect(19, event.position, 420, 0.8, 2.1, 0, "batch-b-effects-v1");
          } else if (event.enemyType === "blast-mite") {
            this.emitAuthoredEffect(16, event.position, 300, 0.65, 1.35, 0, "batch-c-effects-v1");
          } else if (event.enemyType === "warp-flanker") {
            this.emitAuthoredEffect(18, event.position, 260, 0.6, 1.2, 0, "batch-c-effects-v1");
          } else {
            this.emitAuthoredEffect(event.enemyType === "brain-blob" ? 18 : event.enemyType === "egg-cluster" ? 13 : 11, event.position, 210, 0.72, 1.2);
          }
          break;
        case "explosion":
          this.emitAuthoredEffect(9, event.position, 240, event.radiusMetres, event.radiusMetres * 1.5);
          break;
        case "player-hit":
          this.shakeCamera(120, 0.006);
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
          this.shakeCamera(90, 0.0025);
          break;
        case "projectile-blocked":
          this.emitAuthoredEffect(7, event.position, 130, 0.5, 0.95);
          break;
        case "slime-spit-windup":
          this.emitAuthoredEffect(12, event.target, 260, 0.65, 0.9, 0, "batch-b-effects-v1");
          break;
        case "slime-glob-fired":
          this.emitAuthoredEffect(10, event.position, 130, 0.35, 0.65, 0, "batch-b-effects-v1");
          break;
        case "slime-impact":
          this.emitAuthoredEffect(13, event.position, 260, 0.55, 1.05, 0, "batch-b-effects-v1");
          break;
        case "elite-armour-hit":
          this.emitAuthoredEffect(18, event.position, 150, 0.52, 0.95, 0, "batch-b-effects-v1");
          break;
        case "elite-reward-dropped":
          this.flashCircle(event.position, 20, 0xffd36b, 360, 2.2, true);
          break;
        case "elite-reward-collected":
          this.flashCircle(event.position, 24, 0xd696ff, 420, 2.8, true);
          break;
        case "mini-boss-sweep":
          this.emitAuthoredEffect(16, event.position, 320, event.radiusMetres * 0.5, event.radiusMetres, 0, "batch-b-effects-v1");
          break;
        case "mini-boss-shockwave":
          this.emitAuthoredEffect(17, event.position, 360, event.radiusMetres * 0.5, event.radiusMetres, 0, "batch-b-effects-v1");
          this.shakeCamera(150, 0.006);
          break;
        case "obstacle-damaged":
          this.effectPool.emitBurst(event.position.x * PIXELS_PER_METRE, event.position.y * PIXELS_PER_METRE, 0xffd36b, 5);
          break;
        case "obstacle-destroyed":
          this.effectPool.emitBurst(event.position.x * PIXELS_PER_METRE, event.position.y * PIXELS_PER_METRE, 0xff6654, 8);
          this.emitAuthoredEffect(17, event.position, 300, 0.55, 1.25, 0, "batch-b-effects-v1");
          this.shakeCamera(180, 0.008);
          break;
        case "mini-boss-reward-dropped":
          this.flashCircle(event.position, 30, 0xffd36b, 520, 3.2, true);
          break;
        case "status-applied":
          this.emitAuthoredEffect(statusEffectFrame(event.status), event.position, 320, 0.58, 1.12, 0, "batch-c-effects-v1");
          break;
        case "powerup-collected":
          this.emitAuthoredEffect(powerupRewardFrame(event.powerupType), event.position, 360, 0.6, 1.3, 0, "batch-c-rewards-v1");
          break;
        case "warp-arrival":
          this.emitAuthoredEffect(17, event.position, 280, 0.62, 1.2, 0, "batch-c-effects-v1");
          break;
        case "ultimate-fired":
          this.cameras.main.flash(140, 255, 214, 107);
          this.emitAuthoredEffect(10, event.position, 420, 0.7, 2.2, 0, "batch-c-effects-v1");
          this.emitAuthoredEffect(14, event.position, 460, 0.75, 2.4, 0, "batch-c-effects-v1");
          break;
        case "fence-activated":
          this.emitAuthoredEffect(9, event.from, 300, 0.55, 1.2, 0, "batch-c-effects-v1");
          this.emitAuthoredEffect(9, event.to, 300, 0.55, 1.2, 0, "batch-c-effects-v1");
          break;
      }
    }
  }

  private drawChainArc(from: { x: number; y: number }, to: { x: number; y: number }): void {
    const line = this.add.line(
      0,
      0,
      from.x * PIXELS_PER_METRE,
      from.y * PIXELS_PER_METRE,
      to.x * PIXELS_PER_METRE,
      to.y * PIXELS_PER_METRE,
      0x68e4e8,
      0.95,
    ).setOrigin(0).setLineWidth(3).setDepth(905);
    this.tweens.add({ targets: line, alpha: 0, duration: 130, onComplete: () => line.destroy() });
    this.emitAuthoredEffect(8, to, 150, 0.42, 0.8, 0, "batch-b-effects-v1");
  }

  private emitAuthoredEffect(
    frame: number,
    position: { x: number; y: number },
    duration: number,
    scale: number,
    targetScale: number,
    rotation = 0,
    texture: "combat-effects-v1" | "batch-b-effects-v1" | "batch-c-effects-v1" | "batch-c-rewards-v1" = "combat-effects-v1",
  ): void {
    if (!this.useMarineArt) {
      this.flashCircle(position, 8, 0x68e4e8, duration, targetScale);
      return;
    }
    this.effectPool.emitSprite({
      x: position.x * PIXELS_PER_METRE,
      y: position.y * PIXELS_PER_METRE,
      frame, duration, scale, targetScale, rotation, texture,
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
        const assetId = weaponAssetId(weapon.weaponId);
        view = this.useMarineArt
          ? this.add.image(0, 0, assetId)
            .setOrigin(GAME_ASSETS[assetId].pivot.x, GAME_ASSETS[assetId].pivot.y)
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
        view.setFillStyle(firing ? 0xffffff : weaponColor(weapon.weaponId));
      } else {
        if (firing) view.setTint(0xffffff);
        else view.clearTint();
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
    if (this.useMarineArt && enemy.eliteKind === "carapace-scuttler") {
      return createManifestSprite(this, "carapace-scuttler-v1");
    }
    switch (enemy.type) {
      case "blast-mite":
        if (this.useMarineArt) {
          return createManifestSprite(this, "blast-mite-v1");
        }
        return this.add.circle(0, 0, 11, 0xff8a3d).setStrokeStyle(3, 0x7a2f12);
      case "warp-flanker":
        if (this.useMarineArt) {
          return createManifestSprite(this, "warp-flanker-v1");
        }
        return this.add.triangle(0, 0, 0, -15, 13, 12, -13, 12, 0xd65cff)
          .setStrokeStyle(3, 0x4d1a66);
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
      case "slime-spitter":
        if (this.useMarineArt) {
          return createManifestSprite(this, "slime-spitter-v1");
        }
        return this.add.ellipse(0, 0, 44, 34, 0x7cab38).setStrokeStyle(3, 0xd9f36a);
      case "siege-crusher":
        if (this.useMarineArt) {
          return createManifestSprite(this, "siege-crusher-v1");
        }
        return this.add.rectangle(0, 0, 82, 62, 0x8b4937).setStrokeStyle(5, 0xffb15c);
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
      view.setScale(enemy.rank === "elite" && !enemy.eliteKind ? 1.3 : 1);
      view.setAlpha(enemy.type === "warp-flanker" && enemy.warpPhase === "warp-windup" ? 0.72 : 1);
      const status = enemy.statuses[0];
      if (enemy.type === "blast-mite" && enemy.mitePhase === "armed" && Math.floor(this.time.now / 80) % 2 === 0) {
        view.setTint(0xffffff);
      } else if (status) view.setTint(statusColor(status));
      else view.clearTint();
      return;
    }

    if (enemy.type === "blast-mite" && view instanceof Phaser.GameObjects.Arc) {
      const armed = enemy.mitePhase === "armed";
      view.setFillStyle(armed && Math.floor(this.time.now / 80) % 2 === 0 ? 0xffffff : 0xff8a3d);
      view.setScale(armed ? 1.25 : 1);
      view.setAlpha(1);
      return;
    }

    if (enemy.type === "warp-flanker") {
      view.setAlpha(enemy.warpPhase === "warp-windup" ? 0.3
        : enemy.warpPhase === "materialize" ? 0.65 : 1);
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
    if (enemy.type === "slime-spitter" && view instanceof Phaser.GameObjects.Ellipse) {
      const colors = { positioning: 0x7cab38, windup: 0xe7f36a, recover: 0x55752d } as const;
      view.setFillStyle(colors[enemy.spitterPhase ?? "positioning"]);
      view.setScale(enemy.spitterPhase === "windup" ? healthScale * 1.12 : healthScale);
    }
    if (enemy.type === "siege-crusher" && view instanceof Phaser.GameObjects.Rectangle) {
      const phaseColors: Record<string, number> = {
        entrance: 0x5c3d38,
        stalk: 0x8b4937,
        "charge-windup": 0xffc45e,
        charge: 0xff6b3d,
        "sweep-windup": 0xff9a72,
        sweep: 0xff4d47,
        recovery: 0x5a6672,
      };
      view.setFillStyle(phaseColors[enemy.siegeCrusherPhase ?? "stalk"] ?? 0x8b4937)
        .setRotation(Math.atan2(enemy.facingDirection.y, enemy.facingDirection.x))
        .setScale(enemy.siegeCrusherPhase === "charge-windup" ? healthScale * 1.08 : healthScale);
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
      case "blast-mite": {
        const facingColumn = cardinalFacingColumn(enemy.position, playerPosition);
        const row = enemy.mitePhase === "armed" ? 1 : 0;
        view.setFrame(row * 4 + facingColumn).setRotation(0);
        return;
      }
      case "warp-flanker": {
        const facingColumn = cardinalFacingColumn(enemy.position, playerPosition);
        const row = enemy.warpPhase === "warp-windup" ? 1 : enemy.warpPhase === "materialize" ? 2 : 0;
        view.setFrame(row * 4 + facingColumn).setRotation(0);
        return;
      }
      case "brain-blob":
        view.setFrame(brainBlobFrame(enemy.brainPhase ?? "drift"));
        view.setRotation(angleToward(enemy.position, playerPosition));
        return;
      case "slime-spitter": {
        const facingColumn = cardinalFacingColumn(enemy.position, playerPosition);
        const row = enemy.spitterPhase === "windup" ? 1 : enemy.spitterPhase === "recover" ? 2 : 0;
        view.setFrame(row * 4 + facingColumn).setRotation(0);
        return;
      }
      case "siege-crusher": {
        const target = {
          x: enemy.position.x + enemy.facingDirection.x,
          y: enemy.position.y + enemy.facingDirection.y,
        };
        const facingColumn = cardinalFacingColumn(enemy.position, target);
        const phase = enemy.siegeCrusherPhase ?? "stalk";
        const row = phase === "charge" || phase === "charge-windup"
          ? 1
          : phase === "sweep" || phase === "sweep-windup" ? 2 : 0;
        view.setFrame(row * 4 + facingColumn).setRotation(0);
        return;
      }
      default: {
        const facingTarget = enemy.eliteKind === "carapace-scuttler"
          ? {
            x: enemy.position.x + enemy.facingDirection.x,
            y: enemy.position.y + enemy.facingDirection.y,
          }
          : playerPosition;
        const facingColumn = cardinalFacingColumn(enemy.position, facingTarget);
        const row = enemy.eliteKind === "carapace-scuttler"
          ? enemy.carapacePhase === "windup" ? 1
            : enemy.carapacePhase === "charge" ? 2
              : enemy.carapacePhase === "recovery" ? 3 : 0
          : offsetGaitRow(this.time.now, enemy.id);
        view.setFrame(row * 4 + facingColumn);
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
        const authoredProjectile = projectile.weaponId === "scattergun"
          ? { texture: "batch-b-effects-v1", frame: 1 }
          : projectile.weaponId === "arc-carbine"
            ? { texture: "batch-b-effects-v1", frame: 6 }
            : { texture: "combat-effects-v1", frame: 6 };
        view = this.useMarineArt
          ? this.add.sprite(0, 0, authoredProjectile.texture, authoredProjectile.frame)
          : this.add.circle(0, 0, 4, 0xffd36b).setStrokeStyle(1, 0xffffff);
        view.setDepth(700);
        this.projectileViews.set(projectile.id, view);
      }
      view.setPosition(
        projectile.position.x * PIXELS_PER_METRE,
        projectile.position.y * PIXELS_PER_METRE,
      );
      view.setRotation(projectile.rotationRadians);
      if (view instanceof Phaser.GameObjects.Sprite) {
        view.setScale(projectile.weaponId === "scattergun" ? 0.24 : projectile.weaponId === "arc-carbine" ? 0.3 : 0.3);
        view.clearTint();
      } else {
        view.setFillStyle(weaponColor(projectile.weaponId));
      }
    }
  }

  private syncEnemyProjectiles(projectiles: readonly EnemyProjectileSnapshot[]): void {
    const liveIds = new Set(projectiles.map((projectile) => projectile.id));
    this.destroyMissing(this.enemyProjectileViews, liveIds);
    for (const projectile of projectiles) {
      let view = this.enemyProjectileViews.get(projectile.id);
      if (!view) {
        view = this.useMarineArt
          ? this.add.sprite(0, 0, "batch-b-effects-v1", 10).setScale(0.42).setDepth(710)
          : this.add.circle(0, 0, 9, 0xa9e34b).setStrokeStyle(3, 0xefff9a).setDepth(710);
        this.enemyProjectileViews.set(projectile.id, view);
      }
      view.setPosition(projectile.position.x * PIXELS_PER_METRE, projectile.position.y * PIXELS_PER_METRE)
        .setRotation(projectile.rotationRadians);
    }
  }

  private syncGroundHazards(hazards: readonly GroundHazardSnapshot[]): void {
    const liveIds = new Set(hazards.map((hazard) => hazard.id));
    this.destroyMissing(this.hazardViews, liveIds);
    for (const hazard of hazards) {
      let view = this.hazardViews.get(hazard.id);
      if (!view) {
        view = this.useMarineArt
          ? this.add.sprite(0, 0, "batch-b-effects-v1", 13).setDepth(45)
          : this.add.ellipse(0, 0, 1, 1, 0x86bd35, 0.55)
            .setStrokeStyle(3, 0xc9f164, 0.9).setDepth(45);
        this.hazardViews.set(hazard.id, view);
      }
      const diameter = hazard.radiusMetres * PIXELS_PER_METRE * 2;
      const lifetime = Math.max(0, hazard.remainingSeconds / hazard.durationSeconds);
      view.setPosition(hazard.position.x * PIXELS_PER_METRE, hazard.position.y * PIXELS_PER_METRE)
        .setDisplaySize(diameter * (0.72 + lifetime * 0.28), diameter * 0.62 * (0.72 + lifetime * 0.28))
        .setAlpha(0.22 + lifetime * 0.55);
      if (view instanceof Phaser.GameObjects.Sprite) view.setFrame(lifetime < 0.3 ? 14 : 13);
    }
  }

  private syncSpitterTelegraphs(enemies: readonly EnemySnapshot[]): void {
    const active = enemies.filter((enemy) => enemy.type === "slime-spitter" && enemy.spitterTarget);
    const liveIds = new Set(active.map((enemy) => enemy.id));
    this.destroyMissing(this.spitterTelegraphs, liveIds);
    for (const enemy of active) {
      let view = this.spitterTelegraphs.get(enemy.id);
      if (!view) {
        view = this.useMarineArt
          ? this.add.sprite(0, 0, "batch-b-effects-v1", 12).setScale(0.72).setDepth(60)
          : this.add.circle(0, 0, 18, 0x000000, 0).setStrokeStyle(3, 0xd9f36a, 0.9).setDepth(60);
        this.spitterTelegraphs.set(enemy.id, view);
      }
      view.setPosition(enemy.spitterTarget!.x * PIXELS_PER_METRE, enemy.spitterTarget!.y * PIXELS_PER_METRE)
        .setScale(0.85 + Math.sin(this.time.now / 70) * 0.12);
    }
  }

  private syncEliteArmor(enemies: readonly EnemySnapshot[]): void {
    const elites = this.useMarineArt ? [] : enemies.filter((enemy) => enemy.eliteKind === "carapace-scuttler");
    const liveIds = new Set(elites.map((enemy) => enemy.id));
    this.destroyMissing(this.eliteArmorViews, liveIds);
    for (const enemy of elites) {
      let view = this.eliteArmorViews.get(enemy.id);
      if (!view) {
        view = this.add.triangle(0, 0, 0, -14, 13, 11, -13, 11, 0xffd36b, 0.88)
          .setStrokeStyle(3, 0xfff1a8).setDepth(650);
        this.eliteArmorViews.set(enemy.id, view);
      }
      const angle = Math.atan2(enemy.facingDirection.y, enemy.facingDirection.x);
      view.setPosition(
        (enemy.position.x + enemy.facingDirection.x * 0.72) * PIXELS_PER_METRE,
        (enemy.position.y + enemy.facingDirection.y * 0.72) * PIXELS_PER_METRE,
      ).setRotation(angle + Math.PI / 2)
        .setAlpha(enemy.carapacePhase === "recovery" ? 0.22 : 0.9)
        .setScale(enemy.carapacePhase === "windup" ? 1.25 : 1);
    }
  }

  private syncEliteRewards(rewards: readonly EliteRewardSnapshot[]): void {
    const liveIds = new Set(rewards.map((reward) => reward.id));
    this.destroyMissing(this.eliteRewardViews, liveIds);
    for (const reward of rewards) {
      let view = this.eliteRewardViews.get(reward.id);
      if (!view) {
        view = this.useMarineArt
          ? this.add.sprite(0, 0, "pickups-v1", 3).setScale(0.72)
          : this.add.rectangle(0, 0, 18, 18, 0xd696ff).setRotation(Math.PI / 4)
            .setStrokeStyle(3, 0xffd36b);
        this.eliteRewardViews.set(reward.id, view);
      }
      view.setPosition(reward.position.x * PIXELS_PER_METRE, reward.position.y * PIXELS_PER_METRE)
        .setDepth(worldDepth(reward.position.y) - 2)
        .setScale((reward.type === "mini-boss-arsenal-cache" ? 0.86 : 0.68) + Math.sin(this.time.now / 120) * 0.08);
      if (view instanceof Phaser.GameObjects.Sprite) {
        view.setTint(reward.type === "mini-boss-arsenal-cache" ? 0xffd36b : 0xd696ff);
      }
    }
  }

  private syncMiniBossTelegraphs(enemies: readonly EnemySnapshot[]): void {
    const bosses = enemies.filter((enemy) => enemy.miniBossKind === "siege-crusher");
    const liveIds = new Set(bosses.map((enemy) => enemy.id));
    this.destroyMissing(this.miniBossTelegraphs, liveIds);
    for (const boss of bosses) {
      let view = this.miniBossTelegraphs.get(boss.id);
      if (!view) {
        view = this.add.graphics().setDepth(62);
        this.miniBossTelegraphs.set(boss.id, view);
      }
      view.clear();
      const x = boss.position.x * PIXELS_PER_METRE;
      const y = boss.position.y * PIXELS_PER_METRE;
      if (boss.siegeCrusherPhase === "charge-windup" && boss.siegeCrusherDirection) {
        view.lineStyle(5, 0xffc45e, 0.75);
        view.lineBetween(
          x,
          y,
          x + boss.siegeCrusherDirection.x * PIXELS_PER_METRE * 8,
          y + boss.siegeCrusherDirection.y * PIXELS_PER_METRE * 8,
        );
      } else if (boss.siegeCrusherPhase === "sweep-windup") {
        view.lineStyle(5, 0xff8a4c, 0.78);
        view.strokeCircle(x, y, 2.7 * PIXELS_PER_METRE);
      }
    }
  }

  private syncWarpTelegraphs(enemies: readonly EnemySnapshot[]): void {
    const active = enemies.filter((enemy) => enemy.warpPhase === "warp-windup" && enemy.warpTarget);
    const liveIds = new Set(active.map((enemy) => enemy.id));
    this.destroyMissing(this.warpTelegraphs, liveIds);
    for (const enemy of active) {
      let view = this.warpTelegraphs.get(enemy.id);
      if (!view) {
        view = this.add.circle(0, 0, 17, 0x000000, 0)
          .setStrokeStyle(3, 0xd65cff, 0.9).setDepth(61);
        this.warpTelegraphs.set(enemy.id, view);
      }
      view.setPosition(enemy.warpTarget!.x * PIXELS_PER_METRE, enemy.warpTarget!.y * PIXELS_PER_METRE)
        .setScale(0.8 + Math.sin(this.time.now / 60) * 0.15);
    }
  }

  private syncPowerups(powerups: readonly PowerupPickupSnapshot[]): void {
    const liveIds = new Set(powerups.map((powerup) => powerup.id));
    this.destroyMissing(this.powerupViews, liveIds);
    for (const powerup of powerups) {
      let view = this.powerupViews.get(powerup.id);
      if (!view) {
        view = this.add.rectangle(0, 0, 16, 16, powerupColor(powerup.type))
          .setRotation(Math.PI / 4).setStrokeStyle(2, 0xffffff);
        this.powerupViews.set(powerup.id, view);
      }
      view.setPosition(powerup.position.x * PIXELS_PER_METRE, powerup.position.y * PIXELS_PER_METRE)
        .setDepth(worldDepth(powerup.position.y) - 2)
        .setScale(1 + Math.sin(this.time.now / 140) * 0.12)
        .setAlpha(powerup.remainingSeconds < 3 && Math.floor(this.time.now / 160) % 2 === 0 ? 0.4 : 1);
    }
  }

  private syncObstacleDamage(damagedIds: readonly string[], destroyedIds: readonly string[]): void {
    const damaged = new Set(damagedIds);
    const destroyed = new Set(destroyedIds);
    for (const obstacle of this.simulation.arena.obstacles) {
      const view = this.children.getByName(`arena-obstacle:${obstacle.id}`);
      if (!(view instanceof Phaser.GameObjects.Sprite) && !(view instanceof Phaser.GameObjects.Rectangle)) continue;
      view.setVisible(!destroyed.has(obstacle.id));
      if (view instanceof Phaser.GameObjects.Sprite) {
        const current = Number(view.frame.name);
        const baseFrame = Number.isFinite(current) ? current % 4 : 0;
        view.setFrame(damaged.has(obstacle.id) ? baseFrame + 4 : baseFrame).setAlpha(1);
      } else if (view instanceof Phaser.GameObjects.Rectangle) {
        view.setAlpha(damaged.has(obstacle.id) ? 0.48 : 1);
      }
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

  /** Placeholder fence presentation: pylon rectangles, switch, energized line. */
  private createFenceViews(): void {
    const fence = this.simulation.arena.fence;
    if (!fence) {
      return;
    }
    for (const pylon of [fence.from, fence.to]) {
      this.add.rectangle(
        pylon.x * PIXELS_PER_METRE,
        pylon.y * PIXELS_PER_METRE,
        10,
        22,
        0x5a6672,
      ).setStrokeStyle(2, 0x9fb3c8).setDepth(worldDepth(pylon.y));
    }
    this.fenceSwitch = this.add.rectangle(
      fence.switchPosition.x * PIXELS_PER_METRE,
      fence.switchPosition.y * PIXELS_PER_METRE,
      16,
      16,
      0x3fae6a,
    ).setStrokeStyle(2, 0xe9e3cf).setDepth(worldDepth(fence.switchPosition.y));
    this.fenceLine = this.add.line(
      0,
      0,
      fence.from.x * PIXELS_PER_METRE,
      fence.from.y * PIXELS_PER_METRE,
      fence.to.x * PIXELS_PER_METRE,
      fence.to.y * PIXELS_PER_METRE,
      0x8fe8ff,
      0.95,
    ).setOrigin(0).setLineWidth(3).setDepth(640).setVisible(false);
    this.fencePrompt = this.add.text(
      fence.switchPosition.x * PIXELS_PER_METRE,
      fence.switchPosition.y * PIXELS_PER_METRE - 24,
      "E — ELECTRIC FENCE",
      { color: "#b8ffd9", fontFamily: "monospace", fontSize: "11px" },
    ).setOrigin(0.5).setDepth(1900).setVisible(false);
  }

  private syncFence(snapshot: CombatSnapshot): void {
    const fence = snapshot.fence;
    if (!fence || !this.fenceSwitch || !this.fenceLine || !this.fencePrompt) {
      return;
    }
    this.fenceSwitch.setFillStyle(fence.active ? 0xffd36b : fence.ready ? 0x3fae6a : 0x44505c);
    this.fenceLine.setVisible(fence.active);
    if (fence.active) {
      this.fenceLine.setAlpha(0.55 + Math.abs(Math.sin(this.time.now / 45)) * 0.45);
    }
    this.fencePrompt.setVisible(fence.ready && fence.playerNearSwitch && !fence.active);
  }

  private syncDecisionOverlay(decision: PendingDecision | null): void {
    const nextKey = decision
      ? `${decision.kind}|${decision.options.map((option) => option.id).join("|")}`
      : "";
    if (nextKey === this.visibleDecisionKey) {
      return;
    }

    this.decisionOverlay?.destroy(true);
    this.decisionOverlay = null;
    this.visibleDecisionKey = nextKey;

    if (!decision) {
      return;
    }

    const { width, height } = this.scale;
    const children: Phaser.GameObjects.GameObject[] = [];
    children.push(this.useMarineArt
      ? this.add.image(0, 0, "hud-panels-v1", 4).setDisplaySize(760, 330)
      : this.add.rectangle(0, 0, 760, 330, 0x101722, 0.96).setStrokeStyle(3, 0x68e4e8));
    children.push(this.add.text(0, -125, decision.title, {
      color: "#ffffff",
      fontFamily: "monospace",
      fontSize: "22px",
    }).setOrigin(0.5));

    decision.options.forEach((choice, index) => {
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
      button.on("pointerdown", () => {
        this.synth.play(UI_CONFIRM_CUE);
        this.simulation.chooseOption(choice.id);
      });
      children.push(button, label);
    });

    this.decisionOverlay = this.add.container(width / 2, height / 2, children).setDepth(2200);
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

function readStartingWeaponIds(): readonly WeaponId[] | null {
  const raw = new URLSearchParams(window.location.search).get("loadout")?.trim().toLowerCase();
  if (!raw) return null;
  if (raw === "vertical") return VERTICAL_SLICE_WEAPON_IDS;
  const ids = raw.split(",").map((value) => value.trim())
    .filter((value): value is WeaponId => value in WEAPON_CATALOG);
  return ids.length > 0 ? ids.slice(0, 12) : null;
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

function readScenario(): CombatScenario | null {
  const scenario = new URLSearchParams(window.location.search).get("scenario");
  return scenario === "slime-spitter" || scenario === "carapace-elite" || scenario === "siege-crusher"
    ? scenario
    : null;
}

function readDebugMode(): boolean {
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

function createSaveStore(): LocalSaveStore {
  try {
    return new LocalSaveStore(window.localStorage);
  } catch {
    return new LocalSaveStore(null);
  }
}

/**
 * `?shake=0|1` and `?sound=0|1` persist into local settings until a proper
 * settings screen exists; absent parameters leave stored values untouched.
 */
function applySettingOverrides(store: LocalSaveStore) {
  const params = new URLSearchParams(window.location.search);
  const overrides: { screenShakeEnabled?: boolean; soundEnabled?: boolean } = {};
  const shake = params.get("shake");
  if (shake === "0" || shake === "1") overrides.screenShakeEnabled = shake === "1";
  const sound = params.get("sound");
  if (sound === "0" || sound === "1") overrides.soundEnabled = sound === "1";
  return Object.keys(overrides).length > 0
    ? store.updateSettings(overrides).settings
    : store.load().settings;
}

function createSimulation(
  startingWeaponCount: number,
  stressProfile: 4 | 12 | null,
  startingWeaponIds: readonly WeaponId[] | null,
  scenario: CombatScenario | null,
): CombatSimulation {
  return new CombatSimulation({
    startingWeaponCount,
    startingWeaponIds: startingWeaponIds ?? undefined,
    stressProfile: stressProfile ?? undefined,
    scenario: scenario ?? undefined,
  });
}

function statusColor(status: string): number {
  switch (status) {
    case "blaze": return 0xff9a52;
    case "overload": return 0x9be8ff;
    case "freeze": return 0x9ad9ff;
    case "corrode": return 0xb9ef62;
    default: return 0xffffff;
  }
}

function powerupColor(type: PowerupType): number {
  switch (type) {
    case "overcharge": return 0xffa31a;
    case "aegis": return 0x68e4e8;
    case "adrenaline": return 0xff5f5f;
    case "magnet-pulse": return 0x8fb8ff;
  }
}

function weaponColor(weaponId: WeaponId): number {
  switch (weaponId) {
    case "scattergun": return 0xff9a72;
    case "arc-carbine": return 0x68e4e8;
    default: return 0xe9e3cf;
  }
}

function weaponAssetId(weaponId: WeaponId): "service-rifle-v1" | "scattergun-v1" | "arc-carbine-v1" {
  if (weaponId === "scattergun") return "scattergun-v1";
  if (weaponId === "arc-carbine") return "arc-carbine-v1";
  return "service-rifle-v1";
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
  assetId: "scuttler-v1" | "egg-cluster-v1" | "brain-blob-v1" | "slime-spitter-v1" | "carapace-scuttler-v1" | "siege-crusher-v1" | "blast-mite-v1" | "warp-flanker-v1",
): Phaser.GameObjects.Sprite {
  const sprite = scene.add.sprite(0, 0, assetId, 0);
  applyManifestOrigin(sprite, assetId);
  return sprite;
}
