import Phaser from "phaser";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import { UPGRADE_CATALOG, type UpgradeId } from "../content/upgradeCatalog";
import { PERK_CATALOG } from "../perks/perkCatalog";
import { LocalSaveStore } from "../save/LocalSaveStore";
import { createRunSummary } from "../run/RunSummary";
import { createTransformationCodexSnapshot } from "../transformations/TransformationSnapshot";
import { normalizeTransformationAffinityState } from "../transformations/TransformationAffinity";

const WIDTH = 960;
const HEIGHT = 540;
const NAVY = 0x151e2b;
const PANEL = 0x1d2938;
const IVORY = "#e8e2d4";
const TEAL = "#68e4e8";
const ORANGE = "#ff9a52";
const MUTED = "#8fa1b3";

/** Task 50 code-native debrief. Art can dress it later without changing data. */
export class RunSummaryScene extends Phaser.Scene {
  constructor() {
    super("run-summary");
  }

  create(): void {
    const store = new LocalSaveStore(typeof window !== "undefined" ? window.localStorage : null);
    const summary = store.load().lastRunSummary ?? (
      new URLSearchParams(window.location.search).get("summarydemo") === "1" ? demoSummary() : null
    );
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, NAVY);
    if (!summary) {
      this.text(WIDTH / 2, 220, "NO RUN SUMMARY AVAILABLE", IVORY, "24px", true);
      this.text(WIDTH / 2, 270, "Complete or abandon a recordable run first.", MUTED, "14px", true);
      this.addReturnControls();
      return;
    }

    (window as unknown as { __runSummary?: object }).__runSummary = summary;
    const victory = summary.outcome === "victory";
    this.text(54, 32, victory ? "EXPEDITION SECURED" : "BASTION LOST", victory ? TEAL : ORANGE, "28px");
    this.text(56, 70, `${summary.mode === "expedition" ? "EXPEDITION" : "QUICK DROP"}  •  ${summary.heroId.toUpperCase()}  •  LEVEL ${summary.level}`, MUTED, "12px");

    this.panel(42, 104, 260, 310);
    this.text(62, 122, "RUN TOTALS", IVORY, "18px");
    const totals = [
      ["Nodes cleared", String(summary.nodesCleared)],
      ["Wave / column", String(summary.waveReached)],
      ["Enemies defeated", String(summary.kills)],
      ["Scrap earned", format(summary.scrapEarned)],
      ["Scrap banked", format(summary.scrapBanked)],
    ];
    totals.forEach(([label, value], index) => {
      const y = 164 + index * 43;
      this.text(62, y, label!, MUTED, "12px");
      this.text(278, y, value!, IVORY, "15px", false, 1);
    });

    this.panel(322, 104, 310, 310);
    this.text(342, 122, "DAMAGE BY WEAPON", IVORY, "18px");
    const damage = Object.entries(summary.damageByWeapon)
      .filter(([, value]) => value > 0)
      .sort((left, right) => right[1] - left[1]);
    if (damage.length === 0) this.text(342, 164, "No weapon damage recorded.", MUTED, "12px");
    damage.slice(0, 7).forEach(([weaponId, value], index) => {
      const name = WEAPON_CATALOG[weaponId as WeaponId]?.displayName ?? weaponId;
      const y = 158 + index * 33;
      this.text(342, y, name.toUpperCase(), MUTED, "11px");
      this.text(610, y, format(value), index === 0 ? TEAL : IVORY, "13px", false, 1);
    });

    this.panel(652, 104, 266, 310);
    this.text(672, 122, "FINAL BUILD", IVORY, "18px");
    const weaponLines = summary.weapons.map((weapon) => {
      const name = WEAPON_CATALOG[weapon.weaponId as WeaponId]?.displayName ?? weapon.weaponId;
      return `${name}  T${weapon.tier}`;
    });
    this.text(672, 158, weaponLines.length > 0 ? weaponLines.join("\n") : "No weapons", TEAL, "11px");
    const upgradeLines = summary.upgrades.slice(0, 6).map((upgrade) => {
      const name = UPGRADE_CATALOG[upgrade.upgradeId as UpgradeId]?.name ?? upgrade.upgradeId;
      return `${name}  ${upgrade.level}`;
    });
    this.text(672, 252, upgradeLines.length > 0 ? upgradeLines.join("\n") : "No upgrades", MUTED, "10px");
    const transformation = createTransformationCodexSnapshot(summary.transformation);
    const committed = transformation.paths.find(({ committed }) => committed);
    const exposed = transformation.paths.filter(({ committed: isCommitted }) => !isCommitted);
    const transformationLine = committed
      ? `${committed.name}  ${committed.stage.toUpperCase()}  ${committed.affinity}/7`
      : exposed.length > 0
        ? exposed.map((path) => `${path.name} ${path.affinity}/3`).join("  •  ")
        : "No transformation exposure";
    this.text(672, 374, "TRANSFORMATION", IVORY, "11px");
    this.text(672, 394, transformationLine, committed ? TEAL : MUTED, "9px");

    if (summary.newlyUnlockedPerkIds.length > 0) {
      const names = summary.newlyUnlockedPerkIds.map((id) => (
        PERK_CATALOG.find((perk) => perk.id === id)?.name ?? id
      ));
      this.text(54, 438, `NEW PERK${names.length > 1 ? "S" : ""}: ${names.join("  •  ")}`, TEAL, "15px");
    } else {
      this.text(54, 438, "No new perk unlocks this run.", MUTED, "12px");
    }
    this.addReturnControls();
  }

  private addReturnControls(): void {
    this.text(WIDTH / 2, 505, "ENTER / A  RETURN TO MAIN MENU", IVORY, "13px", true);
    const leave = () => { window.location.href = "?screen=title"; };
    this.input.keyboard?.on("keydown-ENTER", leave);
    this.input.keyboard?.on("keydown-SPACE", leave);
    this.input.keyboard?.on("keydown-ESC", leave);
    this.input.gamepad?.on("down", leave);
    this.add.zone(0, 470, WIDTH, 70).setOrigin(0, 0).setInteractive().on("pointerdown", leave);
  }

  private panel(x: number, y: number, width: number, height: number): void {
    this.add.rectangle(x, y, width, height, PANEL).setOrigin(0, 0).setStrokeStyle(1, 0x3b4d63);
  }

  private text(
    x: number,
    y: number,
    value: string,
    color: string,
    fontSize: string,
    centred = false,
    align: 0 | 1 = 0,
  ): Phaser.GameObjects.Text {
    const text = this.add.text(x, y, value, {
      color,
      fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
      fontSize,
      lineSpacing: 5,
      align: align === 1 ? "right" : "left",
    });
    if (centred) text.setOrigin(0.5, 0);
    else if (align === 1) text.setOrigin(1, 0);
    return text;
  }
}

function format(value: number): string {
  return value.toFixed(1).replace(/\.0$/, "");
}

function demoSummary() {
  return createRunSummary({
    mode: "expedition",
    outcome: "victory",
    heroId: "marine",
    perkId: "perk-veteran",
    waveReached: 8,
    nodesCleared: 7,
    kills: 286,
    scrapEarned: 214,
    scrapBanked: 46,
    level: 15,
    damageByWeapon: {
      "bulwark-rotary-cannon": 1428.5,
      "bastion-service-rifle": 986,
      scattergun: 442.5,
    },
    weapons: [
      { weaponId: "bastion-service-rifle", tier: 2 },
      { weaponId: "scattergun", tier: 2 },
      { weaponId: "bulwark-rotary-cannon", tier: 2 },
    ],
    upgrades: [
      { upgradeId: "rapid-cycling", level: 3 },
      { upgradeId: "heavy-calibre", level: 2 },
      { upgradeId: "armour-plating", level: 2 },
    ],
    transformation: normalizeTransformationAffinityState({
      committedPathId: "cybernetic-ascension",
      paths: [{ pathId: "cybernetic-ascension", choiceIds: ["targeting-suite", "targeting-suite", "shield-lattice"] }],
    }),
    newlyUnlockedPerkIds: ["perk-gunsmith"],
  });
}
