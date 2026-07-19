import Phaser from "phaser";
import { KeyboardMouseInput } from "../input/KeyboardMouseInput";
import type { PlayerIntent } from "../input/PlayerIntent";
import {
  CombatSimulation,
  RAZOR_SCUTTLER_DASH_SECONDS,
  RAZOR_SCUTTLER_DASH_SPEED,
  type CombatSnapshot,
  type EnemySnapshot,
  type ExperiencePickupSnapshot,
  type EnemyProjectileSnapshot,
  type GroundHazardSnapshot,
  type EliteRewardSnapshot,
  type CombatScenario,
  type ProjectileSnapshot,
  type CombatEvent,
  type CombatTelegraphSnapshot,
  type PendingDecision,
  type PowerupPickupSnapshot,
  type SupplyChestSnapshot,
  type PowerupType,
} from "../combat/CombatSimulation";
import { offscreenWarningPosition } from "../combat/TelegraphRules";
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
import { arenaThemeById, arenaThemeVariant, pickArenaTheme } from "../rendering/arenaThemes";
import { uiTextResolution } from "../rendering/DisplayScaling";
import { LocalSaveStore } from "../save/LocalSaveStore";
import { cueForEvent, EVASIVE_MOVE_CUE, MEDKIT_HEAL_CUE, UI_CONFIRM_CUE } from "../audio/AudioCueMap";
import { WebAudioSynth } from "../audio/WebAudioSynth";
import { worldDepth } from "../rendering/WorldDepth";
import { VisualEffectPool } from "../effects/VisualEffectPool";
import { FloatingDamageNumbers } from "../rendering/FloatingDamageNumbers";
import { CombatHud } from "../ui/CombatHud";
import {
  VERTICAL_SLICE_WEAPON_IDS,
  WEAPON_CATALOG,
  type WeaponId,
} from "../content/weaponCatalog";
import { expeditionNodeById } from "../expedition/ExpeditionMap";
import {
  completeCurrentNode,
  resumeExpeditionRun,
  type ExpeditionBuildSnapshot,
  type ExpeditionRun,
} from "../expedition/ExpeditionRun";
import {
  expeditionEncounterForNode,
  type ExpeditionEncounterDescriptor,
} from "../expedition/ExpeditionEncounter";

const PIXELS_PER_METRE = 32;

type EnemyView =
  | Phaser.GameObjects.Arc
  | Phaser.GameObjects.Ellipse
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Triangle
  | Phaser.GameObjects.Sprite;
type WeaponView = Phaser.GameObjects.Rectangle | Phaser.GameObjects.Triangle | Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
type ProjectileView = Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
type EnemyProjectileView = Phaser.GameObjects.Arc | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite;
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
  private damageNumbers!: FloatingDamageNumbers;
  private readonly stressProfile = readStressProfile();
  private readonly scenario = readScenario();
  private readonly startingWeaponIds = this.stressProfile === null ? readStartingWeaponIds() : null;
  private readonly startingWeaponCount = this.stressProfile ?? this.startingWeaponIds?.length ?? readStartingWeaponCount();
  private readonly useMarineArt = readMarineArtPreview();
  private readonly useMarineHelmet = this.useMarineArt && readMarineHelmetPreview();
  private readonly showDebug = readDebugMode();
  private readonly uraniumLab = readUraniumLab();
  private readonly saveStore = createSaveStore();
  private readonly expeditionContext = readExpeditionContext(this.saveStore);
  private simulation = createSimulation(
    this.startingWeaponCount, this.stressProfile, this.startingWeaponIds, this.scenario, this.uraniumLab,
    this.expeditionContext,
  );
  private readonly enemyViews = new Map<number, EnemyView>();
  private readonly enemyStatusViews = new Map<string, Phaser.GameObjects.Sprite>();
  private readonly projectileViews = new Map<number, ProjectileView>();
  private readonly enemyProjectileViews = new Map<number, EnemyProjectileView>();
  private readonly hazardViews = new Map<number, HazardView>();
  private readonly spitterTelegraphs = new Map<number, TelegraphView>();
  private readonly eliteArmorViews = new Map<number, Phaser.GameObjects.Triangle>();
  private readonly eliteRewardViews = new Map<number, EliteRewardView>();
  private readonly miniBossTelegraphs = new Map<number, Phaser.GameObjects.Graphics>();
  private readonly combatTelegraphViews = new Map<string, Phaser.GameObjects.Graphics>();
  private readonly combatTelegraphArtViews = new Map<string, Phaser.GameObjects.Sprite>();
  private readonly ripperTelegraphs = new Map<number, Phaser.GameObjects.Graphics>();
  private readonly razorScuttlerTelegraphs = new Map<number, Phaser.GameObjects.Graphics>();
  private readonly quillbackTelegraphs = new Map<number, Phaser.GameObjects.Graphics>();
  private readonly spinewheelTelegraphs = new Map<number, Phaser.GameObjects.Graphics>();
  private readonly tetherBloomTelegraphs = new Map<number, Phaser.GameObjects.Graphics>();
  private readonly aurumExitMarkers = new Map<number, Phaser.GameObjects.Graphics>();
  private readonly spinewheelTrailTimes = new Map<number, number>();
  private readonly razorScuttlerTrailTimes = new Map<number, number>();
  private readonly aurumTrailTimes = new Map<number, number>();
  private readonly tetherBloomAccentTimes = new Map<number, number>();
  private readonly warpTelegraphs = new Map<number, TelegraphView>();
  private readonly pickupViews = new Map<number, PickupView>();
  private readonly powerupViews = new Map<number, PickupView>();
  private readonly supplyChestViews = new Map<number, Phaser.GameObjects.Container>();
  private readonly weaponViews = new Map<number, WeaponView>();
  private decisionOverlay: Phaser.GameObjects.Container | null = null;
  private decisionButtons: { rect: Phaser.GameObjects.Rectangle; choiceId: string; enabled: boolean }[] = [];
  private decisionSelectionIndex = 0;
  private menuStickReady = true;
  private menuKeys: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    confirm: Phaser.Input.Keyboard.Key;
    one: Phaser.Input.Keyboard.Key;
    two: Phaser.Input.Keyboard.Key;
    three: Phaser.Input.Keyboard.Key;
    four: Phaser.Input.Keyboard.Key;
    five: Phaser.Input.Keyboard.Key;
    six: Phaser.Input.Keyboard.Key;
    seven: Phaser.Input.Keyboard.Key;
    eight: Phaser.Input.Keyboard.Key;
    nine: Phaser.Input.Keyboard.Key;
  } | null = null;
  private visibleDecisionKey = "";
  private isPaused = false;
  private lastAimAngle = 0;
  private marineFacingColumn = 0;
  private lastRollTrailMilliseconds = -1000;
  private lastSnapshot = this.simulation.snapshot();
  private fenceLine: Phaser.GameObjects.Line | Phaser.GameObjects.Image | null = null;
  private fenceSwitch: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Sprite | null = null;
  private fencePrompt: Phaser.GameObjects.Text | null = null;
  private readonly arenaTheme = resolveArenaTheme();
  private settings = applySettingOverrides(this.saveStore);
  private readonly synth = new WebAudioSynth(this.settings.soundEnabled);
  private runOutcomeRecorded = false;
  private previousHeroState = "idle";
  /** Dex counts accumulated this wave, flushed on wave change and run end. */
  private readonly pendingBestiary = new Map<string, { seen: number; kills: number }>();
  private lastFlushedWaveNumber = 1;

  constructor() {
    super("prototype");
  }

  preload(): void {
    loadGameAssets(this);
  }

  create(): void {
    if (new URLSearchParams(window.location.search).get("expedition") === "1" && !this.expeditionContext) {
      window.location.href = "?screen=map";
      return;
    }
    const { width, height } = this.scale;
    renderArena(this, this.simulation.arena, PIXELS_PER_METRE, this.showDebug, this.useMarineArt, this.arenaTheme);
    this.effectPool = new VisualEffectPool(this, this.stressProfile === 12 ? 192 : 96);
    this.damageNumbers = new FloatingDamageNumbers(this);

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
    this.cameras.main
      .setBounds(
        0,
        0,
        this.simulation.arena.widthMetres * PIXELS_PER_METRE,
        this.simulation.arena.heightMetres * PIXELS_PER_METRE,
      )
      .startFollow(this.player, true, 0.12, 0.12)
      .setDeadzone(210, 130);

    this.add.text(18, height - 8, "WASD MOVE  •  MOUSE AIM / FIRE  •  ESC PAUSE", {
      color: "#9fb3c8",
      fontFamily: "monospace",
      fontSize: "10px",
    }).setOrigin(0, 1).setDepth(2000).setScrollFactor(0).setResolution(uiTextResolution());

    this.hud = new CombatHud(this, this.showDebug, this.useMarineArt, this.settings.cooldownTimersEnabled);
    this.createFenceViews();

    this.controls = new KeyboardMouseInput(this);
    // Separate Key instances from the combat adapter so menu navigation gets
    // its own JustDown edges without stealing the gameplay bindings.
    this.menuKeys = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      confirm: Phaser.Input.Keyboard.KeyCodes.ENTER,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      four: Phaser.Input.Keyboard.KeyCodes.FOUR,
      five: Phaser.Input.Keyboard.KeyCodes.FIVE,
      six: Phaser.Input.Keyboard.KeyCodes.SIX,
      seven: Phaser.Input.Keyboard.KeyCodes.SEVEN,
      eight: Phaser.Input.Keyboard.KeyCodes.EIGHT,
      nine: Phaser.Input.Keyboard.KeyCodes.NINE,
    }) as unknown as NonNullable<typeof this.menuKeys>;
    this.lastSnapshot = this.simulation.snapshot();
    this.renderSnapshot(this.lastSnapshot, false);
  }

  update(_time: number, deltaMilliseconds: number): void {
    const deltaSeconds = Math.min(deltaMilliseconds / 1000, 0.05);
    const intent = this.controls.read(this.player);

    if (this.lastSnapshot.pendingDecision) {
      this.handleDecisionNavigation(intent);
    }

    if (
      intent.restartPressed
      && (this.lastSnapshot.status === "victory" || this.lastSnapshot.status === "defeat")
    ) {
      if (this.expeditionContext) {
        window.location.href = this.lastSnapshot.status === "victory" ? "?screen=map" : "?screen=title";
        return;
      }
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
    this.collectBestiary(snapshot);
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
    this.syncEnemyStatusOverlays(snapshot.enemies);
    this.syncProjectiles(snapshot.projectiles);
    this.syncEnemyProjectiles(snapshot.enemyProjectiles);
    this.syncGroundHazards(snapshot.groundHazards);
    this.syncSpitterTelegraphs(snapshot.enemies);
    this.syncEliteArmor(snapshot.enemies);
    this.syncEliteRewards(snapshot.eliteRewards);
    this.syncMiniBossTelegraphs(snapshot.enemies);
    this.syncCombatTelegraphs(snapshot.combatTelegraphs);
    this.syncCombatTelegraphArt(snapshot.combatTelegraphs);
    this.syncRipperTelegraphs(snapshot.enemies);
    this.syncRazorScuttlerTelegraphs(snapshot.enemies);
    this.syncQuillbackTelegraphs(snapshot.enemies);
    this.syncSpinewheelTelegraphs(snapshot.enemies);
    this.syncTetherBloomTelegraphs(snapshot.enemies, snapshot.playerPosition);
    this.syncAurumExitMarkers(snapshot.enemies);
    this.syncWarpTelegraphs(snapshot.enemies);
    this.syncObstacleDamage(snapshot.damagedObstacleIds, snapshot.destroyedObstacleIds);
    this.syncPickups(snapshot.pickups);
    this.syncPowerups(snapshot.powerups);
    this.syncSupplyChests(snapshot.supplyChests);
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
    this.simulation = createSimulation(
      this.startingWeaponCount, this.stressProfile, this.startingWeaponIds, this.scenario, this.uraniumLab,
      this.expeditionContext,
    );
    this.flushBestiary();
    this.lastSnapshot = this.simulation.snapshot();
    this.isPaused = false;
    this.runOutcomeRecorded = false;
    this.previousHeroState = "idle";
    this.lastFlushedWaveNumber = 1;
    this.visibleDecisionKey = "";
    this.decisionOverlay?.destroy(true);
    this.decisionOverlay = null;

    for (const views of [
      this.enemyViews,
      this.enemyStatusViews,
      this.projectileViews,
      this.enemyProjectileViews,
      this.hazardViews,
      this.spitterTelegraphs,
      this.eliteArmorViews,
      this.eliteRewardViews,
      this.miniBossTelegraphs,
      this.ripperTelegraphs,
      this.razorScuttlerTelegraphs,
      this.quillbackTelegraphs,
      this.spinewheelTelegraphs,
      this.tetherBloomTelegraphs,
      this.aurumExitMarkers,
      this.warpTelegraphs,
      this.pickupViews,
      this.powerupViews,
    ]) {
      for (const view of views.values()) {
        view.destroy();
      }
      views.clear();
    }
    this.razorScuttlerTrailTimes.clear();
    this.spinewheelTrailTimes.clear();
    this.aurumTrailTimes.clear();
    this.tetherBloomAccentTimes.clear();

    this.renderSnapshot(this.lastSnapshot, false);
  }

  private recordRunOutcome(snapshot: CombatSnapshot): void {
    if (this.runOutcomeRecorded) {
      return;
    }
    if (snapshot.status === "victory" || snapshot.status === "defeat") {
      this.runOutcomeRecorded = true;
      if (this.expeditionContext) {
        this.resolveExpeditionOutcome(snapshot);
        this.flushBestiary();
        return;
      }
      if (this.isRecordableRun(snapshot)) {
        this.saveStore.recordRunEnd({
          victory: snapshot.status === "victory",
          waveReached: snapshot.waveNumber,
        });
      }
      this.flushBestiary();
    }
  }

  /** Lab and stress routes are review tools; they never touch player progress. */
  private isRecordableRun(snapshot: CombatSnapshot): boolean {
    return this.expeditionContext !== null
      || (snapshot.stressProfile === null && snapshot.scenario === null);
  }

  private resolveExpeditionOutcome(snapshot: CombatSnapshot): void {
    if (!this.expeditionContext) return;
    if (snapshot.status === "defeat") {
      this.saveStore.clearExpedition();
      this.saveStore.recordRunEnd({ victory: false, waveReached: this.expeditionContext.encounter.column + 1 });
      return;
    }
    const completed = completeCurrentNode(this.expeditionContext.run, expeditionBuildFromSnapshot(snapshot));
    this.saveStore.saveExpedition({
      mapSeed: completed.state.mapSeed,
      currentNodeId: completed.state.currentNodeId,
      clearedNodeIds: [...completed.state.clearedNodeIds],
      build: completed.state.build ? {
        ...completed.state.build,
        weapons: completed.state.build.weapons.map((weapon) => ({ ...weapon })),
        upgrades: completed.state.build.upgrades.map((upgrade) => ({ ...upgrade })),
      } : null,
    });
    if (completed.state.currentNodeId === completed.map.bossNodeId) {
      this.saveStore.recordRunEnd({ victory: true, waveReached: completed.map.columns });
    }
    window.setTimeout(() => { window.location.href = "?screen=map"; }, 900);
  }

  private collectBestiary(snapshot: CombatSnapshot): void {
    if (!this.isRecordableRun(snapshot)) {
      return;
    }
    for (const event of snapshot.events) {
      if (event.type !== "enemy-spawned" && event.type !== "enemy-defeated") {
        continue;
      }
      const entry = this.pendingBestiary.get(event.bestiaryKey) ?? { seen: 0, kills: 0 };
      if (event.type === "enemy-spawned") entry.seen += 1;
      else entry.kills += 1;
      this.pendingBestiary.set(event.bestiaryKey, entry);
    }
    // Flush once per wave rather than per kill: a busy wave produces hundreds
    // of events and localStorage writes are synchronous.
    if (snapshot.waveNumber !== this.lastFlushedWaveNumber) {
      this.lastFlushedWaveNumber = snapshot.waveNumber;
      this.flushBestiary();
    }
  }

  private flushBestiary(): void {
    if (this.pendingBestiary.size === 0) {
      return;
    }
    this.saveStore.recordBestiary(Object.fromEntries(this.pendingBestiary));
    this.pendingBestiary.clear();
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
          this.animateProductionWeapon(event.weaponInstanceId, event.weaponId);
          if (event.weaponId === "patrol-blade") {
            this.animatePatrolBlade(event.weaponInstanceId);
            this.drawPatrolBladeSweep(event.position, event.direction);
            break;
          }
          if (event.weaponId === "bolt-carbine") {
            this.emitAuthoredEffect(0, event.position, 110, 0.5, 0.92, Math.atan2(event.direction.y, event.direction.x), "bolt-carbine-effects-v1");
            break;
          }
          if (event.weaponId === "bulwark-rotary-cannon") {
            this.emitAuthoredEffect(2, event.position, 80, 0.45, 0.82, Math.atan2(event.direction.y, event.direction.x), "bulwark-rotary-effects-v1");
            break;
          }
          if (event.weaponId === "grenade-tube") break;
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
          if (this.settings.damageNumbersEnabled) {
            this.damageNumbers.report(
              event.enemyId,
              event.damage,
              event.damageType,
              event.position.x * PIXELS_PER_METRE,
              event.position.y * PIXELS_PER_METRE,
              this.time.now,
            );
          }
          break;
        case "bolt-impact":
          this.emitAuthoredEffect(
            event.hitIndex === 1 ? 3 : 5,
            event.position,
            event.hitIndex === 1 ? 150 : 210,
            event.hitIndex === 1 ? 0.65 : 0.82,
            event.hitIndex === 1 ? 1.25 : 1.65,
            0,
            "bolt-carbine-effects-v1",
          );
          break;
        case "projectile-impact":
          if (event.weaponId === "bulwark-rotary-cannon") {
            this.emitAuthoredEffect(4, event.position, 120, 0.48, 0.9, 0, "bulwark-rotary-effects-v1");
          }
          break;
        case "enemy-defeated":
          if (event.enemyType === "aurum-hoarder") {
            this.emitAuthoredEffect(6, event.position, 460, 0.75, 1.65, 0, "aurum-hoarder-effects-v1");
          } else if (event.enemyType === "siege-crusher") {
            this.emitAuthoredEffect(19, event.position, 420, 0.8, 2.1, 0, "batch-b-effects-v1");
          } else if (event.enemyType === "brood-warden") {
            this.emitAuthoredEffect(9, event.position, 460, 0.9, 2.3, 0, "brood-warden-effects-v1");
          } else if (event.enemyType === "rift-stalker") {
            this.emitAuthoredEffect(6, event.position, 520, 0.82, 2.15, 0, "rift-stalker-effects-v1");
            this.emitAuthoredEffect(7, event.position, 680, 0.7, 2.4, 0, "rift-stalker-effects-v1");
          } else if (event.enemyType === "blast-mite") {
            this.emitAuthoredEffect(16, event.position, 300, 0.65, 1.35, 0, "batch-c-effects-v1");
          } else if (event.enemyType === "warp-flanker") {
            this.emitAuthoredEffect(18, event.position, 260, 0.6, 1.2, 0, "batch-c-effects-v1");
          } else if (event.enemyType === "ripper") {
            this.emitAuthoredEffect(7, event.position, 340, 0.72, 1.5, 0, "ripper-effects-v1");
          } else if (event.enemyType === "razor-scuttler") {
            this.emitAuthoredEffect(7, event.position, 320, 0.72, 1.5, 0, "razor-scuttler-effects-v1");
          } else if (event.enemyType === "quillback") {
            this.emitAuthoredEffect(7, event.position, 360, 0.75, 1.55, 0, "quillback-effects-v1");
          } else if (event.enemyType === "spinewheel") {
            this.emitAuthoredEffect(7, event.position, 380, 0.78, 1.65, 0, "spinewheel-effects-v1");
          } else if (event.enemyType === "tether-bloom") {
            this.emitAuthoredEffect(7, event.position, 400, 0.82, 1.75, 0, "tether-bloom-effects-v1");
          } else if (event.enemyType === "bastion-eater") {
            this.emitAuthoredEffect(10, event.position, 760, 1.4, 3.2, 0, "bastion-eater-effects-v1");
          } else {
            this.emitAuthoredEffect(event.enemyType === "brain-blob" ? 18 : event.enemyType === "egg-cluster" ? 13 : 11, event.position, 210, 0.72, 1.2);
          }
          break;
        case "explosion":
          if (event.weaponId === "grenade-tube") {
            this.emitAuthoredEffect(5, event.position, 320, event.radiusMetres * 0.55, event.radiusMetres * 1.15, 0, "grenade-tube-effects-v1");
            this.shakeCamera(100, 0.004);
          } else {
            this.emitAuthoredEffect(9, event.position, 240, event.radiusMetres, event.radiusMetres * 1.5);
          }
          break;
        case "player-hit":
          this.shakeCamera(120, 0.006);
          this.emitAuthoredEffect(3, event.position, 180, 0.85, 1.4);
          break;
        case "player-healed":
          if (this.settings.damageNumbersEnabled) {
            this.damageNumbers.reportHealing(
              event.amount,
              event.position.x * PIXELS_PER_METRE,
              event.position.y * PIXELS_PER_METRE,
              this.time.now,
            );
          }
          break;
        case "xp-collected":
          this.emitAuthoredEffect(19, event.position, 130, 0.4, 0.8);
          break;
        case "level-up":
          this.cameras.main.flash(160, 104, 228, 232);
          this.emitAuthoredEffect(2, this.lastSnapshot.playerPosition, 420, 0.9, 2.2);
          break;
        case "enemy-spawned":
          if (event.enemyType === "ripper") {
            this.emitAuthoredEffect(5, event.position, 260, 0.72, 1.3, 0, "ripper-effects-v1");
          } else {
            this.emitAuthoredEffect(event.enemyType === "egg-cluster" ? 12 : event.enemyType === "scuttler" ? 10 : 19, event.position, 230, 0.65, 1.25);
          }
          break;
        case "egg-hatched":
          this.emitAuthoredEffect(14, event.position, 280, 0.9, 1.45);
          this.shakeCamera(90, 0.0025);
          break;
        case "projectile-blocked":
          if (event.weaponId === "bolt-carbine") {
            this.emitAuthoredEffect(6, event.position, 150, 0.58, 1.05, 0, "bolt-carbine-effects-v1");
          } else if (event.weaponId === "bulwark-rotary-cannon") {
            this.emitAuthoredEffect(5, event.position, 120, 0.48, 0.9, 0, "bulwark-rotary-effects-v1");
          } else if (event.weaponId === "grenade-tube") {
            this.emitAuthoredEffect(6, event.position, 180, 0.65, 1.15, 0, "grenade-tube-effects-v1");
          } else {
            this.emitAuthoredEffect(7, event.position, 130, 0.5, 0.95);
          }
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
        case "rain-of-spines-impact":
          this.emitAuthoredEffect(11, event.position, 190, 0.8, 1, 0, "telegraph-small-v1");
          break;
        case "brood-cleave":
          this.emitAuthoredEffect(5, event.position, 300, event.radiusMetres * 0.5, event.radiusMetres, 0, "brood-warden-effects-v1");
          break;
        case "brood-acid-volley":
          this.emitAuthoredEffect(1, event.position, 190, 0.5, 1.05, Math.atan2(event.target.y - event.position.y, event.target.x - event.position.x), "brood-warden-effects-v1");
          break;
        case "brood-acid-impact":
          this.emitAuthoredEffect(2, event.position, 190, 0.48, 1, 0, "brood-warden-effects-v1");
          break;
        case "brood-eggs-laid":
          this.emitAuthoredEffect(3, event.position, 270, 0.65, 1.45, 0, "brood-warden-effects-v1");
          break;
        case "brood-swarm-rush":
          this.emitAuthoredEffect(7, event.position, 350, 0.8, 1.9, 0, "brood-warden-effects-v1");
          this.shakeCamera(120, 0.004);
          break;
        case "rift-stalker-mark":
          this.emitAuthoredEffect(2, event.target, 520, 0.68, 1.5, 0, "rift-stalker-effects-v1");
          break;
        case "rift-stalker-warp-out":
          this.emitAuthoredEffect(0, event.position, 280, 0.72, 1.35, 0, "rift-stalker-effects-v1");
          this.emitAuthoredEffect(7, event.position, 460, 0.5, 1.2, 0, "rift-stalker-effects-v1");
          break;
        case "rift-stalker-pounce":
          this.emitAuthoredEffect(1, event.position, 170, 0.72, 1.28, 0, "rift-stalker-effects-v1");
          this.emitAuthoredEffect(3, event.position, 300, 0.78, event.radiusMetres * 0.88, 0, "rift-stalker-effects-v1");
          if (event.hitPlayer) this.shakeCamera(110, 0.005);
          break;
        case "rift-stalker-fan":
          this.emitAuthoredEffect(
            5, event.position, 300, 0.68, event.count === 5 ? 1.45 : 1.15,
            Math.atan2(event.direction.y, event.direction.x), "rift-stalker-effects-v1",
          );
          break;
        case "rift-stalker-slash":
          this.emitAuthoredEffect(
            4, event.position, 230, 0.9, event.reachMetres * 0.72,
            Math.atan2(event.direction.y, event.direction.x), "rift-stalker-effects-v1",
          );
          break;
        case "ripper-sweep":
          this.emitAuthoredEffect(
            2,
            event.position,
            240,
            1.05,
            1.28,
            Math.atan2(event.direction.y, event.direction.x),
            "ripper-effects-v1",
          );
          this.shakeCamera(90, 0.0035);
          break;
        case "quillback-windup":
          this.emitAuthoredEffect(
            1,
            event.position,
            260,
            0.52,
            0.85,
            Math.atan2(event.direction.y, event.direction.x),
            "quillback-effects-v1",
          );
          break;
        case "razor-scuttler-warning":
          this.emitAuthoredEffect(
            0, event.position, 300, 0.56, 0.92,
            Math.atan2(event.direction.y, event.direction.x), "razor-scuttler-effects-v1",
          );
          this.flashCircle(event.position, 12, 0xffd36b, 260, 1.5, true);
          break;
        case "razor-scuttler-dash":
          this.emitAuthoredEffect(
            1, event.position, 180, 0.62, 1.05,
            Math.atan2(event.direction.y, event.direction.x), "razor-scuttler-effects-v1",
          );
          break;
        case "razor-scuttler-impact":
          this.emitAuthoredEffect(
            event.reason === "player" ? 3 : event.reason === "cover" ? 4 : 5,
            event.position, event.reason === "cover" ? 280 : 220, 0.68, event.reason === "cover" ? 1.35 : 1.16,
            0, "razor-scuttler-effects-v1",
          );
          this.emitAuthoredEffect(6, event.position, 360, 0.5, 1.05, 0, "razor-scuttler-effects-v1");
          if (event.reason !== "miss") this.shakeCamera(80, 0.0035);
          break;
        case "quillback-volley":
          this.emitAuthoredEffect(
            event.count === 5 ? 3 : event.count === 3 ? 2 : 1,
            event.position,
            180,
            event.count === 5 ? 0.72 : 0.58,
            event.count === 5 ? 1.05 : 0.88,
            Math.atan2(event.direction.y, event.direction.x),
            "quillback-effects-v1",
          );
          break;
        case "quillback-spike-impact":
          this.emitAuthoredEffect(event.hitPlayer ? 5 : 4, event.position, 190, 0.48, 0.9, 0, "quillback-effects-v1");
          break;
        case "spinewheel-windup":
          this.emitAuthoredEffect(0, event.position, 260, 0.62, 1.05, 0, "spinewheel-effects-v1");
          break;
        case "spinewheel-bounce":
          this.emitAuthoredEffect(2, event.position, 180, 0.72, 1.2, Math.atan2(event.direction.y, event.direction.x), "spinewheel-effects-v1");
          this.emitAuthoredEffect(5, event.position, 210, 0.58, 1.05, 0, "spinewheel-effects-v1");
          this.shakeCamera(70, 0.0025);
          break;
        case "spinewheel-hit":
          this.emitAuthoredEffect(4, event.position, 210, 0.72, 1.2, 0, "spinewheel-effects-v1");
          this.shakeCamera(110, 0.005);
          break;
        case "spinewheel-recovery":
          this.emitAuthoredEffect(6, event.position, 320, 0.7, 1.35, 0, "spinewheel-effects-v1");
          break;
        case "tether-bloom-windup":
          this.emitAuthoredEffect(0, event.position, 340, 0.62, 1.3, 0, "tether-bloom-effects-v1");
          this.emitAuthoredEffect(1, event.target, 340, 0.52, 0.92, 0, "tether-bloom-effects-v1");
          break;
        case "tether-bloom-latched":
          this.emitAuthoredEffect(2, event.position, 300, 0.58, 1.08, 0, "tether-bloom-effects-v1");
          break;
        case "tether-bloom-broken":
          this.emitAuthoredEffect(
            event.reason === "damage" ? 5 : 4,
            event.position,
            260,
            0.68,
            1.28,
            0,
            "tether-bloom-effects-v1",
          );
          break;
        case "tether-bloom-released":
          this.emitAuthoredEffect(6, event.position, 340, 0.62, 1.18, 0, "tether-bloom-effects-v1");
          break;
        case "aurum-arrived":
          this.emitAuthoredEffect(0, event.position, 420, 0.65, 1.4, 0, "aurum-hoarder-effects-v1");
          this.flashCircle(event.position, 28, 0xffd36b, 520, 2.8, true);
          break;
        case "aurum-fleeing":
          this.emitAuthoredEffect(3, event.position, 260, 0.62, 1.25, 0, "aurum-hoarder-effects-v1");
          this.flashCircle(event.target, 34, 0x68e4e8, 620, 2.2, true);
          break;
        case "aurum-armour-broken":
          this.flashCircle(event.position, 22, 0xffd36b, 260, 1.9, true);
          this.emitAuthoredEffect(1, event.position, 260, 0.68, 1.35, 0, "aurum-hoarder-effects-v1");
          break;
        case "scrap-secured":
          this.emitAuthoredEffect(2, event.position, 220, 0.52, 1.05, 0, "aurum-hoarder-effects-v1");
          break;
        case "aurum-escaped":
          this.emitAuthoredEffect(5, event.position, 380, 0.65, 1.4, 0, "aurum-hoarder-effects-v1");
          this.flashCircle(event.position, 24, 0x68e4e8, 380, 2.1, true);
          break;
        case "aurum-supply-cache-dropped":
          this.emitAuthoredEffect(7, event.position, 520, 0.72, 1.5, 0, "aurum-hoarder-effects-v1");
          this.flashCircle(event.position, 30, 0xffd36b, 560, 3, true);
          break;
        case "bastion-eater-phase":
          this.emitAuthoredEffect(9, event.position, 520, 0.9, 1.8, 0, "bastion-eater-effects-v1");
          this.shakeCamera(180, 0.008);
          break;
        case "bastion-eater-claw-warning":
          this.emitAuthoredEffect(0, event.position, 520, 0.85, 1.5, Math.atan2(event.direction.y, event.direction.x), "bastion-eater-effects-v1");
          break;
        case "bastion-eater-claw-strike":
          this.emitAuthoredEffect(1, event.position, 300, 1, 1.7, Math.atan2(event.direction.y, event.direction.x), "bastion-eater-effects-v1");
          this.shakeCamera(130, 0.006);
          break;
        case "bastion-eater-charge":
          this.emitAuthoredEffect(2, event.position, 360, 0.9, 1.6, Math.atan2(event.direction.y, event.direction.x), "bastion-eater-effects-v1");
          break;
        case "bastion-eater-tendril":
          this.emitAuthoredEffect(event.warning ? 4 : 5, event.position, event.warning ? 520 : 340, 0.9, event.radiusMetres / 2.2, 0, "bastion-eater-effects-v1");
          break;
        case "bastion-eater-eggs":
          this.emitAuthoredEffect(6, event.position, 420, 0.9, 1.7, 0, "bastion-eater-effects-v1");
          break;
        case "bastion-eater-breach":
          this.emitAuthoredEffect(event.warning ? 0 : 3, event.position, event.warning ? 620 : 900, 0.65, event.radiusMetres / 0.8, 0, "bastion-eater-environment-v1");
          if (!event.warning) this.shakeCamera(220, 0.012);
          break;
        case "bastion-eater-vault":
          this.emitAuthoredEffect(6, event.position, 1800, 0.9, 1.5, 0, "bastion-eater-environment-v1");
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
          if (event.powerupType === "medkit") {
            this.synth.play(MEDKIT_HEAL_CUE);
            this.emitAuthoredEffect(2, event.position, 320, 0.5, 1.1, 0, "combat-effects-v1");
          } else {
            this.emitAuthoredEffect(powerupRewardFrame(event.powerupType), event.position, 360, 0.6, 1.3, 0, "batch-c-rewards-v1");
          }
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

  private drawPatrolBladeSweep(
    position: { x: number; y: number },
    direction: { x: number; y: number },
  ): void {
    const angle = Math.atan2(direction.y, direction.x);
    if (this.useMarineArt) {
      this.emitAuthoredEffect(1, position, 190, 0.82, 1.18, angle, "patrol-blade-effects-v1");
      return;
    }
    const x = position.x * PIXELS_PER_METRE;
    const y = position.y * PIXELS_PER_METRE;
    const sweep = this.add.graphics().setDepth(905);
    sweep.lineStyle(8, 0xffd08a, 0.92).beginPath()
      .arc(x, y, 62, angle - Math.PI * 0.36, angle + Math.PI * 0.36)
      .strokePath();
    sweep.lineStyle(2, 0x68e4e8, 0.9).beginPath()
      .arc(x, y, 54, angle - Math.PI * 0.34, angle + Math.PI * 0.34)
      .strokePath();
    this.tweens.add({
      targets: sweep,
      alpha: 0,
      duration: 180,
      ease: "Quad.easeOut",
      onComplete: () => sweep.destroy(),
    });
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
    texture: "combat-effects-v1" | "batch-b-effects-v1" | "batch-c-effects-v1" | "batch-c-rewards-v1" | "brood-warden-effects-v1" | "rift-stalker-effects-v1" | "ripper-effects-v1" | "razor-scuttler-effects-v1" | "quillback-effects-v1" | "spinewheel-effects-v1" | "tether-bloom-effects-v1" | "bastion-eater-effects-v1" | "bastion-eater-environment-v1" | "patrol-blade-effects-v1" | "bolt-carbine-effects-v1" | "bulwark-rotary-effects-v1" | "grenade-tube-effects-v1" | "aurum-hoarder-effects-v1" | "telegraph-small-v1" = "combat-effects-v1",
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
        view = weapon.weaponId === "patrol-blade" && this.useMarineArt
          ? this.add.sprite(0, 0, "patrol-blade-v1", 1).setDisplaySize(58, 58)
          : weapon.weaponId === "patrol-blade"
            ? this.add.triangle(0, 0, -18, -5, 18, 0, -18, 5, 0xffd08a)
              .setOrigin(0.2, 0.5).setStrokeStyle(2, 0x4f2f20)
          : this.useMarineArt && isProductionWeaponSheet(weapon.weaponId)
          ? this.add.sprite(0, 0, assetId, 1).setDisplaySize(66, 66)
            .setOrigin(GAME_ASSETS[assetId].pivot.x, GAME_ASSETS[assetId].pivot.y)
          : this.useMarineArt
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
      } else if (view instanceof Phaser.GameObjects.Triangle) {
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

  private animatePatrolBlade(instanceId: number): void {
    const weapon = this.weaponViews.get(instanceId);
    if (!(weapon instanceof Phaser.GameObjects.Sprite) || weapon.texture.key !== "patrol-blade-v1") return;
    weapon.setFrame(2);
    this.time.delayedCall(90, () => {
      if (weapon.active) weapon.setFrame(3);
    });
    this.time.delayedCall(190, () => {
      if (weapon.active) weapon.setFrame(1);
    });
  }

  private animateProductionWeapon(instanceId: number, weaponId: WeaponId): void {
    if (!isProductionWeaponSheet(weaponId)) return;
    const weapon = this.weaponViews.get(instanceId);
    if (!(weapon instanceof Phaser.GameObjects.Sprite)) return;
    weapon.setFrame(2);
    const recoverDelay = weaponId === "grenade-tube" ? 150 : weaponId === "bolt-carbine" ? 110 : 55;
    const readyDelay = weaponId === "grenade-tube" ? 520 : weaponId === "bolt-carbine" ? 300 : 120;
    this.time.delayedCall(recoverDelay, () => {
      if (weapon.active) weapon.setFrame(3);
    });
    this.time.delayedCall(readyDelay, () => {
      if (weapon.active) weapon.setFrame(1);
    });
  }

  private syncEnemies(
    enemies: readonly EnemySnapshot[],
    playerPosition: { x: number; y: number },
  ): void {
    const liveIds = new Set(enemies.map((enemy) => enemy.id));
    this.destroyMissing(this.enemyViews, liveIds);
    for (const id of this.spinewheelTrailTimes.keys()) {
      if (!liveIds.has(id)) this.spinewheelTrailTimes.delete(id);
    }
    for (const id of this.razorScuttlerTrailTimes.keys()) {
      if (!liveIds.has(id)) this.razorScuttlerTrailTimes.delete(id);
    }
    for (const id of this.aurumTrailTimes.keys()) {
      if (!liveIds.has(id)) this.aurumTrailTimes.delete(id);
    }
    for (const id of this.tetherBloomAccentTimes.keys()) {
      if (!liveIds.has(id)) this.tetherBloomAccentTimes.delete(id);
    }

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
    if (this.useMarineArt && enemy.type === "swarm-scuttler") {
      return createManifestSprite(this, "swarm-scuttler-v1");
    }
    if (this.useMarineArt && enemy.eliteKind === "razorlord") {
      return createManifestSprite(this, "razorlord-v1");
    }
    if (this.useMarineArt && enemy.eliteKind === "blightspitter") {
      return createManifestSprite(this, "blightspitter-v1");
    }
    if (this.useMarineArt && enemy.eliteKind === "quillback-matriarch") {
      return createManifestSprite(this, "quillback-matriarch-v1");
    }
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
      case "ripper":
        if (this.useMarineArt) {
          return createManifestSprite(this, "ripper-v1");
        }
        return this.add.triangle(0, 0, -28, -18, 30, 0, -28, 18, 0xc9475f)
          .setStrokeStyle(4, 0xffc27a);
      case "razor-scuttler":
        if (this.useMarineArt) {
          return createManifestSprite(this, "razor-scuttler-v1");
        }
        return this.add.triangle(0, 0, 24, 0, -16, -11, -16, 11, 0xd93652)
          .setStrokeStyle(3, 0xffd5aa);
      case "quillback":
        if (this.useMarineArt) {
          return createManifestSprite(this, "quillback-v1");
        }
        return this.add.triangle(0, 0, -24, -20, 30, 0, -24, 20, 0x6d3645)
          .setStrokeStyle(5, 0xffc45e);
      case "spinewheel":
        if (this.useMarineArt) {
          return createManifestSprite(this, "spinewheel-v1");
        }
        return this.add.triangle(0, 0, 0, -23, 21, 17, -21, 17, 0x8f4a4e)
          .setStrokeStyle(5, 0xffa14f);
      case "tether-bloom":
        if (this.useMarineArt) {
          return createManifestSprite(this, "tether-bloom-v1");
        }
        return this.add.ellipse(0, 0, 46, 56, 0x536c38)
          .setStrokeStyle(5, 0xc4e66a);
      case "aurum-hoarder":
        if (this.useMarineArt) {
          return createManifestSprite(this, "aurum-hoarder-v1");
        }
        return this.add.ellipse(0, 0, 58, 44, 0xb7862f)
          .setStrokeStyle(5, 0x68e4e8);
      case "bastion-eater":
        if (this.useMarineArt) {
          return createManifestSprite(this, "bastion-eater-v1");
        }
        return this.add.ellipse(0, 0, 132, 104, 0x273153).setStrokeStyle(7, 0xc99248);
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
      case "brood-warden":
        if (this.useMarineArt) {
          return createManifestSprite(this, "brood-warden-v1");
        }
        return this.add.ellipse(0, 0, 76, 58, 0x68408b).setStrokeStyle(5, 0xb9f35b);
      case "rift-stalker":
        if (this.useMarineArt) {
          return createManifestSprite(this, "rift-stalker-v1");
        }
        return this.add.ellipse(0, 0, 66, 50, 0x2c2f3d).setStrokeStyle(5, 0x9a6cff);
      default:
        if (this.useMarineArt) {
          return createManifestSprite(this, "scuttler-v1");
        }
        return this.add.triangle(0, 0, 0, -17, 15, 13, -15, 13, 0xff6654)
          .setStrokeStyle(3, 0x6f1d24);
    }
  }

  private syncEnemyStatusOverlays(enemies: readonly EnemySnapshot[]): void {
    const activeKeys = new Set<string>();
    if (!this.useMarineArt) {
      this.destroyMissing(this.enemyStatusViews, activeKeys);
      return;
    }

    for (const enemy of enemies) {
      enemy.statuses.forEach((status, layer) => {
        const key = `${enemy.id}:${status}`;
        activeKeys.add(key);
        let overlay = this.enemyStatusViews.get(key);
        if (!overlay) {
          overlay = createManifestSprite(this, "status-overlays-v1").setAlpha(0.94);
          this.enemyStatusViews.set(key, overlay);
        }
        overlay
          .setFrame(statusOverlayFrame(status, this.time.now))
          .setPosition(enemy.position.x * PIXELS_PER_METRE, enemy.position.y * PIXELS_PER_METRE)
          .setDepth(worldDepth(enemy.position.y) + 0.4 + layer * 0.02)
          .setScale(Math.min(3.4, Math.max(0.88, enemy.radiusMetres * 1.8)));
      });
    }
    this.destroyMissing(this.enemyStatusViews, activeKeys);
  }

  private styleEnemyView(view: EnemyView, enemy: EnemySnapshot): void {
    if (view instanceof Phaser.GameObjects.Sprite) {
      const batchJScale = view.texture.key === "quillback-matriarch-v1" ? 0.9
        : view.texture.key === "blightspitter-v1" ? 1.05
          : view.texture.key === "razorlord-v1" ? 1 : null;
      const eliteScale = enemy.eliteKind === "quillback-matriarch" ? 1.35 : enemy.eliteKind ? 1.18 : 1;
      view.setScale(batchJScale ?? (enemy.type === "rift-stalker" ? 1.08 : enemy.type === "aurum-hoarder" ? 0.9 : enemy.type === "swarm-scuttler" ? 0.72 : eliteScale));
      view.setAlpha(enemy.type === "rift-stalker"
        ? enemy.riftStalkerPhase === "warp" ? 0.12 : enemy.riftStalkerPhase === "cloak" ? 0.38 : 1
        : enemy.type === "warp-flanker" && enemy.warpPhase === "warp-windup" ? 0.72 : 1);
      const status = enemy.statuses[0];
      if (enemy.type === "blast-mite" && enemy.mitePhase === "armed" && Math.floor(this.time.now / 80) % 2 === 0) {
        view.setTint(0xffffff);
      } else if (status) view.setTint(statusColor(status));
      else if (enemy.eliteKind === "razorlord" && view.texture.key !== "razorlord-v1") view.setTint(0xd696ff);
      else if (enemy.eliteKind === "blightspitter" && view.texture.key !== "blightspitter-v1") view.setTint(0xb9f35b);
      else if (enemy.eliteKind === "quillback-matriarch" && view.texture.key !== "quillback-matriarch-v1") view.setTint(0xff9a72);
      else if (enemy.type === "swarm-scuttler" && view.texture.key !== "swarm-scuttler-v1") view.setTint(0xffd36b);
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
    if (enemy.type === "ripper" && view instanceof Phaser.GameObjects.Triangle) {
      const phaseColors = {
        pursuit: 0xc9475f,
        windup: 0xffc45e,
        sweep: 0xff5a42,
        recovery: 0x6f5260,
      } as const;
      view.setFillStyle(phaseColors[enemy.ripperPhase ?? "pursuit"])
        .setRotation(Math.atan2(enemy.facingDirection.y, enemy.facingDirection.x))
        .setScale(enemy.ripperPhase === "windup" ? 1.12 : enemy.ripperPhase === "recovery" ? 0.9 : 1);
      return;
    }
    if (enemy.type === "razor-scuttler" && view instanceof Phaser.GameObjects.Triangle) {
      const phase = enemy.razorScuttlerPhase ?? "pursuit";
      const colors = { pursuit: 0xd93652, windup: 0xffd36b, dash: 0xff4b31, recovery: 0x59606d } as const;
      const direction = phase === "pursuit"
        ? enemy.facingDirection
        : enemy.razorScuttlerDirection ?? enemy.facingDirection;
      view.setFillStyle(colors[phase])
        .setRotation(Math.atan2(direction.y, direction.x))
        .setScale((phase === "windup" ? 1.18 : phase === "recovery" ? 0.82 : 1) * (enemy.eliteKind ? 1.18 : 1))
        .setAlpha(phase === "recovery" ? 0.78 : 1);
      return;
    }
    if (enemy.type === "quillback" && view instanceof Phaser.GameObjects.Triangle) {
      const phaseColors = { positioning: 0x6d3645, windup: 0xff9a52, launch: 0xff6b3d, recover: 0x514552 } as const;
      const direction = enemy.quillbackDirection ?? enemy.facingDirection;
      view.setFillStyle(phaseColors[enemy.quillbackPhase ?? "positioning"])
        .setRotation(Math.atan2(direction.y, direction.x))
        .setScale((enemy.quillbackPhase === "windup" ? 1.18 : enemy.quillbackPhase === "recover" ? 0.92 : 1)
          * (enemy.eliteKind === "quillback-matriarch" ? 1.35 : 1));
      return;
    }
    if (enemy.type === "spinewheel" && view instanceof Phaser.GameObjects.Triangle) {
      const phase = enemy.spinewheelPhase ?? "positioning";
      const phaseColors = {
        positioning: 0x8f4a4e,
        windup: 0xffc45e,
        rolling: 0xff6b3d,
        recovery: 0x526876,
      } as const;
      const direction = enemy.spinewheelDirection ?? enemy.facingDirection;
      const rollingRotation = this.time.now / 75;
      view.setFillStyle(phaseColors[phase])
        .setStrokeStyle(5, phase === "recovery" ? 0x68e4e8 : 0xffa14f)
        .setRotation(phase === "rolling" ? rollingRotation : Math.atan2(direction.y, direction.x) + Math.PI / 2)
        .setScale(phase === "windup" ? 1.16 : phase === "recovery" ? 0.86 : 1)
        .setAlpha(phase === "recovery" ? 0.82 : 1);
      return;
    }
    if (enemy.type === "tether-bloom" && view instanceof Phaser.GameObjects.Ellipse) {
      const phase = enemy.tetherBloomPhase ?? "idle";
      const phaseColors = {
        idle: 0x536c38,
        windup: 0xa6c94a,
        tethering: 0x7f4ca5,
        recovery: 0x465052,
      } as const;
      view.setFillStyle(phaseColors[phase])
        .setStrokeStyle(5, phase === "tethering" ? 0xd696ff : phase === "windup" ? 0xe7f58a : 0x91ad55)
        .setScale(phase === "windup" ? 1.12 : phase === "recovery" ? 0.86 : 1)
        .setAlpha(phase === "recovery" ? 0.72 : 1);
      return;
    }
    if (enemy.type === "aurum-hoarder" && view instanceof Phaser.GameObjects.Ellipse) {
      const fleeing = enemy.aurumPhase === "flee";
      const pulse = 1 + Math.sin(this.time.now / (fleeing ? 70 : 130)) * (fleeing ? 0.1 : 0.04);
      view.setFillStyle(fleeing ? 0xe1a63a : 0xb7862f)
        .setStrokeStyle(5, fleeing ? 0xffef9c : 0x68e4e8)
        .setRotation(Math.atan2(enemy.facingDirection.y, enemy.facingDirection.x))
        .setScale(pulse);
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
      view.setScale((enemy.spitterPhase === "windup" ? healthScale * 1.12 : healthScale)
        * (enemy.eliteKind === "blightspitter" ? 1.18 : 1));
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
    if (enemy.type === "brood-warden" && view instanceof Phaser.GameObjects.Ellipse) {
      const phase = enemy.broodWardenPhase ?? "stalk";
      const warning = phase.endsWith("windup") || phase === "swarm-rush";
      view.setFillStyle(warning ? 0xd95c78 : phase === "recovery" ? 0x554767 : 0x68408b)
        .setStrokeStyle(5, warning ? 0xffd36b : 0xb9f35b)
        .setRotation(Math.atan2(enemy.facingDirection.y, enemy.facingDirection.x))
        .setScale(warning ? healthScale * 1.08 : healthScale);
    }
    if (enemy.type === "rift-stalker" && view instanceof Phaser.GameObjects.Ellipse) {
      const phase = enemy.riftStalkerPhase ?? "cloak";
      const cloaked = phase === "cloak" || phase === "warp";
      const warning = phase === "mark" || phase === "slash-windup";
      view.setFillStyle(warning ? 0x6d3a8f : phase === "recovery" ? 0x3a3f52 : 0x2c2f3d)
        .setStrokeStyle(5, warning ? 0xd696ff : 0x9a6cff)
        .setRotation(Math.atan2(enemy.facingDirection.y, enemy.facingDirection.x))
        .setScale(phase === "pounce" || phase === "slash" ? healthScale * 1.12 : healthScale)
        .setAlpha(phase === "warp" ? 0.12 : cloaked ? 0.38 : 1);
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
      case "ripper": {
        const direction = enemy.ripperPhase === "pursuit"
          ? enemy.facingDirection
          : enemy.ripperDirection ?? enemy.facingDirection;
        const target = {
          x: enemy.position.x + direction.x,
          y: enemy.position.y + direction.y,
        };
        const facingColumn = cardinalFacingColumn(enemy.position, target);
        const phase = enemy.ripperPhase ?? "pursuit";
        const row = phase === "windup" ? 1 : phase === "sweep" ? 2 : phase === "recovery" ? 3 : 0;
        view.setFrame(row * 4 + facingColumn).setRotation(0);
        return;
      }
      case "razor-scuttler": {
        const phase = enemy.razorScuttlerPhase ?? "pursuit";
        const direction = phase === "pursuit"
          ? enemy.facingDirection
          : enemy.razorScuttlerDirection ?? enemy.facingDirection;
        const target = { x: enemy.position.x + direction.x, y: enemy.position.y + direction.y };
        const facingColumn = cardinalFacingColumn(enemy.position, target);
        const row = phase === "windup" ? 1 : phase === "dash" ? 2 : phase === "recovery" ? 3 : 0;
        if (enemy.eliteKind === "razorlord") {
          const beat = (Math.floor(this.time.now / 115) + enemy.id) % 4;
          view.setTexture("razorlord-v1")
            .setFrame(row * 4 + beat)
            .setRotation(Math.atan2(direction.y, direction.x));
        } else {
          view.setTexture("razor-scuttler-v1").setFrame(row * 4 + facingColumn).setRotation(0);
        }
        if (phase === "dash") {
          const previousTrail = this.razorScuttlerTrailTimes.get(enemy.id) ?? -1000;
          if (this.time.now - previousTrail >= 85) {
            this.razorScuttlerTrailTimes.set(enemy.id, this.time.now);
            this.emitAuthoredEffect(
              2, enemy.position, 130, 0.5, 0.82,
              Math.atan2(direction.y, direction.x), "razor-scuttler-effects-v1",
            );
          }
        }
        return;
      }
      case "aurum-hoarder": {
        const direction = enemy.facingDirection;
        const target = { x: enemy.position.x + direction.x, y: enemy.position.y + direction.y };
        const facingColumn = cardinalFacingColumn(enemy.position, target);
        const row = enemy.aurumPhase === "flee" ? 2 : (enemy.aurumArmourBreaksPaid ?? 0) > 0 ? 1 : 0;
        view.setTexture("aurum-hoarder-v1").setFrame(row * 4 + facingColumn).setRotation(0);
        if (enemy.aurumPhase === "flee") {
          const previousTrail = this.aurumTrailTimes.get(enemy.id) ?? -1000;
          if (this.time.now - previousTrail >= 115) {
            this.aurumTrailTimes.set(enemy.id, this.time.now);
            this.emitAuthoredEffect(
              4, enemy.position, 150, 0.55, 0.9,
              Math.atan2(direction.y, direction.x), "aurum-hoarder-effects-v1",
            );
          }
        }
        return;
      }
      case "quillback": {
        const direction = enemy.quillbackPhase === "positioning"
          ? enemy.facingDirection
          : enemy.quillbackDirection ?? enemy.facingDirection;
        const target = {
          x: enemy.position.x + direction.x,
          y: enemy.position.y + direction.y,
        };
        const facingColumn = cardinalFacingColumn(enemy.position, target);
        const phase = enemy.quillbackPhase ?? "positioning";
        if (enemy.eliteKind === "quillback-matriarch") {
          const row = phase === "windup" ? 1 : phase === "launch" ? 2 : phase === "recover" ? 3 : 0;
          const beat = (Math.floor(this.time.now / 130) + enemy.id) % 4;
          view.setTexture("quillback-matriarch-v1")
            .setFrame(row * 4 + beat)
            .setRotation(Math.atan2(direction.y, direction.x));
        } else {
          const row = phase === "windup" || phase === "launch" ? 1 : phase === "recover" ? 2 : 0;
          view.setFrame(row * 4 + facingColumn).setRotation(0);
        }
        return;
      }
      case "spinewheel": {
        const phase = enemy.spinewheelPhase ?? "positioning";
        if (phase === "rolling") {
          view.setTexture("spinewheel-shell-v1")
            .setFrame(Math.floor(this.time.now / 80) % 4)
            .setRotation(0);
          const previousTrail = this.spinewheelTrailTimes.get(enemy.id) ?? -1000;
          if (this.time.now - previousTrail >= 110) {
            this.spinewheelTrailTimes.set(enemy.id, this.time.now);
            this.emitAuthoredEffect(
              1,
              enemy.position,
              150,
              0.48,
              0.85,
              Math.atan2(enemy.spinewheelDirection?.y ?? 0, enemy.spinewheelDirection?.x ?? 1),
              "spinewheel-effects-v1",
            );
          }
          return;
        }
        view.setTexture("spinewheel-v1");
        const direction = phase === "positioning"
          ? enemy.facingDirection
          : enemy.spinewheelDirection ?? enemy.facingDirection;
        const target = { x: enemy.position.x + direction.x, y: enemy.position.y + direction.y };
        const facingColumn = cardinalFacingColumn(enemy.position, target);
        const row = phase === "windup" ? 1 : phase === "recovery" ? 2 : 0;
        view.setFrame(row * 4 + facingColumn).setRotation(0);
        return;
      }
      case "tether-bloom": {
        const phase = enemy.tetherBloomPhase ?? "idle";
        const row = phase === "windup" ? 1 : phase === "tethering" ? 2 : phase === "recovery" ? 3 : 0;
        const animationPhase = (Math.floor(this.time.now / 145) + enemy.id) % 4;
        view.setTexture("tether-bloom-v1").setFrame(row * 4 + animationPhase).setRotation(0);
        if (phase === "tethering") {
          const previousAccent = this.tetherBloomAccentTimes.get(enemy.id) ?? -1000;
          if (this.time.now - previousAccent >= 180) {
            this.tetherBloomAccentTimes.set(enemy.id, this.time.now);
            const midpoint = {
              x: (enemy.position.x + playerPosition.x) / 2,
              y: (enemy.position.y + playerPosition.y) / 2,
            };
            this.emitAuthoredEffect(
              3,
              midpoint,
              150,
              0.42,
              0.72,
              angleToward(enemy.position, playerPosition),
              "tether-bloom-effects-v1",
            );
          }
        }
        return;
      }
      case "bastion-eater": {
        const phase = enemy.bastionEaterPhase ?? "breach";
        const column = (Math.floor(this.time.now / 170) + enemy.id) % 4;
        if (enemy.bastionEaterNodeExposed) {
          view.setTexture("bastion-eater-nodes-v1").setFrame(4 + column);
        } else {
          const row = phase === "brood" ? 1 : phase === "last-stand" ? 2 : 0;
          view.setTexture("bastion-eater-v1").setFrame(row * 4 + column);
        }
        view.setScale(0.78).setRotation(0);
        return;
      }
      case "brain-blob":
        view.setFrame(brainBlobFrame(enemy.brainPhase ?? "drift"));
        view.setRotation(angleToward(enemy.position, playerPosition));
        return;
      case "slime-spitter": {
        if (enemy.eliteKind === "blightspitter") {
          const row = enemy.spitterPhase === "windup" ? 1 : enemy.spitterPhase === "recover" ? 2 : 0;
          const beat = (Math.floor(this.time.now / 125) + enemy.id) % 4;
          view.setTexture("blightspitter-v1")
            .setFrame(row * 4 + beat)
            .setRotation(Math.atan2(enemy.facingDirection.y, enemy.facingDirection.x));
          return;
        }
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
          : phase === "sweep" || phase === "sweep-windup" || phase === "slam" || phase === "slam-windup" ? 2 : 0;
        view.setFrame(row * 4 + facingColumn).setRotation(0);
        return;
      }
      case "brood-warden": {
        const target = {
          x: enemy.position.x + enemy.facingDirection.x,
          y: enemy.position.y + enemy.facingDirection.y,
        };
        const facingColumn = cardinalFacingColumn(enemy.position, target);
        const phase = enemy.broodWardenPhase ?? "stalk";
        const attacking = phase.endsWith("windup")
          || phase === "cleave" || phase === "acid-volley"
          || phase === "egg-lay" || phase === "swarm-rush";
        const row = enemy.health / enemy.maxHealth <= 0.2 ? 2 : attacking ? 1 : 0;
        view.setFrame(row * 4 + facingColumn).setRotation(0);
        return;
      }
      case "rift-stalker": {
        const direction = enemy.riftStalkerDirection ?? enemy.facingDirection;
        const target = { x: enemy.position.x + direction.x, y: enemy.position.y + direction.y };
        const facingColumn = cardinalFacingColumn(enemy.position, target);
        const phase = enemy.riftStalkerPhase ?? "cloak";
        const row = phase === "mark" || phase === "slash-windup" ? 1
          : phase === "warp" || phase === "pounce" || phase === "slash" ? 2
            : phase === "recovery" || enemy.health / enemy.maxHealth <= 0.2 ? 3 : 0;
        view.setTexture("rift-stalker-v1").setFrame(row * 4 + facingColumn).setRotation(0);
        return;
      }
      default: {
        if (enemy.type === "swarm-scuttler") {
          const direction = enemy.facingDirection;
          const target = { x: enemy.position.x + direction.x, y: enemy.position.y + direction.y };
          const facingColumn = cardinalFacingColumn(enemy.position, target);
          const row = offsetGaitRow(this.time.now, enemy.id);
          view.setTexture("swarm-scuttler-v1").setFrame(row * 4 + facingColumn).setRotation(0);
          return;
        }
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
        const authoredProjectile = projectile.weaponId === "bolt-carbine"
          ? { texture: "bolt-carbine-effects-v1", frame: 1, scale: 0.58 }
          : projectile.weaponId === "bulwark-rotary-cannon"
            ? { texture: "bulwark-rotary-effects-v1", frame: 1, scale: 0.34 }
            : projectile.weaponId === "grenade-tube"
              ? { texture: "grenade-tube-effects-v1", frame: 0, scale: 0.48 }
          : projectile.weaponId === "scattergun"
          ? { texture: "batch-b-effects-v1", frame: 1, scale: 0.24 }
          : projectile.weaponId === "arc-carbine"
            ? { texture: "batch-b-effects-v1", frame: 6, scale: 0.3 }
            : { texture: "combat-effects-v1", frame: 6, scale: 0.3 };
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
        view.setScale(projectile.weaponId === "bolt-carbine" ? 0.58
          : projectile.weaponId === "bulwark-rotary-cannon" ? 0.34
            : projectile.weaponId === "grenade-tube" ? 0.48
              : projectile.weaponId === "scattergun" ? 0.24 : 0.3);
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
        view = projectile.type === "quill-spike" && this.useMarineArt
          ? this.add.sprite(0, 0, "quillback-effects-v1", 0).setScale(0.48).setDepth(710)
          : projectile.type === "quill-spike"
            ? this.add.rectangle(0, 0, 18, 5, 0xffd08a).setStrokeStyle(2, 0xff6b52).setDepth(710)
          : this.useMarineArt
          ? this.add.sprite(
            0,
            0,
            projectile.type === "brood-acid" ? "brood-warden-effects-v1" : "batch-b-effects-v1",
            projectile.type === "brood-acid" ? 0 : 10,
          ).setScale(0.42).setDepth(710)
          : this.add.circle(0, 0, 9, 0xa9e34b).setStrokeStyle(3, 0xefff9a).setDepth(710);
        this.enemyProjectileViews.set(projectile.id, view);
      }
      view.setPosition(projectile.position.x * PIXELS_PER_METRE, projectile.position.y * PIXELS_PER_METRE)
        .setRotation(projectile.rotationRadians);
      if (view instanceof Phaser.GameObjects.Sprite) {
        view.clearTint();
      } else if (view instanceof Phaser.GameObjects.Rectangle) {
        view.setFillStyle(0xffd08a).setStrokeStyle(2, 0xff6b52);
      } else {
        view.setFillStyle(projectile.type === "brood-acid" ? 0xd696ff : 0xa9e34b);
      }
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
          ? reward.type === "aurum-supply-cache"
            ? this.add.sprite(0, 0, "aurum-hoarder-effects-v1", 7).setScale(0.82)
            : this.add.sprite(0, 0, "pickups-v1", 3).setScale(0.72)
          : this.add.rectangle(0, 0, 18, 18, 0xd696ff).setRotation(Math.PI / 4)
            .setStrokeStyle(3, 0xffd36b);
        this.eliteRewardViews.set(reward.id, view);
      }
      view.setPosition(reward.position.x * PIXELS_PER_METRE, reward.position.y * PIXELS_PER_METRE)
        .setDepth(worldDepth(reward.position.y) - 2)
        .setScale((reward.type === "mini-boss-arsenal-cache" ? 0.86 : reward.type === "aurum-supply-cache" ? 0.92 : 0.68) + Math.sin(this.time.now / 120) * 0.08);
      if (view instanceof Phaser.GameObjects.Sprite) {
        if (reward.type === "aurum-supply-cache") view.clearTint();
        else view.setTint(reward.type === "mini-boss-arsenal-cache" ? 0xffd36b : 0xd696ff);
      }
    }
  }

  private syncAurumExitMarkers(enemies: readonly EnemySnapshot[]): void {
    const fleeing = enemies.filter((enemy) => enemy.type === "aurum-hoarder" && enemy.aurumPhase === "flee");
    const liveIds = new Set(fleeing.map((enemy) => enemy.id));
    this.destroyMissing(this.aurumExitMarkers, liveIds);
    for (const enemy of fleeing) {
      if (!enemy.aurumExitTarget) continue;
      let marker = this.aurumExitMarkers.get(enemy.id);
      if (!marker) {
        marker = this.add.graphics();
        this.aurumExitMarkers.set(enemy.id, marker);
      }
      const pulse = 18 + Math.sin(this.time.now / 90) * 4;
      marker.clear()
        .lineStyle(4, 0x68e4e8, 0.9)
        .strokeCircle(0, 0, pulse)
        .lineStyle(2, 0xffd36b, 0.95)
        .strokeCircle(0, 0, pulse - 7)
        .setPosition(enemy.aurumExitTarget.x * PIXELS_PER_METRE, enemy.aurumExitTarget.y * PIXELS_PER_METRE)
        .setDepth(690);
    }
  }

  private syncMiniBossTelegraphs(enemies: readonly EnemySnapshot[]): void {
    const bosses = enemies.filter((enemy) => Boolean(enemy.miniBossKind));
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
      if (boss.miniBossKind === "brood-warden") {
        const phase = boss.broodWardenPhase;
        if (phase === "acid-windup") {
          const direction = boss.broodWardenDirection ?? boss.facingDirection;
          view.lineStyle(4, 0xa9e34b, 0.72);
          for (const offset of [-0.3, 0, 0.3]) {
            const angle = Math.atan2(direction.y, direction.x) + offset;
            view.lineBetween(x, y, x + Math.cos(angle) * 8 * PIXELS_PER_METRE, y + Math.sin(angle) * 8 * PIXELS_PER_METRE);
          }
        } else if (phase === "egg-windup") {
          view.lineStyle(4, 0xd696ff, 0.75).strokeCircle(x, y, 2.2 * PIXELS_PER_METRE);
        } else if (phase === "rush-windup" && boss.broodWardenDirection) {
          view.lineStyle(6, 0xff668f, 0.78);
          view.lineBetween(x, y, x + boss.broodWardenDirection.x * 7 * PIXELS_PER_METRE, y + boss.broodWardenDirection.y * 7 * PIXELS_PER_METRE);
        }
      } else if (boss.siegeCrusherPhase === "charge-windup" && boss.siegeCrusherDirection) {
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

  private syncCombatTelegraphs(telegraphs: readonly CombatTelegraphSnapshot[]): void {
    const liveIds = new Set(telegraphs.map((telegraph) => telegraph.id));
    this.destroyMissing(this.combatTelegraphViews, liveIds);
    for (const telegraph of telegraphs) {
      let view = this.combatTelegraphViews.get(telegraph.id);
      if (!view) {
        view = this.add.graphics().setDepth(63);
        this.combatTelegraphViews.set(telegraph.id, view);
      }
      view.clear();
      const progress = 1 - telegraph.remainingSeconds / telegraph.durationSeconds;
      const x = telegraph.origin.x * PIXELS_PER_METRE;
      const y = telegraph.origin.y * PIXELS_PER_METRE;
      const radius = (telegraph.radiusMetres ?? 1) * PIXELS_PER_METRE;
      const colour = telegraph.kind === "rain-of-spines" ? 0xff6b52
        : telegraph.kind === "radial-pulse" ? 0xff9a72
          : telegraph.kind === "sweeping-arc" ? 0xffc45e : 0xffd36b;
      view.lineStyle(3 + progress * 3, colour, 0.55 + progress * 0.35);
      if (telegraph.kind === "sweeping-arc" && telegraph.direction) {
        const angle = Math.atan2(telegraph.direction.y, telegraph.direction.x);
        const halfArc = telegraph.halfArcRadians ?? Math.PI / 3;
        view.beginPath();
        view.arc(x, y, radius, angle - halfArc, angle + halfArc, false);
        view.strokePath();
        view.lineBetween(x, y, x + Math.cos(angle - halfArc) * radius, y + Math.sin(angle - halfArc) * radius);
        view.lineBetween(x, y, x + Math.cos(angle + halfArc) * radius, y + Math.sin(angle + halfArc) * radius);
      } else if (telegraph.kind === "beam" && telegraph.direction) {
        const length = (telegraph.lengthMetres ?? 1) * PIXELS_PER_METRE;
        view.lineBetween(x, y, x + telegraph.direction.x * length, y + telegraph.direction.y * length);
      } else {
        view.strokeCircle(x, y, radius * (0.8 + progress * 0.2));
      }

      const camera = this.cameras.main.worldView;
      const edge = offscreenWarningPosition(
        telegraph.origin,
        {
          x: camera.x / PIXELS_PER_METRE,
          y: camera.y / PIXELS_PER_METRE,
          width: camera.width / PIXELS_PER_METRE,
          height: camera.height / PIXELS_PER_METRE,
        },
      );
      if (edge) {
        const edgeX = edge.x * PIXELS_PER_METRE;
        const edgeY = edge.y * PIXELS_PER_METRE;
        view.fillStyle(colour, 0.92).fillTriangle(edgeX, edgeY - 9, edgeX + 8, edgeY + 8, edgeX - 8, edgeY + 8);
      }
    }
  }

  private syncCombatTelegraphArt(telegraphs: readonly CombatTelegraphSnapshot[]): void {
    if (!this.useMarineArt) {
      this.destroyMissing(this.combatTelegraphArtViews, new Set<string>());
      return;
    }
    const liveIds = new Set(telegraphs.map((telegraph) => telegraph.id));
    this.destroyMissing(this.combatTelegraphArtViews, liveIds);
    for (const telegraph of telegraphs) {
      let view = this.combatTelegraphArtViews.get(telegraph.id);
      if (!view) {
        view = this.add.sprite(0, 0, "telegraph-small-v1", 0).setDepth(62.5);
        this.combatTelegraphArtViews.set(telegraph.id, view);
      }
      const camera = this.cameras.main.worldView;
      const edge = offscreenWarningPosition(
        telegraph.origin,
        {
          x: camera.x / PIXELS_PER_METRE,
          y: camera.y / PIXELS_PER_METRE,
          width: camera.width / PIXELS_PER_METRE,
          height: camera.height / PIXELS_PER_METRE,
        },
      );
      if (edge) {
        const direction = Math.atan2(telegraph.origin.y - edge.y, telegraph.origin.x - edge.x);
        view.setTexture("telegraph-small-v1").setFrame(7)
          .setPosition(edge.x * PIXELS_PER_METRE, edge.y * PIXELS_PER_METRE)
          .setDisplaySize(48, 48).setRotation(direction - Math.PI).setAlpha(0.9).setVisible(true);
        continue;
      }

      const progress = Math.min(0.999, Math.max(0, 1 - telegraph.remainingSeconds / telegraph.durationSeconds));
      const x = telegraph.origin.x * PIXELS_PER_METRE;
      const y = telegraph.origin.y * PIXELS_PER_METRE;
      const diameter = (telegraph.radiusMetres ?? 1) * PIXELS_PER_METRE * 2;
      view.setPosition(x, y).setRotation(0).setAlpha(0.58).setVisible(true);
      if (telegraph.kind === "ground-slam") {
        view.setTexture("telegraph-large-v1").setFrame(Math.floor(progress * 4)).setDisplaySize(diameter, diameter);
      } else if (telegraph.kind === "sweeping-arc" && telegraph.direction) {
        view.setTexture("telegraph-large-v1").setFrame(4 + Math.floor(progress * 4)).setDisplaySize(diameter, diameter)
          .setRotation(Math.atan2(telegraph.direction.y, telegraph.direction.x));
      } else if (telegraph.kind === "rain-of-spines") {
        view.setTexture("telegraph-small-v1").setFrame(Math.floor(progress * 4)).setDisplaySize(diameter, diameter);
      } else if (telegraph.kind === "radial-pulse") {
        view.setTexture("telegraph-small-v1").setFrame(4 + Math.min(2, Math.floor(progress * 3))).setDisplaySize(diameter, diameter);
      } else if (telegraph.kind === "beam" && telegraph.direction) {
        const length = (telegraph.lengthMetres ?? 1) * PIXELS_PER_METRE;
        view.setTexture("telegraph-small-v1").setFrame(8 + Math.min(2, Math.floor(progress * 3)))
          .setDisplaySize(length, 64).setRotation(Math.atan2(telegraph.direction.y, telegraph.direction.x));
      } else {
        view.setVisible(false);
      }
    }
  }

  private syncRipperTelegraphs(enemies: readonly EnemySnapshot[]): void {
    const active = enemies.filter((enemy) => enemy.type === "ripper" && enemy.ripperPhase === "windup");
    const liveIds = new Set(active.map((enemy) => enemy.id));
    this.destroyMissing(this.ripperTelegraphs, liveIds);
    for (const enemy of active) {
      let view = this.ripperTelegraphs.get(enemy.id);
      if (!view) {
        view = this.add.graphics().setDepth(61);
        this.ripperTelegraphs.set(enemy.id, view);
      }
      view.clear();
      const x = enemy.position.x * PIXELS_PER_METRE;
      const y = enemy.position.y * PIXELS_PER_METRE;
      const direction = enemy.ripperDirection ?? enemy.facingDirection;
      const angle = Math.atan2(direction.y, direction.x);
      const halfAngle = Math.PI * 0.32;
      const radius = 2.55 * PIXELS_PER_METRE;
      view.lineStyle(5, 0xffc45e, 0.82);
      view.beginPath();
      view.arc(x, y, radius, angle - halfAngle, angle + halfAngle, false);
      view.strokePath();
      view.lineBetween(x, y, x + Math.cos(angle - halfAngle) * radius, y + Math.sin(angle - halfAngle) * radius);
      view.lineBetween(x, y, x + Math.cos(angle + halfAngle) * radius, y + Math.sin(angle + halfAngle) * radius);
    }
  }

  private syncRazorScuttlerTelegraphs(enemies: readonly EnemySnapshot[]): void {
    const active = enemies.filter((enemy) => (
      enemy.type === "razor-scuttler" && enemy.razorScuttlerPhase === "windup"
    ));
    const liveIds = new Set(active.map((enemy) => enemy.id));
    this.destroyMissing(this.razorScuttlerTelegraphs, liveIds);
    for (const enemy of active) {
      let view = this.razorScuttlerTelegraphs.get(enemy.id);
      if (!view) {
        view = this.add.graphics().setDepth(61);
        this.razorScuttlerTelegraphs.set(enemy.id, view);
      }
      view.clear();
      const x = enemy.position.x * PIXELS_PER_METRE;
      const y = enemy.position.y * PIXELS_PER_METRE;
      const direction = enemy.razorScuttlerDirection ?? enemy.facingDirection;
      const length = RAZOR_SCUTTLER_DASH_SPEED * RAZOR_SCUTTLER_DASH_SECONDS * PIXELS_PER_METRE;
      view.lineStyle(7, 0xff5d72, 0.35);
      view.lineBetween(x, y, x + direction.x * length, y + direction.y * length);
      view.lineStyle(2, 0xffffff, 0.78);
      view.lineBetween(x, y, x + direction.x * length, y + direction.y * length);
    }
  }

  private syncQuillbackTelegraphs(enemies: readonly EnemySnapshot[]): void {
    const active = enemies.filter((enemy) => enemy.type === "quillback" && enemy.quillbackPhase === "windup");
    const liveIds = new Set(active.map((enemy) => enemy.id));
    this.destroyMissing(this.quillbackTelegraphs, liveIds);
    for (const enemy of active) {
      let view = this.quillbackTelegraphs.get(enemy.id);
      if (!view) {
        view = this.add.graphics().setDepth(61);
        this.quillbackTelegraphs.set(enemy.id, view);
      }
      view.clear();
      const x = enemy.position.x * PIXELS_PER_METRE;
      const y = enemy.position.y * PIXELS_PER_METRE;
      const direction = enemy.quillbackDirection ?? enemy.facingDirection;
      const centreAngle = Math.atan2(direction.y, direction.x);
      const count = enemy.quillbackShotCount ?? 1;
      const totalArc = Math.PI * 64 / 180;
      view.lineStyle(3, count === 5 ? 0xff6b52 : 0xffc45e, 0.72);
      for (let index = 0; index < count; index += 1) {
        const offset = count === 1 ? 0 : -totalArc / 2 + totalArc * index / (count - 1);
        const angle = centreAngle + offset;
        view.lineBetween(
          x,
          y,
          x + Math.cos(angle) * 10.5 * PIXELS_PER_METRE,
          y + Math.sin(angle) * 10.5 * PIXELS_PER_METRE,
        );
      }
    }
  }

  private syncSpinewheelTelegraphs(enemies: readonly EnemySnapshot[]): void {
    const active = enemies.filter((enemy) => enemy.type === "spinewheel" && enemy.spinewheelPhase === "windup");
    const liveIds = new Set(active.map((enemy) => enemy.id));
    this.destroyMissing(this.spinewheelTelegraphs, liveIds);
    for (const enemy of active) {
      let view = this.spinewheelTelegraphs.get(enemy.id);
      if (!view) {
        view = this.add.graphics().setDepth(61);
        this.spinewheelTelegraphs.set(enemy.id, view);
      }
      view.clear();
      const x = enemy.position.x * PIXELS_PER_METRE;
      const y = enemy.position.y * PIXELS_PER_METRE;
      const direction = enemy.spinewheelDirection ?? enemy.facingDirection;
      const endX = x + direction.x * 11 * PIXELS_PER_METRE;
      const endY = y + direction.y * 11 * PIXELS_PER_METRE;
      view.lineStyle(6, 0xffc45e, 0.34);
      view.lineBetween(x, y, endX, endY);
      view.lineStyle(2, 0xffffff, 0.78);
      view.lineBetween(x, y, endX, endY);
      view.fillStyle(0xffc45e, 0.88);
      view.fillCircle(endX, endY, 5);
    }
  }

  private syncTetherBloomTelegraphs(
    enemies: readonly EnemySnapshot[],
    playerPosition: { x: number; y: number },
  ): void {
    const active = enemies.filter((enemy) => (
      enemy.type === "tether-bloom"
      && (enemy.tetherBloomPhase === "windup" || enemy.tetherBloomPhase === "tethering")
    ));
    const liveIds = new Set(active.map((enemy) => enemy.id));
    this.destroyMissing(this.tetherBloomTelegraphs, liveIds);
    for (const enemy of active) {
      let view = this.tetherBloomTelegraphs.get(enemy.id);
      if (!view) {
        view = this.add.graphics().setDepth(62);
        this.tetherBloomTelegraphs.set(enemy.id, view);
      }
      view.clear();
      const fromX = enemy.position.x * PIXELS_PER_METRE;
      const fromY = enemy.position.y * PIXELS_PER_METRE;
      const target = enemy.tetherBloomPhase === "tethering"
        ? playerPosition
        : enemy.tetherBloomTarget ?? playerPosition;
      const toX = target.x * PIXELS_PER_METRE;
      const toY = target.y * PIXELS_PER_METRE;
      const latched = enemy.tetherBloomPhase === "tethering";
      view.lineStyle(latched ? 7 : 5, latched ? 0xd696ff : 0xd8f06a, latched ? 0.72 : 0.42);
      view.lineBetween(fromX, fromY, toX, toY);
      view.lineStyle(2, 0xffffff, latched ? 0.8 : 0.58);
      view.lineBetween(fromX, fromY, toX, toY);
      view.fillStyle(latched ? 0xd696ff : 0xd8f06a, 0.82);
      view.fillCircle(toX, toY, latched ? 7 : 5);
      if (!latched) {
        view.lineStyle(2, 0xd8f06a, 0.32);
        view.strokeCircle(fromX, fromY, 3.5 * PIXELS_PER_METRE);
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
        view = this.useMarineArt
          ? this.add.sprite(0, 0, "batch-c-effects-v1", 17).setScale(0.75).setDepth(61)
          : this.add.circle(0, 0, 17, 0x000000, 0)
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
        view = this.useMarineArt
          ? powerup.type === "medkit"
            ? this.add.sprite(0, 0, "pickups-v1", 2)
            : this.add.sprite(0, 0, "batch-c-rewards-v1", powerupRewardFrame(powerup.type))
          : this.add.rectangle(0, 0, 16, 16, powerupColor(powerup.type))
            .setRotation(Math.PI / 4).setStrokeStyle(2, 0xffffff);
        this.powerupViews.set(powerup.id, view);
      }
      const baseScale = powerup.type === "medkit" ? 0.5 : 1;
      view.setPosition(powerup.position.x * PIXELS_PER_METRE, powerup.position.y * PIXELS_PER_METRE)
        .setDepth(worldDepth(powerup.position.y) - 2)
        .setScale(baseScale * (1 + Math.sin(this.time.now / 140) * 0.12))
        .setAlpha(powerup.remainingSeconds < 3 && Math.floor(this.time.now / 160) % 2 === 0 ? 0.4 : 1);
    }
  }

  /** Placeholder crates until a future art batch: bronze armored, teal-trim sealed. */
  private syncSupplyChests(chests: readonly SupplyChestSnapshot[]): void {
    const liveIds = new Set(chests.map((chest) => chest.id));
    this.destroyMissing(this.supplyChestViews, liveIds);
    for (const chest of chests) {
      let view = this.supplyChestViews.get(chest.id);
      if (!view) {
        const armored = chest.variant === "armored";
        const body = this.add.rectangle(0, 0, 28, 20, armored ? 0x6b4a26 : 0x3d4a5c)
          .setStrokeStyle(2, armored ? 0x8a6a3a : 0x68e4e8);
        const lid = this.add.rectangle(0, -7, 28, 5, armored ? 0x8a6a3a : 0x4f6e8d);
        const prompt = this.add.text(0, -24, armored ? "" : "E", {
          fontFamily: "Consolas, monospace", fontSize: "12px", color: "#68e4e8",
        }).setOrigin(0.5).setName("prompt").setVisible(false);
        const healthBar = this.add.rectangle(-14, -16, 28, 3, 0xff6b3d)
          .setOrigin(0, 0.5).setName("chest-health").setVisible(false);
        view = this.add.container(0, 0, [body, lid, prompt, healthBar]);
        this.supplyChestViews.set(chest.id, view);
      }
      view.setPosition(chest.position.x * PIXELS_PER_METRE, chest.position.y * PIXELS_PER_METRE)
        .setDepth(worldDepth(chest.position.y) - 1);
      const prompt = view.getByName("prompt") as Phaser.GameObjects.Text | null;
      prompt?.setVisible(chest.playerInRange)
        .setAlpha(0.6 + Math.sin(this.time.now / 220) * 0.4);
      const healthBar = view.getByName("chest-health") as Phaser.GameObjects.Rectangle | null;
      if (healthBar && chest.maxHealth > 0) {
        healthBar.setVisible(chest.health < chest.maxHealth)
          .setScale(Math.max(chest.health / chest.maxHealth, 0.02), 1);
      }
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
        // Static and small by creator direction: no shimmer flashing.
        view = this.useMarineArt
          ? this.add.sprite(0, 0, "pickups-v1", 0).setScale(0.42)
          : this.add.rectangle(0, 0, 8, 8, 0x58e6ef).setRotation(Math.PI / 4).setStrokeStyle(1, 0xffffff);
        view.setDepth(worldDepth(pickup.position.y) - 3);
        this.pickupViews.set(pickup.id, view);
      }
      view.setPosition(
        pickup.position.x * PIXELS_PER_METRE,
        pickup.position.y * PIXELS_PER_METRE,
      );
      view.setDepth(worldDepth(pickup.position.y) - 3);
    }
  }

  private createFenceViews(): void {
    const fence = this.simulation.arena.fence;
    if (!fence) {
      return;
    }
    for (const pylon of [fence.from, fence.to]) {
      if (this.useMarineArt) {
        this.add.image(pylon.x * PIXELS_PER_METRE, pylon.y * PIXELS_PER_METRE, "batch-c-effects-v1", 7)
          .setScale(0.72).setDepth(worldDepth(pylon.y));
      } else {
        this.add.rectangle(pylon.x * PIXELS_PER_METRE, pylon.y * PIXELS_PER_METRE, 10, 22, 0x5a6672)
          .setStrokeStyle(2, 0x9fb3c8).setDepth(worldDepth(pylon.y));
      }
    }
    this.fenceSwitch = this.useMarineArt
      ? this.add.sprite(fence.switchPosition.x * PIXELS_PER_METRE, fence.switchPosition.y * PIXELS_PER_METRE, "batch-c-effects-v1", 5)
        .setScale(0.72).setDepth(worldDepth(fence.switchPosition.y))
      : this.add.rectangle(fence.switchPosition.x * PIXELS_PER_METRE, fence.switchPosition.y * PIXELS_PER_METRE, 16, 16, 0x3fae6a)
        .setStrokeStyle(2, 0xe9e3cf).setDepth(worldDepth(fence.switchPosition.y));
    if (this.useMarineArt) {
      const fromX = fence.from.x * PIXELS_PER_METRE;
      const fromY = fence.from.y * PIXELS_PER_METRE;
      const toX = fence.to.x * PIXELS_PER_METRE;
      const toY = fence.to.y * PIXELS_PER_METRE;
      this.fenceLine = this.add.image((fromX + toX) / 2, (fromY + toY) / 2, "batch-c-effects-v1", 8)
        .setDisplaySize(Math.hypot(toX - fromX, toY - fromY), 28)
        .setRotation(Math.atan2(toY - fromY, toX - fromX))
        .setDepth(640).setVisible(false);
    } else {
      this.fenceLine = this.add.line(0, 0, fence.from.x * PIXELS_PER_METRE, fence.from.y * PIXELS_PER_METRE, fence.to.x * PIXELS_PER_METRE, fence.to.y * PIXELS_PER_METRE, 0x8fe8ff, 0.95)
        .setOrigin(0).setLineWidth(3).setDepth(640).setVisible(false);
    }
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
    if (this.fenceSwitch instanceof Phaser.GameObjects.Sprite) {
      this.fenceSwitch.setFrame(fence.active ? 6 : 5).setAlpha(fence.ready || fence.active ? 1 : 0.45);
    } else {
      this.fenceSwitch.setFillStyle(fence.active ? 0xffd36b : fence.ready ? 0x3fae6a : 0x44505c);
    }
    this.fenceLine.setVisible(fence.active);
    if (fence.active) {
      this.fenceLine.setAlpha(0.55 + Math.abs(Math.sin(this.time.now / 45)) * 0.45);
    }
    this.fencePrompt.setVisible(fence.ready && fence.playerNearSwitch && !fence.active);
  }

  /**
   * Arrow keys / WASD / left stick move the highlight, Enter / Space / pad A
   * confirms, and digits 1–3 pick directly. Runs before the simulation step
   * so a confirm applies on the same frame.
   */
  private handleDecisionNavigation(intent: PlayerIntent): void {
    if (!this.menuKeys || this.decisionButtons.length === 0) {
      return;
    }

    let delta = 0;
    if (Phaser.Input.Keyboard.JustDown(this.menuKeys.up) || Phaser.Input.Keyboard.JustDown(this.menuKeys.w)) {
      delta -= 1;
    }
    if (Phaser.Input.Keyboard.JustDown(this.menuKeys.down) || Phaser.Input.Keyboard.JustDown(this.menuKeys.s)) {
      delta += 1;
    }
    // Gamepad stick: one step per push, re-armed once the stick recentres.
    if (Math.abs(intent.move.y) < 0.35) {
      this.menuStickReady = true;
    } else if (this.menuStickReady && Math.abs(intent.move.y) > 0.6) {
      delta += intent.move.y > 0 ? 1 : -1;
      this.menuStickReady = false;
    }
    if (delta !== 0) {
      const count = this.decisionButtons.length;
      for (let step = 0; step < count; step += 1) {
        this.decisionSelectionIndex = (this.decisionSelectionIndex + delta + count) % count;
        if (this.decisionButtons[this.decisionSelectionIndex]?.enabled) break;
      }
      this.updateDecisionSelectionHighlight();
    }

    const digits = [
      this.menuKeys.one, this.menuKeys.two, this.menuKeys.three,
      this.menuKeys.four, this.menuKeys.five, this.menuKeys.six,
      this.menuKeys.seven, this.menuKeys.eight, this.menuKeys.nine,
    ];
    for (let index = 0; index < this.decisionButtons.length; index += 1) {
      if (digits[index] && Phaser.Input.Keyboard.JustDown(digits[index]!)) {
        this.decisionSelectionIndex = index;
        this.confirmDecisionSelection();
        return;
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.menuKeys.confirm) || intent.evasiveMovePressed) {
      this.confirmDecisionSelection();
    }
  }

  private confirmDecisionSelection(): void {
    const selected = this.decisionButtons[this.decisionSelectionIndex];
    if (!selected?.enabled) {
      return;
    }
    if (this.simulation.chooseOption(selected.choiceId)) {
      this.synth.play(UI_CONFIRM_CUE);
    }
  }

  private updateDecisionSelectionHighlight(): void {
    this.decisionButtons.forEach(({ rect, enabled }, index) => {
      if (!enabled) {
        rect.setFillStyle(0x141b24).setStrokeStyle(2, 0x394756).setAlpha(0.72);
        return;
      }
      rect.setAlpha(1);
      if (index === this.decisionSelectionIndex) {
        rect.setFillStyle(0x294865).setStrokeStyle(3, 0x68e4e8);
      } else {
        rect.setFillStyle(0x1b2d42).setStrokeStyle(2, 0x5d7892);
      }
    });
  }

  /**
   * The overlay deliberately does NOT use scrollFactor(0): Phaser hit-tests
   * interactive objects in world space, so a screen-fixed container drifts
   * away from its own hover/click zones once the camera scrolls. Instead the
   * container follows the camera's world-view centre every frame, keeping
   * the drawn panel and its hit areas identical.
   */
  private positionDecisionOverlay(): void {
    if (!this.decisionOverlay) {
      return;
    }
    const camera = this.cameras.main;
    this.decisionOverlay.setPosition(
      camera.scrollX + camera.width / 2,
      camera.scrollY + camera.height / 2,
    );
  }

  private syncDecisionOverlay(decision: PendingDecision | null): void {
    const nextKey = decision
      ? `${decision.kind}|${decision.title}|${decision.options.map((option) => `${option.id}:${option.affordable ?? true}`).join("|")}`
      : "";
    if (nextKey === this.visibleDecisionKey) {
      this.positionDecisionOverlay();
      return;
    }

    this.decisionOverlay?.destroy(true);
    this.decisionOverlay = null;
    this.decisionButtons = [];
    this.decisionSelectionIndex = 0;
    this.spinewheelTrailTimes.clear();
    this.tetherBloomAccentTimes.clear();
    this.visibleDecisionKey = nextKey;

    if (!decision) {
      return;
    }

    const isShop = decision.kind === "scrap-shop";
    const isPlacement = decision.kind === "weapon-placement";
    const shopColumns = isShop && decision.options.length > 7 ? 2 : 1;
    const shopRows = isShop ? Math.ceil(decision.options.length / shopColumns) : 0;
    const panelWidth = isPlacement ? 860 : shopColumns === 2 ? 980 : 760;
    const panelHeight = isShop ? Math.max(520, 190 + shopRows * 70) : isPlacement ? 520 : 330;
    const children: Phaser.GameObjects.GameObject[] = [];
    if (isShop && this.useMarineArt) {
      children.push(this.add.image(0, 0, "scrap-shop-panel-v1").setDisplaySize(panelWidth, panelHeight));
    } else if (isPlacement && this.useMarineArt) {
      children.push(this.add.image(0, 0, "batch-i-placement-modal-v1").setDisplaySize(panelWidth, panelHeight));
    } else {
      children.push(this.add.rectangle(0, 0, panelWidth, panelHeight, 0x0b121c, 0.985).setStrokeStyle(4, isShop ? 0xdca652 : 0x68e4e8));
      children.push(this.add.rectangle(0, 0, panelWidth - 18, panelHeight - 18, 0x172536, 0.72).setStrokeStyle(1, 0x4d6a83));
    }
    const titleY = isShop ? -panelHeight / 2 + 40 : isPlacement ? -220 : -125;
    if (isShop && this.useMarineArt && shopColumns === 1) {
      if (!this.anims.exists("quartermaster-idle-v1")) {
        this.anims.create({
          key: "quartermaster-idle-v1",
          frames: this.anims.generateFrameNumbers("quartermaster-v1", { start: 0, end: 3 }),
          frameRate: 2,
          repeat: -1,
        });
      }
      const keeper = this.add.sprite(270, panelHeight / 2 - 18, "quartermaster-v1", 0)
        .setDisplaySize(128, 256)
        .setOrigin(0.5, 1)
        .play("quartermaster-idle-v1");
      children.push(keeper);
    }
    const title = this.add.text(0, titleY, decision.title, {
      color: "#ffffff",
      fontFamily: "Consolas, Courier New, monospace",
      fontSize: "22px",
      fontStyle: "bold",
      stroke: "#081018",
      strokeThickness: 4,
    }).setOrigin(0.5).setResolution(uiTextResolution());
    children.push(title);
    if (this.useMarineArt) {
      if (isShop) {
        children.push(this.add.image(-325, titleY, "scrap-shop-hud-v1", 0).setDisplaySize(54, 54));
      } else if (!isPlacement) {
        const decisionFrame = decision.kind === "weapon-chest" ? 1 : decision.kind === "supply-depot" ? 4 : 12;
        children.push(this.add.image(-325, titleY, "batch-c-rewards-v1", decisionFrame).setScale(0.62));
      }
    }

    if (isPlacement && decision.weaponId) {
      const stats = WEAPON_CATALOG[decision.weaponId];
      if (this.useMarineArt) children.push(this.add.image(-335, -20, "batch-i-weapon-stat-card-v1").setDisplaySize(206, 270));
      children.push(this.add.image(-335, -90, "batch-i-weapon-tiles-v1", batchIWeaponTileFrame(decision.weaponId)).setDisplaySize(112, 112));
      children.push(this.add.text(-335, 8, `${stats.weaponClass.toUpperCase()} • TIER I\nDMG ${stats.projectileDamage}   CADENCE ${stats.fireIntervalSeconds.toFixed(2)}s`, {
        color: "#dce8f2", fontFamily: "Consolas, Courier New, monospace", fontSize: "11px", align: "center", lineSpacing: 5,
      }).setOrigin(0.5).setResolution(uiTextResolution()));
    }

    decision.options.forEach((choice, index) => {
      const shopColumn = shopColumns === 2 ? index % 2 : 0;
      const shopRow = shopColumns === 2 ? Math.floor(index / 2) : index;
      const x = isPlacement ? -70 + (index % 2) * 330 : isShop && shopColumns === 2 ? -238 + shopColumn * 476 : isShop ? -78 : 0;
      const y = isPlacement ? -125 + Math.floor(index / 2) * 98 : isShop ? titleY + 78 + shopRow * 70 : -60 + index * 86;
      const enabled = choice.affordable !== false;
      const shopButtonWidth = shopColumns === 2 ? 444 : 500;
      const button = this.add.rectangle(x, y, isPlacement ? 300 : isShop ? shopButtonWidth : 670, isPlacement ? 78 : isShop ? 62 : 66, 0x1b2d42, 0.98)
        .setStrokeStyle(2, 0x5d7892).setInteractive({ useHandCursor: enabled });
      const price = choice.cost && choice.cost > 0 ? ` — ${choice.cost} SCRAP${enabled ? "" : " (SHORT)"}` : "";
      children.push(button);
      if (isShop && this.useMarineArt) {
        children.push(this.add.image(x - shopButtonWidth / 2 + 34, y, "scrap-shop-offer-tiles-v1", scrapShopOfferFrame(choice.id))
          .setDisplaySize(48, 48).setAlpha(enabled ? 1 : 0.42));
      }
      if (isPlacement && this.useMarineArt) {
        children.push(this.add.image(x - 116, y, "batch-i-slot-tier-ui-v1", placementOptionFrame(choice.id, choice.name))
          .setDisplaySize(58, 58).setAlpha(enabled ? 1 : 0.42));
      }
      const quickKey = index < 9 ? `${index + 1}. ` : "";
      const label = this.add.text(isPlacement ? x - 78 : isShop ? x - shopButtonWidth / 2 + 76 : -310, y - (isPlacement ? 26 : isShop ? 15 : 18), `${quickKey}${choice.name}${price}\n${choice.description}`, {
        color: enabled ? "#edf4ff" : "#758493",
        fontFamily: "Consolas, Courier New, monospace",
        fontSize: isPlacement ? "13px" : isShop ? "13px" : "15px",
        wordWrap: isPlacement ? { width: 202 } : isShop ? { width: shopButtonWidth - 92 } : undefined,
        lineSpacing: isShop ? 2 : 5,
      }).setResolution(uiTextResolution());
      button.on("pointerover", () => {
        this.decisionSelectionIndex = index;
        this.updateDecisionSelectionHighlight();
      });
      button.on("pointerdown", () => {
        this.decisionSelectionIndex = index;
        this.confirmDecisionSelection();
      });
      this.decisionButtons.push({ rect: button, choiceId: choice.id, enabled });
      children.push(label);
    });

    const quickPickCount = Math.min(9, decision.options.length);
    const hint = this.add.text(0, isShop ? titleY + 38 : isPlacement ? 225 : 138, `↑↓ SELECT   •   ENTER CONFIRM   •   1-${quickPickCount} QUICK PICK`, {
      color: "#9fb3c8",
      fontFamily: "Consolas, Courier New, monospace",
      fontSize: "11px",
    }).setOrigin(0.5).setResolution(uiTextResolution());
    children.push(hint);

    this.decisionOverlay = this.add.container(0, 0, children).setDepth(2200);
    this.updateDecisionSelectionHighlight();
    this.positionDecisionOverlay();
  }

  private destroyMissing<K, T extends Phaser.GameObjects.GameObject>(
    views: Map<K, T>,
    liveIds: ReadonlySet<K>,
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
  if (raw === "patrol") return ["patrol-blade"];
  if (raw === "bolt") return ["bolt-carbine"];
  if (raw === "bulwark") return ["bulwark-rotary-cannon"];
  if (raw === "grenade") return ["grenade-tube"];
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
  return scenario === "slime-spitter" || scenario === "carapace-elite" || scenario === "siege-crusher" || scenario === "brood-warden" || scenario === "rift-stalker" || scenario === "ripper" || scenario === "razor-scuttler" || scenario === "quillback" || scenario === "spinewheel" || scenario === "tether-bloom" || scenario === "bastion-eater" || scenario === "density-capacity" || scenario === "aurum-hoarder" || scenario === "scrap-shop" || scenario === "weapon-gate" || scenario === "batch-j"
    ? scenario
    : null;
}

function readDebugMode(): boolean {
  return new URLSearchParams(window.location.search).get("debug") === "1";
}

function readUraniumLab(): { kit: boolean; active: boolean } {
  const params = new URLSearchParams(window.location.search);
  return {
    kit: params.get("kit") === "uranium",
    active: params.get("buff") === "uranium",
  };
}

/**
 * `?theme=<id>` pins a specific arena theme for review; otherwise each page
 * load draws one from the pool, previewing the expedition map's per-node
 * background variety.
 */
function resolveArenaTheme() {
  const params = new URLSearchParams(window.location.search);
  const requested = arenaThemeById(params.get("theme"));
  if (requested) {
    const worldSeed = Number(params.get("worldseed"));
    return Number.isFinite(worldSeed) ? arenaThemeVariant(requested, worldSeed) : requested;
  }
  return pickArenaTheme(Math.floor(Math.random() * 1024));
}

function createSaveStore(): LocalSaveStore {
  try {
    return new LocalSaveStore(window.localStorage);
  } catch {
    return new LocalSaveStore(null);
  }
}

interface ExpeditionCombatContext {
  run: ExpeditionRun;
  encounter: ExpeditionEncounterDescriptor;
}

function readExpeditionContext(store: LocalSaveStore): ExpeditionCombatContext | null {
  const params = new URLSearchParams(window.location.search);
  if (params.get("expedition") !== "1") return null;
  const nodeId = Number(params.get("node"));
  const saved = store.load().expedition;
  if (!saved || !Number.isInteger(nodeId) || saved.currentNodeId !== nodeId) return null;
  const run = resumeExpeditionRun({
    mapSeed: saved.mapSeed,
    currentNodeId: saved.currentNodeId,
    clearedNodeIds: saved.clearedNodeIds,
    build: saved.build,
  });
  if (!run || run.state.clearedNodeIds.includes(nodeId)) return null;
  const node = expeditionNodeById(run.map, nodeId);
  return node ? { run, encounter: expeditionEncounterForNode(run.state.mapSeed, node) } : null;
}

function expeditionBuildFromSnapshot(snapshot: CombatSnapshot): ExpeditionBuildSnapshot {
  return {
    health: snapshot.playerHealth,
    shield: snapshot.playerShield,
    level: snapshot.level,
    experience: snapshot.experience,
    scrap: snapshot.securedScrap,
    weapons: snapshot.weaponInventory.rack.flatMap((slot) => slot.tile
      ? [{ weaponId: slot.tile.weaponId, tier: slot.tile.tier }]
      : []),
    upgrades: snapshot.upgradeLevels.map((upgrade) => ({
      upgradeId: upgrade.id,
      level: upgrade.level,
    })),
  };
}

/**
 * `?shake=0|1`, `?sound=0|1`, `?damage=0|1`, and `?timers=0|1` persist into local settings
 * until a proper settings screen exists; absent parameters leave stored values
 * untouched.
 */
function applySettingOverrides(store: LocalSaveStore) {
  const params = new URLSearchParams(window.location.search);
  const overrides: { screenShakeEnabled?: boolean; soundEnabled?: boolean; damageNumbersEnabled?: boolean; cooldownTimersEnabled?: boolean } = {};
  const shake = params.get("shake");
  if (shake === "0" || shake === "1") overrides.screenShakeEnabled = shake === "1";
  const sound = params.get("sound");
  if (sound === "0" || sound === "1") overrides.soundEnabled = sound === "1";
  const damage = params.get("damage");
  if (damage === "0" || damage === "1") overrides.damageNumbersEnabled = damage === "1";
  const timers = params.get("timers");
  if (timers === "0" || timers === "1") overrides.cooldownTimersEnabled = timers === "1";
  return Object.keys(overrides).length > 0
    ? store.updateSettings(overrides).settings
    : store.load().settings;
}

function createSimulation(
  startingWeaponCount: number,
  stressProfile: 4 | 12 | null,
  startingWeaponIds: readonly WeaponId[] | null,
  scenario: CombatScenario | null,
  uraniumLab: { kit: boolean; active: boolean },
  expeditionContext: ExpeditionCombatContext | null,
): CombatSimulation {
  return new CombatSimulation({
    startingWeaponCount,
    startingWeaponIds: startingWeaponIds ?? undefined,
    stressProfile: stressProfile ?? undefined,
    scenario: scenario ?? undefined,
    startingUraniumKit: uraniumLab.kit,
    startWithUraniumBuff: uraniumLab.active,
    seed: expeditionContext?.encounter.seed,
    expeditionEncounter: expeditionContext?.encounter,
    startingBuild: expeditionContext?.run.state.build,
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

function statusOverlayFrame(status: string, nowMilliseconds: number): number {
  switch (status) {
    case "blaze": return Math.floor(nowMilliseconds / 90) % 4;
    case "overload": return 4 + Math.floor(nowMilliseconds / 72) % 4;
    case "corrode": return 8 + Math.floor(nowMilliseconds / 260) % 4;
    case "freeze": return 12 + Math.floor(nowMilliseconds / 420) % 3;
    default: return 15;
  }
}

function powerupColor(type: PowerupType): number {
  switch (type) {
    case "overcharge": return 0xffa31a;
    case "aegis": return 0x68e4e8;
    case "adrenaline": return 0xff5f5f;
    case "magnet-pulse": return 0x8fb8ff;
    case "uranium-core-rounds": return 0xb9ef62;
    case "medkit": return 0xff6b7d;
  }
}

function scrapShopOfferFrame(optionId: string): number {
  if (optionId === "shop-repair") return 0;
  if (optionId === "shop-uranium-kit") return 1;
  if (optionId === "shop-armour-retrofit") return 2;
  if (optionId.startsWith("shop-upgrade:")) return 3;
  if (optionId.startsWith("shop-weapon:")) return 4;
  return 5;
}

/** Batch I master order, locked here so every placement surface uses one canonical tile. */
function batchIWeaponTileFrame(weaponId: WeaponId): number {
  switch (weaponId) {
    case "scattergun": return 0;
    case "patrol-blade": return 1;
    case "bolt-carbine": return 2;
    case "grenade-tube": return 3;
    case "arc-carbine": return 4;
    case "bulwark-rotary-cannon": return 5;
    case "bastion-service-rifle": return 7;
  }
}

function placementOptionFrame(optionId: string, name: string): number {
  if (optionId.startsWith("place:inventory:")) return 5;
  if (optionId.startsWith("place:merge:")) return 12;
  if (optionId === "place:discard") return 9;
  if (name.includes("LIGHT")) return 0;
  if (name.includes("MEDIUM")) return 1;
  if (name.includes("HEAVY")) return 2;
  if (name.includes("UNIQUE")) return 3;
  if (name.includes("ALL")) return 4;
  return 15;
}

function statusEffectFrame(status: string): number {
  switch (status) {
    case "blaze": return 0;
    case "overload": return 1;
    case "freeze": return 2;
    case "corrode": return 3;
    default: return 4;
  }
}

function powerupRewardFrame(type: PowerupType): number {
  switch (type) {
    case "overcharge": return 8;
    case "aegis": return 9;
    case "magnet-pulse": return 10;
    case "adrenaline": return 11;
    case "uranium-core-rounds": return 8;
    // Medkits render from the Batch A pickup atlas instead; see syncPowerups.
    case "medkit": return 9;
  }
}

function weaponColor(weaponId: WeaponId): number {
  switch (weaponId) {
    case "scattergun": return 0xff9a72;
    case "arc-carbine": return 0x68e4e8;
    case "patrol-blade": return 0xffd08a;
    case "bolt-carbine": return 0x94efff;
    case "bulwark-rotary-cannon": return 0xff9b42;
    case "grenade-tube": return 0xffb23f;
    default: return 0xe9e3cf;
  }
}

function weaponAssetId(weaponId: WeaponId): "service-rifle-v1" | "scattergun-v1" | "arc-carbine-v1" | "patrol-blade-v1" | "bolt-carbine-v1" | "bulwark-rotary-cannon-v1" | "grenade-tube-v1" {
  if (weaponId === "scattergun") return "scattergun-v1";
  if (weaponId === "arc-carbine") return "arc-carbine-v1";
  if (weaponId === "patrol-blade") return "patrol-blade-v1";
  if (weaponId === "bolt-carbine") return "bolt-carbine-v1";
  if (weaponId === "bulwark-rotary-cannon") return "bulwark-rotary-cannon-v1";
  if (weaponId === "grenade-tube") return "grenade-tube-v1";
  return "service-rifle-v1";
}

function isProductionWeaponSheet(weaponId: WeaponId): weaponId is "bolt-carbine" | "bulwark-rotary-cannon" | "grenade-tube" {
  return weaponId === "bolt-carbine" || weaponId === "bulwark-rotary-cannon" || weaponId === "grenade-tube";
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
  assetId: "scuttler-v1" | "egg-cluster-v1" | "brain-blob-v1" | "slime-spitter-v1" | "carapace-scuttler-v1" | "siege-crusher-v1" | "brood-warden-v1" | "rift-stalker-v1" | "blast-mite-v1" | "warp-flanker-v1" | "ripper-v1" | "razor-scuttler-v1" | "quillback-v1" | "spinewheel-v1" | "tether-bloom-v1" | "bastion-eater-v1" | "status-overlays-v1" | "aurum-hoarder-v1" | "swarm-scuttler-v1" | "razorlord-v1" | "blightspitter-v1" | "quillback-matriarch-v1",
): Phaser.GameObjects.Sprite {
  const sprite = scene.add.sprite(0, 0, assetId, 0);
  applyManifestOrigin(sprite, assetId);
  return sprite;
}
