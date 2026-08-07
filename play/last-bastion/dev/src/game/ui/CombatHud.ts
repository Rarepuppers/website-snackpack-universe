import Phaser from "phaser";
import type { CombatScenario, CombatSnapshot, PowerupType } from "../combat/CombatSimulation";
import { DAMAGE_TYPE_COLOURS } from "../combat/damageTypes";
import { armourLabel, healthBarView } from "../stats/formatStat";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import {
  cadenceWeapons,
  cooldownRemainingFraction,
  formatCooldownSeconds,
  weaponTileAbbreviation,
} from "./CooldownPresentation";
import { uiSafeArea, uiTextResolution } from "../rendering/DisplayScaling";
import {
  DEFAULT_CONTROL_BINDINGS,
  gamepadBindingLabel,
  keyboardBindingLabel,
  type ControlBindings,
} from "../input/ControlBindings";
import { canonicalWeaponTileFrame } from "./WeaponTileFrames";
import { combatPalette, type CombatPalette, type ColorVisionMode } from "./CombatPalette";
import {
  bossHudPresentation,
  statusAbbreviation,
  statusHudTiming,
} from "./CombatReadability";

interface CooldownTileView {
  readonly background: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  readonly binding: Phaser.GameObjects.Text;
  readonly timer: Phaser.GameObjects.Text;
  readonly overlay: Phaser.GameObjects.Graphics;
  readonly icon: Phaser.GameObjects.Image | null;
  centreX: number;
  centreY: number;
  readonly size: number;
}

interface StatusTrayView {
  readonly background: Phaser.GameObjects.Arc;
  readonly iconText: Phaser.GameObjects.Text;
  readonly image: Phaser.GameObjects.Image | null;
  readonly timer: Phaser.GameObjects.Text;
  readonly ring: Phaser.GameObjects.Graphics;
  readonly radius: number;
}


export class CombatHud {
  private readonly scene: Phaser.Scene;
  private readonly healthFill: Phaser.GameObjects.Rectangle;
  private readonly shieldFill: Phaser.GameObjects.Rectangle;
  private readonly shieldTrack: Phaser.GameObjects.Rectangle;
  private readonly healthText: Phaser.GameObjects.Text;
  private readonly xpFill: Phaser.GameObjects.Rectangle;
  private readonly xpText: Phaser.GameObjects.Text;
  private readonly waveText: Phaser.GameObjects.Text;
  private readonly statsText: Phaser.GameObjects.Text;
  private readonly scrapIcon: Phaser.GameObjects.Image;
  private readonly scrapText: Phaser.GameObjects.Text;
  private readonly weaponPips: Phaser.GameObjects.Rectangle[] = [];
  private readonly radarDot: Phaser.GameObjects.Arc;
  private readonly radarContacts: Phaser.GameObjects.Arc[] = [];
  private readonly radarRadius: number;
  private readonly fireModePanel: Phaser.GameObjects.Rectangle;
  private readonly fireModeText: Phaser.GameObjects.Text;
  private readonly statePanel: Phaser.GameObjects.Container;
  private readonly stateText: Phaser.GameObjects.Text;
  private readonly debugText: Phaser.GameObjects.Text;
  private readonly bossPanel: Phaser.GameObjects.Container;
  private readonly bossFill: Phaser.GameObjects.Rectangle;
  private readonly bossNumberText: Phaser.GameObjects.Text;
  private readonly bossNameText: Phaser.GameObjects.Text;
  private readonly bossPhaseText: Phaser.GameObjects.Text;
  private readonly productionArt: boolean;
  private readonly cooldownTimersEnabled: boolean;
  private readonly statusTray: StatusTrayView[] = [];
  private readonly actionTiles: CooldownTileView[] = [];
  private readonly cadenceTiles: CooldownTileView[] = [];
  private readonly radarCentre: Readonly<{ x: number; y: number }>;
  private fireModeBindingLabel: string;
  private readonly bindings: ControlBindings;
  private inputDevice: "keyboard" | "gamepad" = "keyboard";
  private readonly uiScale: 0.8 | 1 | 1.2;
  private readonly ownedObjects: Phaser.GameObjects.GameObject[];
  private readonly palette: CombatPalette;
  private previousEvadeReady: boolean | null = null;
  private previousUltimateReady: boolean | null = null;
  private previousKitReady: boolean | null = null;

  constructor(
    scene: Phaser.Scene,
    showDebug: boolean,
    productionArt = true,
    cooldownTimersEnabled = true,
    bindings: ControlBindings = DEFAULT_CONTROL_BINDINGS,
    radarSize: 0.75 | 1 | 1.25 = 1,
    uiScale: 0.8 | 1 | 1.2 = 1,
    colorVisionMode: ColorVisionMode = "standard",
  ) {
    const hudChildrenStart = scene.children.list.length;
    this.scene = scene;
    this.productionArt = productionArt;
    this.cooldownTimersEnabled = cooldownTimersEnabled;
    this.bindings = bindings;
    this.uiScale = uiScale;
    this.palette = combatPalette(colorVisionMode);
    const s = uiScale;
    const safe = uiSafeArea(scene.scale.width, scene.scale.height);
    this.radarRadius = 24 * radarSize * s;
    this.radarCentre = { x: safe.right - this.radarRadius, y: safe.top + this.radarRadius };
    this.fireModeBindingLabel = keyboardBindingLabel(bindings.keyboard.toggleFireMode);

    // Slim top-left dock: identity, HP, XP, Scrap. Code-drawn flat panel by
    // creator direction (18 Jul review) — minimal chrome, maximum play space.
    const dockWidth = 246 * s;
    scene.add.rectangle(safe.left, safe.top, dockWidth, 54 * s, 0x0b121c, 0.82).setOrigin(0)
      .setStrokeStyle(1, 0x334a60).setDepth(2000);
    this.statsText = scene.add.text(safe.left + 10 * s, safe.top + 5 * s, "", hudText("#c7d6e4", "10px")).setDepth(2001);
    scene.add.rectangle(safe.left + 10 * s, safe.top + 22 * s, 148 * s, 7 * s, 0x24131a).setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x6e3442).setDepth(2001);
    this.healthFill = scene.add.rectangle(safe.left + 11 * s, safe.top + 22 * s, 146 * s, 5 * s, 0xe55a67).setOrigin(0, 0.5).setDepth(2002);
    this.healthText = scene.add.text(safe.left + 164 * s, safe.top + 17 * s, "", hudText("#e8929a", "10px")).setDepth(2001);
    // Shield rides directly under the health bar on the SAME pixel-per-point
    // scale (146px = maxHealth), not as its own full-width bar. Shield totals
    // are small — Shield Capacitor grants 1.5 a level against a health pool in
    // the tens — so a full-width bar would imply a second health pool.
    this.shieldTrack = scene.add.rectangle(safe.left + 10 * s, safe.top + 28 * s, 148 * s, 3 * s, 0x10202f)
      .setOrigin(0, 0.5).setDepth(2001).setVisible(false);
    this.shieldFill = scene.add.rectangle(safe.left + 11 * s, safe.top + 28 * s, 146 * s, 2 * s, 0x4f9dff)
      .setOrigin(0, 0.5).setDepth(2002).setVisible(false);
    scene.add.rectangle(safe.left + 10 * s, safe.top + 34 * s, 148 * s, 6 * s, 0x102b31).setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x346d76).setDepth(2001);
    this.xpFill = scene.add.rectangle(safe.left + 11 * s, safe.top + 34 * s, 146 * s, 4 * s, 0x5de2e7).setOrigin(0, 0.5).setDepth(2002);
    this.xpText = scene.add.text(safe.left + 164 * s, safe.top + 29 * s, "", hudText("#7fd6da", "10px")).setDepth(2001);
    this.scrapIcon = scene.add.image(safe.left + 11 * s, safe.top + 42 * s, "scrap-shop-hud-v1", 0)
      .setDisplaySize(16 * s, 16 * s).setOrigin(0, 0.5).setDepth(2002).setVisible(false);
    this.scrapText = scene.add.text(safe.left + 24 * s, safe.top + 37 * s, "", hudText("#ffd36b", "10px"))
      .setDepth(2002).setVisible(false);
    for (let index = 0; index < 12; index += 1) {
      this.weaponPips.push(scene.add.rectangle(safe.left + (140 + index * 9) * s, safe.top + 42 * s, 7 * s, 5 * s, 0x273747)
        .setStrokeStyle(1, 0x4f6e8d).setDepth(2001));
    }
    for (let index = 0; index < 6; index += 1) {
      this.statusTray.push(createStatusTrayView(scene, safe.left + (22 + index * 44) * s, safe.top + 82 * s, productionArt, s));
    }

    // Top-centre: wave and timer only. Roll/ultimate readiness already lives
    // on the bottom action bar, so the old dedicated panel is redundant.
    scene.add.rectangle(480, safe.top, 190 * s, 26 * s, 0x0b121c, 0.82).setOrigin(0.5, 0)
      .setStrokeStyle(1, 0x334a60).setDepth(2000);
    this.waveText = scene.add.text(480, safe.top + 5 * s, "", hudText("#ffffff", "13px"))
      .setOrigin(0.5, 0).setDepth(2001);

    scene.add.circle(this.radarCentre.x, this.radarCentre.y, this.radarRadius, 0x0b121c, 0.82)
      .setStrokeStyle(1, 0x334a60).setDepth(2000);
    this.radarDot = scene.add.circle(this.radarCentre.x, this.radarCentre.y, 3 * s, 0x68e4e8).setDepth(2002);
    for (let index = 0; index < 64; index += 1) {
      this.radarContacts.push(scene.add.circle(this.radarCentre.x, this.radarCentre.y, 1.5 * s, 0xe55a67)
        .setDepth(2001).setVisible(false));
    }
    const fireModeY = safe.top + this.radarRadius * 2 + 12 * s;
    this.fireModePanel = scene.add.rectangle(safe.right - 40 * s, fireModeY, 80 * s, 18 * s, 0x0b121c, 0.88)
      .setStrokeStyle(1, 0x68e4e8).setDepth(2000);
    this.fireModeText = scene.add.text(safe.right - 40 * s, fireModeY, "", hudText("#68e4e8", "9px"))
      .setOrigin(0.5).setDepth(2001);

    const actionDefinitions = [
      { label: "ROLL", binding: keyboardBindingLabel(bindings.keyboard.evade), color: 0x68e4e8, frame: 0 },
      { label: "ULT", binding: keyboardBindingLabel(bindings.keyboard.ultimate), color: 0xffa31a, frame: 1 },
      { label: "KIT", binding: keyboardBindingLabel(bindings.keyboard.kit), color: 0x9f7aea, frame: 2 },
      { label: "ACT", binding: keyboardBindingLabel(bindings.keyboard.interact), color: 0xb9ef62, frame: 7 },
    ] as const;
    actionDefinitions.forEach((definition, index) => {
      this.actionTiles.push(createCooldownTile(
        scene,
        480 + (378 + index * 68 - 480) * s,
        safe.bottom - 26 * s,
        54 * s,
        definition.label,
        definition.binding,
        definition.color,
        productionArt ? definition.frame : undefined,
      ));
    });
    for (let index = 0; index < 6; index += 1) {
      const tile = createCooldownTile(scene, 480, safe.bottom - 79 * s, 34 * s, "", "AUTO", 0xffb982, productionArt ? 2 : undefined);
      setCooldownTileVisible(tile, false);
      this.cadenceTiles.push(tile);
    }

    const stateBackground = productionArt
      ? scene.add.image(0, 0, "hud-panels-v1", 4).setDisplaySize(440 * s, 138 * s)
      : scene.add.rectangle(0, 0, 440 * s, 138 * s, 0x0b121c, 0.96).setStrokeStyle(3, 0x68e4e8);
    this.stateText = scene.add.text(0, 0, "", {
      ...hudText("#ffffff", "24px"),
      align: "center",
      stroke: "#101720",
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.statePanel = scene.add.container(480, 270, [stateBackground, this.stateText])
      .setDepth(2100).setVisible(false);

    this.debugText = scene.add.text(safe.left, safe.bottom - 23 * s, "", {
      ...hudText("#8fb2c9", "10px"),
      backgroundColor: "#0b121ccc",
      padding: { x: 5, y: 3 },
    }).setDepth(2000).setVisible(showDebug);

    // Minimal boss readout (18 Jul creator direction): name above a single
    // horizontal bar, with the health number set inside the bar itself. No
    // portrait — the name and phase already identify the threat.
    this.bossNameText = scene.add.text(0, -18, "", hudText("#ffb15c", "13px")).setOrigin(0.5);
    const bossBar = scene.add.rectangle(0, 2, 460, 16, 0x2b1714)
      .setOrigin(0.5).setStrokeStyle(1, 0x75382d);
    this.bossFill = scene.add.rectangle(-228, 2, 456, 12, 0xe5493a)
      .setOrigin(0, 0.5);
    this.bossNumberText = scene.add.text(0, 2, "", {
      ...hudText("#fff1dc", "11px"),
      stroke: "#2b1714",
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.bossPhaseText = scene.add.text(0, 16, "", hudText("#c48f6c", "9px")).setOrigin(0.5);
    this.bossPanel = scene.add.container(480, 60, [bossBar, this.bossFill, this.bossNameText, this.bossNumberText, this.bossPhaseText])
      .setScale(s).setDepth(2050).setVisible(false);

    this.ownedObjects = scene.children.list.slice(hudChildrenStart);
    for (const child of this.ownedObjects) {
      if (
        child instanceof Phaser.GameObjects.Text
        || child instanceof Phaser.GameObjects.Rectangle
        || child instanceof Phaser.GameObjects.Image
        || child instanceof Phaser.GameObjects.Container
        || child instanceof Phaser.GameObjects.Graphics
        || child instanceof Phaser.GameObjects.Arc
      ) {
        if (child.depth < 2000) continue;
        child.setScrollFactor(0);
      }
      if (child instanceof Phaser.GameObjects.Text) {
        const baseFontSize = Number.parseFloat(String(child.style.fontSize));
        if (Number.isFinite(baseFontSize)) child.setFontSize(Math.round(baseFontSize * this.uiScale));
        child.setResolution(uiTextResolution());
      }
    }
  }

  destroy(): void {
    for (const child of this.ownedObjects) {
      if (child.active) child.destroy();
    }
  }

  setInputDevice(device: "keyboard" | "gamepad"): void {
    if (this.inputDevice === device) return;
    this.inputDevice = device;
    this.fireModeBindingLabel = device === "gamepad"
      ? gamepadBindingLabel(this.bindings.gamepad.toggleFireMode)
      : keyboardBindingLabel(this.bindings.keyboard.toggleFireMode);
    (["evade", "ultimate", "kit", "interact"] as const).forEach((action, index) => {
      this.actionTiles[index]?.binding.setText(device === "gamepad"
        ? gamepadBindingLabel(this.bindings.gamepad[action])
        : keyboardBindingLabel(this.bindings.keyboard[action]));
    });
  }

  update(
    snapshot: CombatSnapshot,
    paused: boolean,
    activeEffectCount: number,
    performanceLabel = "",
  ): void {
    // Clamped: without this the fill scales past 1 and overflows its frame the
    // moment health can exceed maximum (see the overheal note in the plan).
    const bars = healthBarView(
      snapshot.playerHealth,
      snapshot.playerMaxHealth,
      snapshot.playerShield,
      snapshot.playerMaxShield,
    );
    this.healthFill.setScale(Math.max(bars.healthFraction, 0.001), 1);
    this.shieldTrack.setVisible(bars.shieldTrackVisible);
    this.shieldFill.setVisible(bars.shieldFillVisible)
      .setScale(Math.max(bars.shieldFraction, 0.001), 1);
    this.xpFill.setScale(Math.max(snapshot.experience / snapshot.experienceForNextLevel, 0.001), 1);
    const evasiveCooldownDuration = snapshot.heroPresentation.evasiveDurationSeconds
      + snapshot.heroPresentation.evasiveRecoverySeconds;
    const timedWaveSuffix = snapshot.density.timerEndsWave
      && snapshot.density.waveDurationSeconds !== null
      && snapshot.status === "combat"
      ? `  •  ${Math.max(0, Math.ceil(snapshot.density.waveDurationSeconds - snapshot.density.waveElapsedSeconds))}s`
      : "";
    this.waveText.setText(snapshot.scenario
      ? SCENARIO_LABELS[snapshot.scenario]
      : snapshot.stressProfile
        ? `STRESS ${snapshot.stressProfile}`
        : `WAVE ${snapshot.waveNumber}/${snapshot.totalWaves}${timedWaveSuffix}`);
    const shieldLabel = snapshot.playerShield > 0 ? `  +SH${Math.ceil(snapshot.playerShield)}` : "";
    const passiveState = snapshot.heroPresentation.id === "marine"
      ? snapshot.playerEntrenched ? "  ENTRENCHED" : ""
      : snapshot.heroPresentation.id === "medic" ? `  TRIAGE ${snapshot.medicTriageHits}/6` : "";
    const flags = `${snapshot.playerSlowed ? "  SLOWED" : ""}${snapshot.playerTethered ? "  TETHERED" : ""}${passiveState}`;
    this.statsText.setText(
      `${snapshot.heroPresentation.displayName.toUpperCase()}  •  LV ${snapshot.level}`
      + `${armourLabel(snapshot.playerArmour, snapshot.playerFlatDamageReduction)}${flags}`,
    );
    this.healthText.setText(`${Math.ceil(snapshot.playerHealth)}/${snapshot.playerMaxHealth}${shieldLabel}`);
    this.xpText.setText(`${snapshot.experience}/${snapshot.experienceForNextLevel}`);
    const scrapVisible = snapshot.securedScrap > 0 || snapshot.scenario === "scrap-shop";
    const secured = snapshot.events.some((event) => event.type === "scrap-secured");
    const spent = snapshot.events.some((event) => event.type === "scrap-spent");
    this.scrapIcon.setVisible(scrapVisible).setFrame(spent ? 2 : secured ? 1 : 0);
    this.scrapText.setVisible(scrapVisible).setText(`${snapshot.securedScrap}`);
    const playerRadar = radarPosition(snapshot.playerPosition, snapshot.arena, this.radarCentre, this.radarRadius);
    this.radarDot.setPosition(playerRadar.x, playerRadar.y);
    this.radarContacts.forEach((contact, index) => {
      const enemy = snapshot.enemies[index];
      if (!enemy) {
        contact.setVisible(false);
        return;
      }
      const point = radarPosition(enemy.position, snapshot.arena, this.radarCentre, this.radarRadius);
      const major = enemy.rank === "boss" || enemy.rank === "mini-boss";
      contact.setPosition(point.x, point.y)
        .setRadius(major ? 2.5 : enemy.rank === "elite" ? 2 : 1.5)
        .setFillStyle(major
          ? this.palette.bossThreat
          : enemy.rank === "elite" ? this.palette.eliteThreat : this.palette.standardThreat)
        .setVisible(true);
    });
    this.fireModePanel.setStrokeStyle(1, snapshot.autoFireEnabled ? 0x68e4e8 : 0xffb15c);
    this.fireModeText
      .setText(snapshot.autoFireEnabled ? `${this.fireModeBindingLabel} AUTO` : `${this.fireModeBindingLabel} MANUAL`)
      .setColor(snapshot.autoFireEnabled ? "#68e4e8" : "#ffb15c");
    this.statusTray.forEach((view, index) => {
      const buff = snapshot.activeBuffs[index];
      if (!buff) {
        setStatusTrayVisible(view, false);
        return;
      }
      setStatusTrayVisible(view, true);
      updateStatusTrayView(view, buff.type, buff.remainingSeconds, buff.durationSeconds);
    });
    updateCooldownTile(
      this.actionTiles[0]!, snapshot.evasiveCooldownRemainingSeconds,
      evasiveCooldownDuration, snapshot.evasiveReady, false,
      this.cooldownTimersEnabled,
    );
    this.actionTiles[0]!.label.setText(this.actionTiles[0]!.icon ? "" : snapshot.heroPresentation.evasiveName.toUpperCase());
    if (snapshot.evasiveReady && this.previousEvadeReady === false) this.flashActionTile(this.actionTiles[0]!);
    this.previousEvadeReady = snapshot.evasiveReady;
    updateCooldownTile(
      this.actionTiles[1]!, snapshot.ultimateCooldownRemainingSeconds,
      snapshot.heroPresentation.ultimateCooldownSeconds, snapshot.ultimateReady, false,
      this.cooldownTimersEnabled,
    );
    this.actionTiles[1]!.label.setText(this.actionTiles[1]!.icon ? "" : snapshot.heroPresentation.ultimateName.toUpperCase());
    if (snapshot.ultimateReady && this.previousUltimateReady === false) this.flashActionTile(this.actionTiles[1]!);
    this.previousUltimateReady = snapshot.ultimateReady;
    this.actionTiles[2]!.label.setText(
      this.actionTiles[2]!.icon ? "" : snapshot.uraniumKitAvailable ? "U-25" : "KIT",
    );
    this.actionTiles[2]!.icon?.setFrame(snapshot.uraniumKitAvailable ? 3 : 4);
    updateCooldownTile(
      this.actionTiles[2]!, 0, 1, snapshot.uraniumKitAvailable, !snapshot.uraniumKitAvailable,
      this.cooldownTimersEnabled,
    );
    if (snapshot.uraniumKitAvailable && this.previousKitReady === false) this.flashActionTile(this.actionTiles[2]!);
    this.previousKitReady = snapshot.uraniumKitAvailable;
    const nearbyChest = snapshot.supplyChests.find((chest) => chest.variant === "sealed" && chest.playerInRange);
    const fenceReady = Boolean(snapshot.fence?.playerNearSwitch && snapshot.fence.ready);
    const canInteract = Boolean(nearbyChest) || fenceReady;
    updateCooldownTile(this.actionTiles[3]!, 0, 1, canInteract, !canInteract, this.cooldownTimersEnabled);
    if (canInteract) {
      this.actionTiles[3]!.timer.setVisible(true).setText(nearbyChest ? "OPEN" : "FENCE").setColor("#b9ef62");
    }

    const slowWeapons = cadenceWeapons(snapshot.equippedWeapons).slice(0, this.cadenceTiles.length);
    this.cadenceTiles.forEach((tile, index) => {
      const weapon = slowWeapons[index];
      if (!weapon) {
        setCooldownTileVisible(tile, false);
        return;
      }
      moveCooldownTile(
        tile,
        480 + (index - (slowWeapons.length - 1) / 2) * 42 * this.uiScale,
        uiSafeArea(this.scene.scale.width, this.scene.scale.height).bottom - 79 * this.uiScale,
      );
      setCooldownTileVisible(tile, true);
      tile.label.setText(tile.icon ? "" : weaponTileAbbreviation(weapon.weaponId));
      if (tile.icon) {
        tile.icon.setTexture("batch-i-weapon-tiles-v1", canonicalWeaponTileFrame(weapon.weaponId))
          .setVisible(true);
      }
      tile.binding.setText(weapon.stats.firesAutomatically ? "SYNC" : snapshot.autoFireEnabled ? "AUTO" : "FIRE");
      updateCooldownTile(
        tile,
        weapon.cooldownRemainingSeconds,
        weapon.cooldownDurationSeconds,
        weapon.cooldownRemainingSeconds <= 0,
        false,
        this.cooldownTimersEnabled,
      );
    });
    this.weaponPips.forEach((pip, index) => {
      const weapon = snapshot.equippedWeapons[index];
      pip.setFillStyle(weapon ? weaponPipColor(weapon.weaponId) : 0x273747);
    });
    this.debugText.setText(
      `state=${snapshot.heroState} enemies=${snapshot.enemies.length}/${snapshot.density.liveCap || "-"} peak=${snapshot.density.peakLiveEnemies} threat=${snapshot.density.threatSpawned}/${snapshot.density.threatBudget} queue=${snapshot.density.queuedSpawns} hostile=${snapshot.enemyProjectiles.length}/${snapshot.density.projectileBudget} pPeak=${snapshot.density.peakEnemyProjectiles} blocked=${snapshot.density.spawnCapBlockedSeconds.toFixed(1)}s effects=${activeEffectCount}${performanceLabel ? ` perf=${performanceLabel}` : ""}`,
    );
    const boss = snapshot.enemies.find((enemy) => enemy.rank === "boss" || enemy.rank === "mini-boss");
    const bossModel = bossHudPresentation(snapshot.enemies);
    this.bossPanel.setVisible(Boolean(boss));
    if (boss) {
      const healthRatio = boss.health / boss.maxHealth;
      this.bossFill.setScale(Math.max(healthRatio, 0.001), 1)
        .setFillStyle(healthRatio <= 0.2 ? 0xff8a3d : 0xe5493a);
      const enrage = healthRatio <= 0.2 ? "FRENZY" : healthRatio <= 0.5 ? "ENRAGED" : "";
      const isBrood = boss.miniBossKind === "brood-warden";
      const isRift = boss.miniBossKind === "rift-stalker";
      const isSynapse = boss.miniBossKind === "synapse-herald";
      const isAssembly = boss.miniBossKind === "assembly-prime";
      const isRegent = boss.miniBossKind === "storm-regent";
      const isAbominationPrime = boss.miniBossKind === "abomination-prime";
      const isFinalBoss = boss.type === "bastion-eater";
      const name = isFinalBoss ? "THE BASTION EATER" : isBrood ? "BROOD WARDEN" : isRift ? "RIFT STALKER" : isSynapse ? "SYNAPSE HERALD" : isAssembly ? "ASSEMBLY PRIME" : isRegent ? "STORM REGENT" : isAbominationPrime ? "ABOMINATION PRIME" : "SIEGE CRUSHER";
      const phase = isFinalBoss ? boss.bastionEaterPhase : isBrood ? boss.broodWardenPhase : isRift ? boss.riftStalkerPhase : isSynapse ? boss.synapseHeraldPhase : isAssembly ? boss.assemblyPrimePhase : isRegent ? boss.stormRegentPhase : isAbominationPrime ? boss.abominationPrimePhase : boss.siegeCrusherPhase;
      this.bossNameText.setText(bossModel?.name ?? name);
      this.bossNumberText.setText(bossModel?.healthLabel ?? `${Math.ceil(boss.health)} / ${boss.maxHealth}`);
      this.bossPhaseText.setText(`${(phase ?? "stalk").toUpperCase()}${enrage ? `  •  ${enrage}` : ""}`);
    }
    if (bossModel) this.bossPhaseText.setText(bossModel.phaseLabel);

    let message = "";
    if (paused) message = "PAUSED\nESC  RESUME   •   X  ABANDON RUN";
    else if (snapshot.status === "intermission") message = "WAVE CLEARED";
    else if (snapshot.status === "victory") message = "BASTION SECURED\nPress Enter to restart";
    else if (snapshot.status === "defeat") message = `${snapshot.heroPresentation.displayName.toUpperCase()} DOWN\nPress Enter to restart`;
    this.stateText.setText(message);
    this.stateText.setFontSize(paused ? Math.round(16 * this.uiScale) : Math.round(24 * this.uiScale));
    this.statePanel.setVisible(message.length > 0);
  }

  private flashActionTile(tile: CooldownTileView): void {
    this.scene.tweens.killTweensOf([tile.background, tile.icon].filter(Boolean));
    tile.background.setAlpha(1);
    tile.icon?.setAlpha(1);
    this.scene.tweens.add({
      targets: [tile.background, ...(tile.icon ? [tile.icon] : [])],
      alpha: 0.42,
      duration: 100,
      yoyo: true,
      repeat: 1,
    });
  }
}

function createStatusTrayView(
  scene: Phaser.Scene,
  x: number,
  y: number,
  productionArt: boolean,
  scale = 1,
): StatusTrayView {
  const radius = 19 * scale;
  const background = scene.add.circle(x, y, radius, 0x101923, 0.98)
    .setStrokeStyle(2, 0x52677b).setDepth(2020).setVisible(false);
  const iconText = scene.add.text(x, y - 3 * scale, "", hudText("#ffffff", "10px"))
    .setOrigin(0.5).setDepth(2021).setVisible(false);
  const image = productionArt
    ? scene.add.image(x, y - 2 * scale, "uranium-status-v1").setDisplaySize(30 * scale, 30 * scale).setDepth(2021).setVisible(false)
    : null;
  const timer = scene.add.text(x, y + 11 * scale, "", hudText("#ffffff", "8px"))
    .setOrigin(0.5).setDepth(2023).setVisible(false);
  const ring = scene.add.graphics().setDepth(2022).setVisible(false);
  return { background, iconText, image, timer, ring, radius };
}

function setStatusTrayVisible(view: StatusTrayView, visible: boolean): void {
  view.background.setVisible(visible);
  view.iconText.setVisible(visible && view.image === null);
  view.image?.setVisible(visible);
  view.timer.setVisible(visible);
  view.ring.setVisible(visible);
  if (!visible) view.ring.clear();
}

function updateStatusTrayView(
  view: StatusTrayView,
  type: PowerupType,
  remainingSeconds: number,
  durationSeconds: number,
): void {
  const x = view.background.x;
  const y = view.background.y;
  const timing = statusHudTiming(remainingSeconds, durationSeconds);
  view.background.setFillStyle(statusColor(type), 0.3)
    .setStrokeStyle(2, timing.urgent ? 0xffc35a : statusColor(type), 0.95);
  view.iconText.setText(statusAbbreviation(type));
  if (view.image) {
    if (type === "uranium-core-rounds") view.image.setTexture("uranium-status-v1");
    else view.image.setTexture("batch-c-rewards-v1", statusRewardFrame(type));
  }
  view.timer.setText(timing.timerLabel).setColor(timing.urgent ? "#ffd36b" : "#ffffff");
  view.ring.clear();
  view.ring.lineStyle(Math.max(2, view.radius * 4 / 19), 0x071018, 0.88).beginPath()
    .arc(x, y, view.radius + 2, -Math.PI / 2, Math.PI * 1.5, false).strokePath();
  if (timing.fraction > 0) {
    view.ring.lineStyle(Math.max(2, view.radius * 3 / 19), timing.urgent ? 0xffc35a : statusColor(type), 1).beginPath()
      .arc(x, y, view.radius + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timing.fraction, false).strokePath();
  }
}

function statusColor(type: PowerupType): number {
  switch (type) {
    case "overcharge": return 0xffa347;
    case "adrenaline": return 0xff6a70;
    case "magnet-pulse": return 0x70dce8;
    case "uranium-core-rounds": return 0xb9ef62;
    case "siege-loader": return 0xc9862f;
    case "phase-jacket": return 0x5adfe0;
    case "hunter-optics": return 0xe8b24a;
    case "last-stand-stimulant": return 0xff4d5e;
    default: return 0x9f7aea;
  }
}

function statusRewardFrame(type: PowerupType): number {
  switch (type) {
    case "overcharge": return 12;
    case "magnet-pulse": return 14;
    case "adrenaline": return 15;
    // Placeholder frames pending dedicated HUD icon art; colour + abbreviation
    // are the primary visual distinction until then.
    case "siege-loader": return 12;
    case "phase-jacket": return 13;
    case "hunter-optics": return 14;
    case "last-stand-stimulant": return 15;
    default: return 13;
  }
}

function weaponPipColor(weaponId: string): number {
  if (weaponId === "scattergun") return 0xff9a72;
  if (weaponId === "arc-carbine") return 0x68e4e8;
  if (weaponId === "patrol-blade") return 0xffd08a;
  if (weaponId === "bolt-carbine") return 0x94efff;
  if (weaponId === "bulwark-rotary-cannon") return 0xff9b42;
  if (weaponId === "grenade-tube") return 0xffb23f;
  // Weapons without an authored pip colour fall back to their damage type
  // rather than one shared amber, so the thirteen released on 26 July 2026
  // separate into fire/shock/cryo/toxic families at a glance.
  const stats = WEAPON_CATALOG[weaponId as WeaponId];
  return stats ? DAMAGE_TYPE_COLOURS[stats.damageType] : 0xffa31a;
}

function createCooldownTile(
  scene: Phaser.Scene,
  centreX: number,
  centreY: number,
  size: number,
  label: string,
  binding: string,
  color: number,
  iconFrame?: number,
): CooldownTileView {
  const background = scene.add.rectangle(centreX, centreY, size, size, 0x111a25, 0.96)
    .setStrokeStyle(2, color, 0.95).setDepth(2020);
  const labelText = scene.add.text(centreX, centreY - 5, iconFrame === undefined ? label : "", hudText("#edf4ff", size >= 50 ? "11px" : "9px"))
    .setOrigin(0.5).setDepth(2022);
  const icon = iconFrame === undefined
    ? null
    : scene.add.image(centreX, centreY, "batch-i-hotkey-tiles-v1", iconFrame)
      .setDisplaySize(size - 6, size - 6).setDepth(2021);
  const bindingText = scene.add.text(centreX, centreY - size / 2 - 8, binding, hudText("#9fb3c8", "8px"))
    .setOrigin(0.5).setDepth(2022);
  const timer = scene.add.text(centreX, centreY + size * 0.24, "", hudText("#ffffff", size >= 50 ? "11px" : "9px"))
    .setOrigin(0.5).setDepth(2023);
  const overlay = scene.add.graphics().setDepth(2021);
  return { background, label: labelText, binding: bindingText, timer, overlay, icon, centreX, centreY, size };
}

function updateCooldownTile(
  tile: CooldownTileView,
  remainingSeconds: number,
  durationSeconds: number,
  ready: boolean,
  disabled: boolean,
  cooldownTimersEnabled: boolean,
): void {
  tile.overlay.clear();
  if (disabled) {
    tile.background.setFillStyle(0x10151c, 0.92).setStrokeStyle(2, 0x394754, 0.72);
    tile.label.setColor("#657482");
    tile.icon?.setAlpha(0.34);
    tile.timer.setText("—").setColor("#657482");
    return;
  }
  tile.background.setFillStyle(0x111a25, 0.96)
    .setStrokeStyle(ready ? 3 : 2, ready ? 0xeaf8ff : 0x587087, ready ? 1 : 0.9);
  tile.label.setColor(ready ? "#ffffff" : "#c8d4df");
  tile.icon?.setAlpha(ready ? 1 : 0.68);
  tile.timer.setVisible(cooldownTimersEnabled);
  tile.timer.setColor(remainingSeconds <= 1 && remainingSeconds > 0 ? "#ffd36b" : "#ffffff")
    .setText(formatCooldownSeconds(remainingSeconds));
  const fraction = cooldownRemainingFraction(remainingSeconds, durationSeconds);
  if (fraction > 0) {
    drawCooldownWedge(tile.overlay, tile.centreX, tile.centreY, tile.size * 0.47, fraction);
  }
}

function drawCooldownWedge(
  graphics: Phaser.GameObjects.Graphics,
  centreX: number,
  centreY: number,
  radius: number,
  fraction: number,
): void {
  const start = -Math.PI / 2;
  const segments = Math.max(4, Math.ceil(28 * fraction));
  graphics.fillStyle(0x02070c, 0.7).beginPath().moveTo(centreX, centreY);
  for (let index = 0; index <= segments; index += 1) {
    const angle = start + Math.PI * 2 * fraction * index / segments;
    graphics.lineTo(centreX + Math.cos(angle) * radius, centreY + Math.sin(angle) * radius);
  }
  graphics.closePath().fillPath();
}

function moveCooldownTile(tile: CooldownTileView, x: number, y: number): void {
  const dx = x - tile.centreX;
  const dy = y - tile.centreY;
  tile.centreX = x;
  tile.centreY = y;
  tile.background.setPosition(x, y);
  tile.label.setPosition(tile.label.x + dx, tile.label.y + dy);
  tile.binding.setPosition(tile.binding.x + dx, tile.binding.y + dy);
  tile.timer.setPosition(tile.timer.x + dx, tile.timer.y + dy);
  tile.icon?.setPosition(tile.icon.x + dx, tile.icon.y + dy);
}

function setCooldownTileVisible(tile: CooldownTileView, visible: boolean): void {
  tile.background.setVisible(visible);
  tile.label.setVisible(visible);
  tile.binding.setVisible(visible);
  tile.timer.setVisible(visible);
  tile.overlay.setVisible(visible);
  tile.icon?.setVisible(visible);
  if (!visible) tile.overlay.clear();
}

/**
 * Exhaustive by construction (`Record<CombatScenario, string>`): a new
 * scenario id that forgets a label fails to compile instead of silently
 * falling through to a stale name, as `rift-stalker` briefly did.
 */
const SCENARIO_LABELS: Readonly<Record<CombatScenario, string>> = Object.freeze({
  "slime-spitter": "SPITTER LAB",
  "carapace-elite": "ELITE LAB",
  "siege-crusher": "CRUSHER LAB",
  "brood-warden": "BROOD LAB",
  "rift-stalker": "RIFT LAB",
  "synapse-herald": "SYNAPSE HERALD LAB",
  "assembly-prime": "ASSEMBLY PRIME LAB",
  "storm-regent": "STORM REGENT LAB",
  "abomination-prime": "ABOMINATION PRIME LAB",
  "infected-survivor": "SURVIVOR LAB",
  "corrupted-marine": "MARINE LAB",
  abomination: "ABOMINATION LAB",
  "corrupted-human": "OUTBREAK LAB",
  "nest-weaver": "NEST WEAVER LAB",
  "storm-savant": "STORM SAVANT LAB",
  "scrap-skitterer": "SCRAP SKITTERER LAB",
  "arc-warden": "ARC WARDEN LAB",
  "cyborg-reclaimer": "CYBORG RECLAIMER LAB",
  "foundry-fabricator": "FOUNDRY FABRICATOR LAB",
  ripper: "RIPPER LAB",
  "razor-scuttler": "RAZOR LAB",
  quillback: "QUILLBACK LAB",
  spinewheel: "SPINEWHEEL LAB",
  "tether-bloom": "TETHER LAB",
  "bastion-eater": "FINAL BOSS LAB",
  "density-capacity": "DENSITY 56 LAB",
  "aurum-hoarder": "AURUM LAB",
  "scrap-shop": "SCRAP SHOP LAB",
  "weapon-gate": "WEAPON GATE LAB",
  "batch-j": "BATCH J LAB",
});

function radarPosition(
  position: Readonly<{ x: number; y: number }>,
  arena: Readonly<{ widthMetres: number; heightMetres: number }>,
  centre: Readonly<{ x: number; y: number }>,
  radius: number,
): Readonly<{ x: number; y: number }> {
  const offsetX = (position.x / arena.widthMetres - 0.5) * 2;
  const offsetY = (position.y / arena.heightMetres - 0.5) * 2;
  const distance = Math.hypot(offsetX, offsetY);
  const scale = distance > 1 ? 1 / distance : 1;
  const usableRadius = Math.max(2, radius - 4);
  return {
    x: centre.x + offsetX * scale * usableRadius,
    y: centre.y + offsetY * scale * usableRadius,
  };
}

function hudText(color: string, fontSize: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color,
    fontFamily: "Consolas, Courier New, monospace",
    fontSize,
    stroke: "#081018",
    strokeThickness: 1,
  };
}
