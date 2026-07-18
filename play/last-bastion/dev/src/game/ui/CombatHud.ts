import Phaser from "phaser";
import type { CombatSnapshot, PowerupType } from "../combat/CombatSimulation";
import { MARINE } from "../hero/marine";
import { PROTOTYPE_EVASIVE_RECOVERY_SECONDS } from "../hero/HeroMotionController";
import {
  cadenceWeapons,
  cooldownRemainingFraction,
  formatCooldownSeconds,
  weaponTileAbbreviation,
} from "./CooldownPresentation";
import { uiTextResolution } from "../rendering/DisplayScaling";

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
}

export class CombatHud {
  private readonly healthFill: Phaser.GameObjects.Rectangle;
  private readonly xpFill: Phaser.GameObjects.Rectangle;
  private readonly rollFill: Phaser.GameObjects.Rectangle;
  private readonly waveText: Phaser.GameObjects.Text;
  private readonly statsText: Phaser.GameObjects.Text;
  private readonly scrapIcon: Phaser.GameObjects.Image;
  private readonly scrapText: Phaser.GameObjects.Text;
  private readonly rollText: Phaser.GameObjects.Text;
  private readonly weaponPips: Phaser.GameObjects.Rectangle[] = [];
  private readonly statePanel: Phaser.GameObjects.Container;
  private readonly stateText: Phaser.GameObjects.Text;
  private readonly debugText: Phaser.GameObjects.Text;
  private readonly bossPanel: Phaser.GameObjects.Container;
  private readonly bossFill: Phaser.GameObjects.Rectangle;
  private readonly bossText: Phaser.GameObjects.Text;
  private readonly bossPortrait: Phaser.GameObjects.Image;
  private readonly bossFallback: Phaser.GameObjects.Arc;
  private readonly productionArt: boolean;
  private readonly cooldownTimersEnabled: boolean;
  private readonly statusTray: StatusTrayView[] = [];
  private readonly actionTiles: CooldownTileView[] = [];
  private readonly cadenceTiles: CooldownTileView[] = [];

  constructor(scene: Phaser.Scene, showDebug: boolean, productionArt = true, cooldownTimersEnabled = true) {
    this.productionArt = productionArt;
    this.cooldownTimersEnabled = cooldownTimersEnabled;
    const panel = productionArt
      ? scene.add.image(18, 14, "hud-panels-v1", 0).setOrigin(0).setDisplaySize(382, 104).setDepth(2000)
      : scene.add.rectangle(18, 14, 382, 104, 0x0b121c, 0.94)
        .setOrigin(0).setStrokeStyle(2, 0x4d6a83).setDepth(2000);
    scene.add.text(30, 22, "MARINE", hudText("#edf4ff", "14px")).setDepth(2001);
    scene.add.text(30, 43, "HP", hudText("#9fb3c8", "11px")).setDepth(2001);
    scene.add.rectangle(61, 50, 190, 12, 0x24131a).setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x6e3442).setDepth(2001);
    this.healthFill = scene.add.rectangle(63, 50, 186, 8, 0xe55a67).setOrigin(0, 0.5).setDepth(2002);
    scene.add.text(30, 67, "XP", hudText("#9fb3c8", "11px")).setDepth(2001);
    scene.add.rectangle(61, 74, 190, 10, 0x102b31).setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x346d76).setDepth(2001);
    this.xpFill = scene.add.rectangle(63, 74, 186, 6, 0x5de2e7).setOrigin(0, 0.5).setDepth(2002);
    if (productionArt) {
      scene.add.image(480, 14, "hud-panels-v1", 2).setOrigin(0.5, 0).setDisplaySize(250, 74).setDepth(2000);
    }
    this.waveText = scene.add.text(productionArt ? 480 : 268, 26, "", hudText("#ffffff", "13px"))
      .setOrigin(productionArt ? 0.5 : 0, 0).setDepth(2001);
    this.statsText = scene.add.text(268, 50, "", hudText("#9fb3c8", "11px")).setDepth(2001);
    this.scrapIcon = scene.add.image(278, 91, "scrap-shop-hud-v1", 0)
      .setDisplaySize(30, 30).setDepth(2002).setVisible(false);
    this.scrapText = scene.add.text(298, 84, "", hudText("#ffd36b", "11px"))
      .setDepth(2002).setVisible(false);
    for (let index = 0; index < 6; index += 1) {
      this.statusTray.push(createStatusTrayView(scene, 42 + index * 48, 145, productionArt));
    }

    const rollPanel = productionArt
      ? scene.add.image(708, 14, "hud-panels-v1", 1).setOrigin(0).setDisplaySize(234, 104).setDepth(2000)
      : scene.add.rectangle(708, 14, 234, 104, 0x0b121c, 0.94)
        .setOrigin(0).setStrokeStyle(2, 0x4d6a83).setDepth(2000);
    scene.add.text(720, 22, "COMBAT ROLL", hudText("#edf4ff", "13px")).setDepth(2001);
    scene.add.rectangle(720, 50, 206, 12, 0x15222d).setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x4f6e8d).setDepth(2001);
    this.rollFill = scene.add.rectangle(722, 50, 202, 8, 0x68e4e8).setOrigin(0, 0.5).setDepth(2002);
    this.rollText = scene.add.text(720, 64, "", hudText("#9fb3c8", "11px")).setDepth(2001);
    for (let index = 0; index < 12; index += 1) {
      this.weaponPips.push(scene.add.rectangle(724 + index * 16, 94, 11, 8, 0x273747)
        .setStrokeStyle(1, 0x4f6e8d).setDepth(2001));
    }

    const actionDefinitions = [
      { label: "ROLL", binding: "SPACE", color: 0x68e4e8, frame: 0 },
      { label: "ULT", binding: "R", color: 0xffa31a, frame: 1 },
      { label: "KIT", binding: "Q", color: 0x9f7aea, frame: 3 },
      { label: "ACT", binding: "E", color: 0xb9ef62, frame: 5 },
    ] as const;
    actionDefinitions.forEach((definition, index) => {
      this.actionTiles.push(createCooldownTile(
        scene,
        378 + index * 68,
        503,
        54,
        definition.label,
        definition.binding,
        definition.color,
        productionArt ? definition.frame : undefined,
      ));
    });
    for (let index = 0; index < 6; index += 1) {
      const tile = createCooldownTile(scene, 480, 451, 34, "", "AUTO", 0xffb982, productionArt ? 2 : undefined);
      setCooldownTileVisible(tile, false);
      this.cadenceTiles.push(tile);
    }

    const stateBackground = productionArt
      ? scene.add.image(0, 0, "hud-panels-v1", 4).setDisplaySize(440, 138)
      : scene.add.rectangle(0, 0, 440, 138, 0x0b121c, 0.96).setStrokeStyle(3, 0x68e4e8);
    this.stateText = scene.add.text(0, 0, "", {
      ...hudText("#ffffff", "24px"),
      align: "center",
      stroke: "#101720",
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.statePanel = scene.add.container(480, 270, [stateBackground, this.stateText])
      .setDepth(2100).setVisible(false);

    this.debugText = scene.add.text(18, 506, "", {
      ...hudText("#8fb2c9", "10px"),
      backgroundColor: "#0b121ccc",
      padding: { x: 5, y: 3 },
    }).setDepth(2000).setVisible(showDebug);

    const bossBackground = scene.add.rectangle(0, 0, 430, 54, 0x0b121c, 0.94)
      .setStrokeStyle(3, 0xffb15c);
    this.bossPortrait = scene.add.image(-187, 0, "siege-crusher-portrait-v1")
      .setDisplaySize(48, 48).setVisible(productionArt);
    this.bossFallback = scene.add.circle(-187, 0, 21, 0x8b4937)
      .setStrokeStyle(2, 0xffb15c).setVisible(!productionArt);
    const bossBar = scene.add.rectangle(-155, 12, 340, 12, 0x2b1714)
      .setOrigin(0, 0.5).setStrokeStyle(1, 0x75382d);
    this.bossFill = scene.add.rectangle(-153, 12, 336, 8, 0xff6b3d)
      .setOrigin(0, 0.5);
    this.bossText = scene.add.text(15, -15, "", hudText("#fff1dc", "13px")).setOrigin(0.5);
    this.bossPanel = scene.add.container(480, 398, [bossBackground, this.bossPortrait, this.bossFallback, bossBar, this.bossFill, this.bossText])
      .setDepth(2050).setVisible(false);

    for (const child of scene.children.list) {
      if (
        child instanceof Phaser.GameObjects.Text
        || child instanceof Phaser.GameObjects.Rectangle
        || child instanceof Phaser.GameObjects.Image
        || child instanceof Phaser.GameObjects.Container
        || child instanceof Phaser.GameObjects.Graphics
      ) {
        if (child.depth < 2000) continue;
        child.setScrollFactor(0);
      }
      if (child instanceof Phaser.GameObjects.Text) child.setResolution(uiTextResolution());
    }
  }

  update(snapshot: CombatSnapshot, paused: boolean, activeEffectCount: number): void {
    this.healthFill.setScale(Math.max(snapshot.playerHealth / snapshot.playerMaxHealth, 0.001), 1);
    this.xpFill.setScale(Math.max(snapshot.experience / snapshot.experienceForNextLevel, 0.001), 1);
    const totalRollTime = MARINE.evasiveMove.durationSeconds + PROTOTYPE_EVASIVE_RECOVERY_SECONDS;
    const readiness = snapshot.evasiveReady
      ? 1
      : 1 - Math.min(snapshot.evasiveCooldownRemainingSeconds / totalRollTime, 1);
    this.rollFill.setScale(Math.max(readiness, 0.001), 1)
      .setFillStyle(snapshot.evasiveReady ? 0x68e4e8 : 0xffa31a);
    const timedWaveSuffix = snapshot.density.timerEndsWave
      && snapshot.density.waveDurationSeconds !== null
      && snapshot.status === "combat"
      ? `  •  ${Math.max(0, Math.ceil(snapshot.density.waveDurationSeconds - snapshot.density.waveElapsedSeconds))}s`
      : "";
    this.waveText.setText(snapshot.scenario
      ? snapshot.scenario === "slime-spitter" ? "SPITTER LAB"
        : snapshot.scenario === "carapace-elite" ? "ELITE LAB"
          : snapshot.scenario === "brood-warden" ? "BROOD LAB"
            : snapshot.scenario === "ripper" ? "RIPPER LAB"
              : snapshot.scenario === "quillback" ? "QUILLBACK LAB"
                : snapshot.scenario === "spinewheel" ? "SPINEWHEEL LAB"
                  : snapshot.scenario === "tether-bloom" ? "TETHER LAB"
                    : snapshot.scenario === "bastion-eater" ? "FINAL BOSS LAB"
                      : snapshot.scenario === "density-capacity" ? "DENSITY 56 LAB"
                        : snapshot.scenario === "aurum-hoarder" ? "AURUM LAB"
                          : snapshot.scenario === "scrap-shop" ? "SCRAP SHOP LAB"
                      : snapshot.scenario === "razor-scuttler" ? "RAZOR LAB" : "CRUSHER LAB"
      : snapshot.stressProfile
        ? `STRESS ${snapshot.stressProfile}`
        : `WAVE ${snapshot.waveNumber}/${snapshot.totalWaves}${timedWaveSuffix}`);
    const shieldLabel = snapshot.playerShield > 0 ? `  SH ${Math.ceil(snapshot.playerShield)}` : "";
    this.statsText.setText(`LV ${snapshot.level}  HP ${Math.ceil(snapshot.playerHealth)}/${snapshot.playerMaxHealth}${shieldLabel}\nXP ${snapshot.experience}/${snapshot.experienceForNextLevel}${snapshot.playerSlowed ? "  SLOWED" : ""}${snapshot.playerTethered ? "  TETHERED" : ""}${snapshot.playerEntrenched ? "  ENTRENCHED" : ""}`);
    const scrapVisible = snapshot.securedScrap > 0 || snapshot.scenario === "scrap-shop";
    const secured = snapshot.events.some((event) => event.type === "scrap-secured");
    const spent = snapshot.events.some((event) => event.type === "scrap-spent");
    this.scrapIcon.setVisible(scrapVisible).setFrame(spent ? 2 : secured ? 1 : 0);
    this.scrapText.setVisible(scrapVisible).setText(`SCRAP ${snapshot.securedScrap}`);
    this.statusTray.forEach((view, index) => {
      const buff = snapshot.activeBuffs[index];
      if (!buff) {
        setStatusTrayVisible(view, false);
        return;
      }
      setStatusTrayVisible(view, true);
      updateStatusTrayView(view, buff.type, buff.remainingSeconds, buff.durationSeconds);
    });
    const ultimateLabel = snapshot.ultimateReady
      ? "ULT READY — R"
      : `ULT ${snapshot.ultimateCooldownRemainingSeconds.toFixed(1)}s`;
    this.rollText.setText(`${snapshot.evasiveReady
      ? "READY — SPACE"
      : `${snapshot.evasiveCooldownRemainingSeconds.toFixed(2)}s`}   ${ultimateLabel}`);
    updateCooldownTile(
      this.actionTiles[0]!, snapshot.evasiveCooldownRemainingSeconds,
      totalRollTime, snapshot.evasiveReady, false,
      this.cooldownTimersEnabled,
    );
    updateCooldownTile(
      this.actionTiles[1]!, snapshot.ultimateCooldownRemainingSeconds,
      MARINE.ultimate.cooldownSeconds, snapshot.ultimateReady, false,
      this.cooldownTimersEnabled,
    );
    this.actionTiles[2]!.label.setText(
      this.actionTiles[2]!.icon ? "" : snapshot.uraniumKitAvailable ? "U-25" : "KIT",
    );
    this.actionTiles[2]!.icon?.setFrame(snapshot.uraniumKitAvailable ? 3 : 4);
    updateCooldownTile(
      this.actionTiles[2]!, 0, 1, snapshot.uraniumKitAvailable, !snapshot.uraniumKitAvailable,
      this.cooldownTimersEnabled,
    );
    updateCooldownTile(this.actionTiles[3]!, 0, 1, false, true, this.cooldownTimersEnabled);

    const slowWeapons = cadenceWeapons(snapshot.equippedWeapons).slice(0, this.cadenceTiles.length);
    this.cadenceTiles.forEach((tile, index) => {
      const weapon = slowWeapons[index];
      if (!weapon) {
        setCooldownTileVisible(tile, false);
        return;
      }
      moveCooldownTile(tile, 480 + (index - (slowWeapons.length - 1) / 2) * 42, 451);
      setCooldownTileVisible(tile, true);
      tile.label.setText(tile.icon ? "" : weaponTileAbbreviation(weapon.weaponId));
      if (tile.icon) {
        if (weapon.weaponId === "patrol-blade") tile.icon.setTexture("action-tiles-v1", 2).setVisible(true);
        else if (weapon.weaponId === "bolt-carbine") tile.icon.setTexture("weapon-tiles-v1", 0).setVisible(true);
        else if (weapon.weaponId === "bulwark-rotary-cannon") tile.icon.setTexture("weapon-tiles-v1", 1).setVisible(true);
        else if (weapon.weaponId === "grenade-tube") tile.icon.setTexture("weapon-tiles-v1", 2).setVisible(true);
        else tile.icon.setVisible(false);
      }
      tile.binding.setText(weapon.stats.firesAutomatically ? "AUTO" : "FIRE");
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
      `state=${snapshot.heroState} enemies=${snapshot.enemies.length}/${snapshot.density.liveCap || "-"} peak=${snapshot.density.peakLiveEnemies} threat=${snapshot.density.threatSpawned}/${snapshot.density.threatBudget} queue=${snapshot.density.queuedSpawns} hostile=${snapshot.enemyProjectiles.length}/${snapshot.density.projectileBudget} pPeak=${snapshot.density.peakEnemyProjectiles} blocked=${snapshot.density.spawnCapBlockedSeconds.toFixed(1)}s effects=${activeEffectCount}`,
    );
    const boss = snapshot.enemies.find((enemy) => enemy.rank === "boss" || enemy.rank === "mini-boss");
    this.bossPanel.setVisible(Boolean(boss));
    if (boss) {
      this.bossFill.setScale(Math.max(boss.health / boss.maxHealth, 0.001), 1);
      const healthRatio = boss.health / boss.maxHealth;
      const enrage = healthRatio <= 0.2 ? "  •  FRENZY" : healthRatio <= 0.5 ? "  •  ENRAGED" : "";
      const isBrood = boss.miniBossKind === "brood-warden";
      const isFinalBoss = boss.type === "bastion-eater";
      this.bossPortrait.setVisible(this.productionArt)
        .setTexture(isFinalBoss ? "bastion-eater-portrait-v1" : isBrood ? "brood-warden-portrait-v1" : "siege-crusher-portrait-v1");
      this.bossFallback.setVisible(!this.productionArt)
        .setFillStyle(isFinalBoss ? 0x273153 : isBrood ? 0x68408b : 0x8b4937)
        .setStrokeStyle(2, isFinalBoss ? 0x56d9e8 : isBrood ? 0xb9f35b : 0xffb15c);
      const name = isFinalBoss ? "THE BASTION EATER" : isBrood ? "BROOD WARDEN" : "SIEGE CRUSHER";
      const phase = isFinalBoss ? boss.bastionEaterPhase : isBrood ? boss.broodWardenPhase : boss.siegeCrusherPhase;
      this.bossText.setText(`${name}  •  ${(phase ?? "stalk").toUpperCase()}${enrage}`);
    }

    let message = "";
    if (paused) message = "PAUSED\nPress Esc to continue";
    else if (snapshot.status === "intermission") message = "WAVE CLEARED";
    else if (snapshot.status === "victory") message = "BASTION SECURED\nPress Enter to restart";
    else if (snapshot.status === "defeat") message = "MARINE DOWN\nPress Enter to restart";
    this.stateText.setText(message);
    this.statePanel.setVisible(message.length > 0);
  }
}

function createStatusTrayView(scene: Phaser.Scene, x: number, y: number, productionArt: boolean): StatusTrayView {
  const background = scene.add.circle(x, y, 19, 0x101923, 0.98)
    .setStrokeStyle(2, 0x52677b).setDepth(2020).setVisible(false);
  const iconText = scene.add.text(x, y - 3, "", hudText("#ffffff", "10px"))
    .setOrigin(0.5).setDepth(2021).setVisible(false);
  const image = productionArt
    ? scene.add.image(x, y - 2, "uranium-status-v1").setDisplaySize(30, 30).setDepth(2021).setVisible(false)
    : null;
  const timer = scene.add.text(x, y + 11, "", hudText("#ffffff", "8px"))
    .setOrigin(0.5).setDepth(2023).setVisible(false);
  const ring = scene.add.graphics().setDepth(2022).setVisible(false);
  return { background, iconText, image, timer, ring };
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
  const fraction = Math.max(0, Math.min(remainingSeconds / Math.max(durationSeconds, 0.001), 1));
  const urgent = remainingSeconds <= 3;
  view.background.setFillStyle(statusColor(type), 0.3)
    .setStrokeStyle(2, urgent ? 0xffc35a : statusColor(type), 0.95);
  view.iconText.setText(statusAbbreviation(type));
  if (view.image) {
    if (type === "uranium-core-rounds") view.image.setTexture("uranium-status-v1");
    else view.image.setTexture("batch-c-rewards-v1", statusRewardFrame(type));
  }
  view.timer.setText(remainingSeconds.toFixed(1)).setColor(urgent ? "#ffd36b" : "#ffffff");
  view.ring.clear();
  view.ring.lineStyle(4, 0x071018, 0.88).beginPath()
    .arc(x, y, 21, -Math.PI / 2, Math.PI * 1.5, false).strokePath();
  if (fraction > 0) {
    view.ring.lineStyle(3, urgent ? 0xffc35a : statusColor(type), 1).beginPath()
      .arc(x, y, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction, false).strokePath();
  }
}

function statusAbbreviation(type: PowerupType): string {
  switch (type) {
    case "overcharge": return "OC";
    case "adrenaline": return "AD";
    case "magnet-pulse": return "MP";
    case "uranium-core-rounds": return "U25";
    default: return "SH";
  }
}

function statusColor(type: PowerupType): number {
  switch (type) {
    case "overcharge": return 0xffa347;
    case "adrenaline": return 0xff6a70;
    case "magnet-pulse": return 0x70dce8;
    case "uranium-core-rounds": return 0xb9ef62;
    default: return 0x9f7aea;
  }
}

function statusRewardFrame(type: PowerupType): number {
  switch (type) {
    case "overcharge": return 12;
    case "magnet-pulse": return 14;
    case "adrenaline": return 15;
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
  return 0xffa31a;
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
    : scene.add.image(centreX, centreY, "action-tiles-v1", iconFrame)
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

function hudText(color: string, fontSize: string): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color,
    fontFamily: "Consolas, Courier New, monospace",
    fontSize,
    stroke: "#081018",
    strokeThickness: 1,
  };
}
