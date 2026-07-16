import Phaser from "phaser";
import type { CombatSnapshot, PowerupType } from "../combat/CombatSimulation";
import { MARINE } from "../hero/marine";
import { PROTOTYPE_EVASIVE_RECOVERY_SECONDS } from "../hero/HeroMotionController";

export class CombatHud {
  private readonly healthFill: Phaser.GameObjects.Rectangle;
  private readonly xpFill: Phaser.GameObjects.Rectangle;
  private readonly rollFill: Phaser.GameObjects.Rectangle;
  private readonly waveText: Phaser.GameObjects.Text;
  private readonly statsText: Phaser.GameObjects.Text;
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
  private readonly powerupIcons = new Map<PowerupType, Phaser.GameObjects.Image>();

  constructor(scene: Phaser.Scene, showDebug: boolean, productionArt = true) {
    this.productionArt = productionArt;
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
    if (productionArt) {
      (["overcharge", "aegis", "magnet-pulse", "adrenaline"] as const).forEach((type, index) => {
        this.powerupIcons.set(type, scene.add.image(420 + index * 40, 102, "batch-c-rewards-v1", 12 + index)
          .setDisplaySize(26, 26).setDepth(2001).setVisible(false));
      });
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
    this.bossPanel = scene.add.container(480, 466, [bossBackground, this.bossPortrait, this.bossFallback, bossBar, this.bossFill, this.bossText])
      .setDepth(2050).setVisible(false);

    for (const child of scene.children.list) {
      if (
        child instanceof Phaser.GameObjects.Text
        || child instanceof Phaser.GameObjects.Rectangle
        || child instanceof Phaser.GameObjects.Image
        || child instanceof Phaser.GameObjects.Container
      ) {
        if (child.depth < 2000) continue;
        child.setScrollFactor(0);
      }
      if (child instanceof Phaser.GameObjects.Text) child.setResolution(2);
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
    this.waveText.setText(snapshot.scenario
      ? snapshot.scenario === "slime-spitter" ? "SPITTER LAB"
        : snapshot.scenario === "carapace-elite" ? "ELITE LAB"
          : snapshot.scenario === "brood-warden" ? "BROOD LAB"
            : snapshot.scenario === "ripper" ? "RIPPER LAB"
              : snapshot.scenario === "quillback" ? "QUILLBACK LAB"
                : snapshot.scenario === "spinewheel" ? "SPINEWHEEL LAB" : "CRUSHER LAB"
      : snapshot.stressProfile
        ? `STRESS ${snapshot.stressProfile}`
        : `WAVE ${snapshot.waveNumber}/${snapshot.totalWaves}`);
    const shieldLabel = snapshot.playerShield > 0 ? `  SH ${Math.ceil(snapshot.playerShield)}` : "";
    const buffLabel = snapshot.activeBuffs.length > 0
      ? `\n${snapshot.activeBuffs
        .map((buff) => `${buff.type.toUpperCase()} ${buff.remainingSeconds.toFixed(1)}s`)
        .join("  ")}`
      : "";
    const activeBuffTypes = new Set(snapshot.activeBuffs.map((buff) => buff.type));
    for (const [type, icon] of this.powerupIcons) {
      icon.setVisible(type === "aegis" ? snapshot.playerShield > 0 : activeBuffTypes.has(type));
    }
    this.statsText.setText(`LV ${snapshot.level}  HP ${Math.ceil(snapshot.playerHealth)}/${snapshot.playerMaxHealth}${shieldLabel}\nXP ${snapshot.experience}/${snapshot.experienceForNextLevel}${snapshot.playerSlowed ? "  SLOWED" : ""}${snapshot.playerEntrenched ? "  ENTRENCHED" : ""}${buffLabel}`);
    const ultimateLabel = snapshot.ultimateReady
      ? "ULT READY — R"
      : `ULT ${snapshot.ultimateCooldownRemainingSeconds.toFixed(1)}s`;
    this.rollText.setText(`${snapshot.evasiveReady
      ? "READY — SPACE"
      : `${snapshot.evasiveCooldownRemainingSeconds.toFixed(2)}s`}   ${ultimateLabel}`);
    this.weaponPips.forEach((pip, index) => {
      const weapon = snapshot.equippedWeapons[index];
      pip.setFillStyle(weapon ? weaponPipColor(weapon.weaponId) : 0x273747);
    });
    this.debugText.setText(
      `state=${snapshot.heroState} enemies=${snapshot.enemies.length} friendly=${snapshot.projectiles.length} hostile=${snapshot.enemyProjectiles.length} hazards=${snapshot.groundHazards.length} rewards=${snapshot.eliteRewards.length} effects=${activeEffectCount}`,
    );
    const boss = snapshot.enemies.find((enemy) => enemy.rank === "mini-boss");
    this.bossPanel.setVisible(Boolean(boss));
    if (boss) {
      this.bossFill.setScale(Math.max(boss.health / boss.maxHealth, 0.001), 1);
      const healthRatio = boss.health / boss.maxHealth;
      const enrage = healthRatio <= 0.2 ? "  •  FRENZY" : healthRatio <= 0.5 ? "  •  ENRAGED" : "";
      const isBrood = boss.miniBossKind === "brood-warden";
      this.bossPortrait.setVisible(this.productionArt)
        .setTexture(isBrood ? "brood-warden-portrait-v1" : "siege-crusher-portrait-v1");
      this.bossFallback.setVisible(!this.productionArt)
        .setFillStyle(isBrood ? 0x68408b : 0x8b4937)
        .setStrokeStyle(2, isBrood ? 0xb9f35b : 0xffb15c);
      const name = isBrood ? "BROOD WARDEN" : "SIEGE CRUSHER";
      const phase = isBrood ? boss.broodWardenPhase : boss.siegeCrusherPhase;
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

function weaponPipColor(weaponId: string): number {
  if (weaponId === "scattergun") return 0xff9a72;
  if (weaponId === "arc-carbine") return 0x68e4e8;
  return 0xffa31a;
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
