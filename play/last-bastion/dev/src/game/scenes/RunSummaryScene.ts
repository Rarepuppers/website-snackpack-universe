import Phaser from "phaser";
import { DEBRIEF_ASSETS } from "../assets/DebriefAssetManifest";
import { queueGameAssets } from "../assets/PhaserAssetQueue";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import { UPGRADE_CATALOG, type UpgradeId } from "../content/upgradeCatalog";
import { PERK_CATALOG } from "../perks/perkCatalog";
import { createLocalSaveStore } from "../save/SaveStorage";
import { createRunSummary, damagePerMinute, type RunSummary } from "../run/RunSummary";
import { createTransformationCodexSnapshot } from "../transformations/TransformationSnapshot";
import { normalizeTransformationAffinityState } from "../transformations/TransformationAffinity";
import { canonicalWeaponTileFrame } from "../ui/WeaponTileFrames";
import { formatRunClock } from "../stats/formatStat";

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

  preload(): void {
    queueGameAssets(this, DEBRIEF_ASSETS);
  }

  create(): void {
    const store = createLocalSaveStore(typeof window !== "undefined" ? window : null);
    const save = store.load();
    const summary = new URLSearchParams(window.location.search).get("summarydemo") === "1"
      ? demoSummary()
      : save.lastRunSummary;
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, NAVY);
    this.add.image(WIDTH / 2, HEIGHT / 2, "bastion-logistics-map-backdrop-v1")
      .setDisplaySize(WIDTH, 640).setAlpha(0.42);
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, NAVY, 0.74);
    if (!summary) {
      this.text(WIDTH / 2, 220, "NO RUN SUMMARY AVAILABLE", IVORY, "24px", true);
      this.text(WIDTH / 2, 270, "Complete or abandon a recordable run first.", MUTED, "14px", true);
      this.addReturnControls();
      return;
    }

    (window as unknown as { __runSummary?: object }).__runSummary = summary;
    const victory = summary.outcome === "victory";
    this.add.rectangle(WIDTH / 2, 57, WIDTH - 84, 72, 0x0b121c, 0.8)
      .setStrokeStyle(1, victory ? 0x68e4e8 : 0xff9a52, 0.7);
    this.text(54, 32, victory ? "EXPEDITION SECURED" : "BASTION LOST", victory ? TEAL : ORANGE, "28px");
    this.text(56, 70, `${victory ? "THE LINE HELD" : "THE LINE WAS OVERRUN"}  •  ${summary.mode === "expedition" ? "EXPEDITION" : "QUICK DROP"}  •  ${summary.heroId.toUpperCase()}  •  LEVEL ${summary.level}`, MUTED, "12px");
    if (!victory && summary.defeatCause) this.text(56, 86, summary.defeatCause.toUpperCase(), ORANGE, "9px");
    if (summary.newBestWave || summary.newBestNodes) {
      this.text(892, 48, "NEW RECORD", TEAL, "11px", false, 1);
    }

    this.panel(42, 104, 260, 310);
    this.text(62, 122, "RUN TOTALS", IVORY, "18px");
    const totals = [
      ["Nodes cleared", String(summary.nodesCleared)],
      ["Wave / column", String(summary.waveReached)],
      ["Enemies defeated", String(summary.kills)],
      ["Elite kills", String(summary.eliteKills)],
      ["Damage taken", format(summary.damageTaken)],
      ["Run duration", formatRunClock(summary.elapsedSeconds)],
      ["Scrap earned", format(summary.scrapEarned)],
      ["Scrap banked", format(summary.scrapBanked)],
    ];
    totals.forEach(([label, value], index) => {
      const y = 157 + index * 30;
      this.text(62, y, label!, MUTED, "10px");
      this.text(278, y, value!, IVORY, "12px", false, 1);
    });
    const topDamageSources = Object.entries(summary.damageTakenBySource)
      .filter(([, value]) => value > 0)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3);
    if (topDamageSources.length > 0) {
      this.text(62, 384, "TOP INCOMING THREATS", ORANGE, "8px");
      this.text(
        62,
        400,
        topDamageSources
          .map(([source, value]) => `${damageSourceLabel(source)} ${format(value)}`)
          .join("  /  "),
        MUTED,
        "7px",
      );
    }

    this.panel(322, 104, 310, 310);
    this.text(342, 122, "DAMAGE BY WEAPON", IVORY, "18px");
    const damage = Object.entries(summary.damageByWeapon)
      .filter(([, value]) => value > 0)
      .sort((left, right) => right[1] - left[1]);
    const highestDamage = damage[0]?.[1] ?? 1;
    if (damage.length === 0) this.text(342, 164, "No weapon damage recorded.", MUTED, "12px");
    damage.slice(0, 4).forEach(([weaponId, value], index) => {
      const name = WEAPON_CATALOG[weaponId as WeaponId]?.displayName ?? weaponId;
      const y = 158 + index * 33;
      this.text(342, y, name.toUpperCase(), MUTED, "11px");
      this.text(610, y, format(value), index === 0 ? TEAL : IVORY, "13px", false, 1);
      this.add.rectangle(342, y + 21, 268, 3, 0x101923).setOrigin(0, 0.5);
      this.add.rectangle(342, y + 21, 268 * value / highestDamage, 3, index === 0 ? 0x68e4e8 : 0x60768c)
        .setOrigin(0, 0.5);
    });
    const combatHighlights = [
      `BEST HIT ${format(summary.highestHit)}`,
      `CRITS ${summary.criticalHits}`,
      ...(summary.bossDamage > 0 ? [`BOSS ${format(summary.bossDamage)}`] : []),
    ];
    const totalDamage = Object.values(summary.damageByWeapon).reduce((sum, damageValue) => sum + damageValue, 0);
    const minuteBars = compactMinuteBars(damagePerMinute(summary), 12);
    if (minuteBars.length > 0) {
      this.text(342, 292, "DAMAGE / MINUTE", IVORY, "9px");
      const chartLeft = 342;
      const chartWidth = 268;
      const chartBottom = 363;
      const chartHeight = 48;
      const gap = 3;
      const barWidth = (chartWidth - gap * (minuteBars.length - 1)) / minuteBars.length;
      const peak = Math.max(1, ...minuteBars.map((bar) => bar.damagePerMinute));
      this.add.line(0, 0, chartLeft, chartBottom, chartLeft + chartWidth, chartBottom, 0x425569, 0.8)
        .setOrigin(0);
      minuteBars.forEach((bar, index) => {
        const height = Math.max(2, chartHeight * bar.damagePerMinute / peak);
        const x = chartLeft + index * (barWidth + gap);
        this.add.rectangle(x, chartBottom, barWidth, height, index === minuteBars.length - 1 ? 0x68e4e8 : 0x60768c)
          .setOrigin(0, 1);
        this.text(x + barWidth / 2, chartBottom + 3, bar.label, MUTED, "6px").setOrigin(0.5, 0);
      });
    } else {
      this.text(342, 320, "No timeline data for this run.", MUTED, "9px");
    }
    this.text(342, 378, `AVERAGE DPS  ${format(totalDamage / Math.max(1, summary.elapsedSeconds))}`, TEAL, "9px");
    this.text(342, 397, combatHighlights.join("  •  "), summary.bossDamage > 0 ? ORANGE : MUTED, "8px");

    this.panel(652, 104, 266, 310);
    this.text(672, 122, "FINAL BUILD", IVORY, "18px");
    summary.weapons.slice(0, 4).forEach((weapon, index) => {
      const name = WEAPON_CATALOG[weapon.weaponId as WeaponId]?.displayName ?? weapon.weaponId;
      const y = 153 + index * 39;
      this.add.image(690, y + 10, "batch-i-weapon-tiles-v1", canonicalWeaponTileFrame(weapon.weaponId as WeaponId))
        .setDisplaySize(32, 32);
      this.text(714, y, name, TEAL, "10px");
      this.text(714, y + 17, `TIER ${weapon.tier}`, MUTED, "9px");
    });
    if (summary.weapons.length === 0) this.text(672, 158, "No weapons", MUTED, "11px");
    const upgradeLines = summary.upgrades.slice(0, 6).map((upgrade) => {
      const name = UPGRADE_CATALOG[upgrade.upgradeId as UpgradeId]?.name ?? upgrade.upgradeId;
      return `${name}  ${upgrade.level}`;
    });
    this.text(672, 318, upgradeLines.length > 0 ? upgradeLines.join("  •  ") : "No upgrades", MUTED, "9px")
      .setWordWrapWidth(220);
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
    this.addReturnControls(summary);
  }

  private addReturnControls(summary?: RunSummary): void {
    const leave = () => { window.location.href = "?screen=title"; };
    if (!summary) {
      this.add.rectangle(WIDTH / 2, 498, 286, 42, 0x24384f, 0.96).setStrokeStyle(2, 0x68e4e8);
      this.text(WIDTH / 2, 486, "RETURN TO MAIN MENU", TEAL, "13px", true);
      this.text(WIDTH / 2, 507, "ENTER / A / CLICK", MUTED, "9px", true);
      this.input.keyboard?.on("keydown-ENTER", leave);
      this.input.keyboard?.on("keydown-SPACE", leave);
      this.input.gamepad?.on("down", leave);
      this.add.zone(337, 477, 286, 42).setOrigin(0, 0).setInteractive().on("pointerdown", leave);
      return;
    }
    const retry = () => { window.location.href = `?screen=game&hero=${summary.heroId}`; };
    const expedition = () => { window.location.href = "?screen=title&flow=character-select"; };
    const actions = [
      { x: 292, label: "RETRY QUICK DROP", hint: "R", run: retry },
      { x: 480, label: "NEW EXPEDITION", hint: "ENTER / A", run: expedition },
      { x: 668, label: "MAIN MENU", hint: "ESC", run: leave },
    ] as const;
    actions.forEach((action, index) => {
      const primary = summary.mode === "expedition" ? index === 1 : index === 0;
      this.add.rectangle(action.x, 492, 174, 42, primary ? 0x24384f : PANEL, 0.96)
        .setStrokeStyle(primary ? 2 : 1, primary ? 0x68e4e8 : 0x52677b);
      this.text(action.x, 480, action.label, primary ? TEAL : IVORY, "11px", true);
      this.text(action.x, 502, action.hint, MUTED, "8px", true);
      this.add.zone(action.x - 87, 471, 174, 42).setOrigin(0, 0).setInteractive().on("pointerdown", action.run);
    });
    const defaultAction = summary.mode === "expedition" ? expedition : retry;
    this.input.keyboard?.on("keydown-ENTER", defaultAction);
    this.input.keyboard?.on("keydown-SPACE", defaultAction);
    this.input.keyboard?.on("keydown-R", retry);
    this.input.keyboard?.on("keydown-N", expedition);
    this.input.keyboard?.on("keydown-ESC", leave);
    this.input.gamepad?.on("down", defaultAction);
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

function damageSourceLabel(source: string): string {
  if (source === "generic") return "OTHER";
  return source.replaceAll("-", " ").toUpperCase();
}

function compactMinuteBars(
  minutes: readonly number[],
  maximumBars: number,
): readonly { label: string; damagePerMinute: number }[] {
  if (minutes.length === 0) return [];
  const groupSize = Math.max(1, Math.ceil(minutes.length / Math.max(1, maximumBars)));
  const bars: { label: string; damagePerMinute: number }[] = [];
  for (let start = 0; start < minutes.length; start += groupSize) {
    const values = minutes.slice(start, start + groupSize);
    const end = start + values.length;
    bars.push({
      label: values.length === 1 ? `${start + 1}` : `${start + 1}-${end}`,
      damagePerMinute: values.reduce((sum, value) => sum + value, 0) / values.length,
    });
  }
  return bars;
}

function demoDamageTimeline(minuteTotals: readonly number[]): readonly number[] {
  return minuteTotals.flatMap((total) => [
    total,
    ...Array.from({ length: 59 }, () => 0),
  ]);
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
    elapsedSeconds: 734,
    damageTaken: 48.5,
    eliteKills: 6,
    bossDamage: 820,
    highestHit: 74.5,
    criticalHits: 19,
    damageTakenBySource: { contact: 22, projectile: 16.5, hazard: 10 },
    damageBySecond: demoDamageTimeline([120, 185, 210, 260, 245, 310, 350, 295, 280, 240, 225, 205, 126.5]),
    defeatCause: null,
    newBestWave: true,
    newBestNodes: true,
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
