import Phaser from "phaser";
import { DEBRIEF_ASSETS } from "../assets/DebriefAssetManifest";
import { queueGameAssets } from "../assets/PhaserAssetQueue";
import { WEAPON_CATALOG, type WeaponId } from "../content/weaponCatalog";
import { UPGRADE_CATALOG, type UpgradeId } from "../content/upgradeCatalog";
import { PERK_CATALOG } from "../perks/perkCatalog";
import { createLocalSaveStore } from "../save/SaveStorage";
import { createCurrentRunProvenance, createRunSummary, damagePerMinute, type RunSummary } from "../run/RunSummary";
import { formatRunDetails, quickDropRetryUrl } from "../run/RunReport";
import { createTransformationCodexSnapshot } from "../transformations/TransformationSnapshot";
import { normalizeTransformationAffinityState } from "../transformations/TransformationAffinity";
import { weaponTilePresentation } from "../ui/WeaponTileFrames";
import { weaponReviewPage } from "../ui/WeaponReviewRoutes";
import { formatRunClock } from "../stats/formatStat";
import { threatTierDefinition } from "../expedition/ThreatTier";
import { debriefGamepadIntent, moveDebriefSelection } from "../ui/DebriefNavigation";
import { uiTextResolution } from "../rendering/DisplayScaling";

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
  private returnActionIndex = 0;
  private returnActions: readonly { readonly run: () => void; readonly shortcut: string }[] = [];
  private returnFrames: Phaser.GameObjects.Rectangle[] = [];
  private returnLabels: Phaser.GameObjects.Text[] = [];
  private returnHints: Phaser.GameObjects.Text[] = [];
  private copyStatus: Phaser.GameObjects.Text | null = null;

  constructor() {
    super("run-summary");
  }

  preload(): void {
    queueGameAssets(this, DEBRIEF_ASSETS);
  }

  create(): void {
    const store = createLocalSaveStore(typeof window !== "undefined" ? window : null);
    const save = store.load();
    const params = new URLSearchParams(window.location.search);
    const reviewWeapons = weaponReviewPage(params);
    const summary = params.get("summarydemo") === "1" || reviewWeapons
      ? demoSummary(reviewWeapons ?? undefined)
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
    if (summary.threatTier !== null) {
      const threat = threatTierDefinition(summary.threatTier);
      this.text(892, 70, `THREAT ${threat.tier}  ${threat.name}`, threat.tier > 0 ? ORANGE : TEAL, "10px", false, 1);
    }
    const seedLabel = summary.provenance.combatSeed === null ? "SEED UNKNOWN" : `SEED ${summary.provenance.combatSeed}`;
    this.text(892, 88, `${seedLabel}  /  SIM ${summary.provenance.simulationVersion || "?"}`, MUTED, "8px", false, 1);
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
      const presentation = weaponTilePresentation(weapon.weaponId as WeaponId);
      this.add.image(690, y + 10, presentation.texture, presentation.frame)
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
    this.text(54, 458, `COMMAND MARKS BANKED  +${summary.commandMarksEarned}`, ORANGE, "12px");
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
      this.input.gamepad?.on("down", (_pad: unknown, button: { index: number }) => {
        const intent = debriefGamepadIntent(button.index);
        if (intent === "confirm" || intent === "back") leave();
      });
      this.add.zone(337, 477, 286, 42).setOrigin(0, 0).setInteractive().on("pointerdown", leave);
      return;
    }
    const retryUrl = quickDropRetryUrl(summary);
    const retry = () => { if (retryUrl) window.location.href = retryUrl; };
    const quickDrop = () => { window.location.href = `?screen=game&hero=${summary.heroId}`; };
    const expedition = () => { window.location.href = "?screen=title&flow=character-select"; };
    const copy = () => { void this.copyRunDetails(summary); };
    const actionDefinitions = [
      ...(retryUrl ? [{ label: "RETRY THIS SEED", shortcut: "R", run: retry }] : []),
      { label: "NEW QUICK DROP", shortcut: "Q", run: quickDrop },
      { label: "NEW EXPEDITION", shortcut: "N", run: expedition },
      { label: "COPY RUN DETAILS", shortcut: "C", run: copy },
      { label: "MAIN MENU", shortcut: "ESC / B", run: leave },
    ];
    const spacing = 178;
    const firstX = WIDTH / 2 - spacing * (actionDefinitions.length - 1) / 2;
    const actions = actionDefinitions.map((action, index) => ({ ...action, x: firstX + index * spacing }));
    this.returnActions = actions;
    this.returnActionIndex = summary.mode === "expedition"
      ? Math.max(0, actions.findIndex(({ label }) => label === "NEW EXPEDITION"))
      : 0;
    this.returnFrames = [];
    this.returnLabels = [];
    this.returnHints = [];
    actions.forEach((action, index) => {
      this.returnFrames.push(this.add.rectangle(action.x, 492, 174, 42, PANEL, 0.96));
      this.returnLabels.push(this.text(action.x, 480, action.label, IVORY, "11px", true));
      this.returnHints.push(this.text(action.x, 502, action.shortcut, MUTED, "8px", true));
      this.add.zone(action.x - 87, 471, 174, 42).setOrigin(0, 0).setInteractive()
        .on("pointerover", () => this.selectReturnAction(index))
        .on("pointerdown", action.run);
    });
    this.refreshReturnActions();
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", "Space", "KeyR", "KeyQ", "KeyN", "KeyC", "Escape"].includes(event.code)) {
        event.preventDefault();
      }
      if (event.code === "ArrowLeft" || event.code === "ArrowUp") this.moveReturnAction(-1);
      else if (event.code === "ArrowRight" || event.code === "ArrowDown") this.moveReturnAction(1);
      else if (event.code === "Enter" || event.code === "Space") this.activateReturnAction();
      else if (event.code === "KeyR") retry();
      else if (event.code === "KeyQ") quickDrop();
      else if (event.code === "KeyN") expedition();
      else if (event.code === "KeyC") copy();
      else if (event.code === "Escape") leave();
    });
    this.input.gamepad?.on("down", (_pad: unknown, button: { index: number }) => {
      const intent = debriefGamepadIntent(button.index);
      if (intent === "previous") this.moveReturnAction(-1);
      else if (intent === "next") this.moveReturnAction(1);
      else if (intent === "confirm") this.activateReturnAction();
      else if (intent === "back") leave();
    });
  }

  private async copyRunDetails(summary: RunSummary): Promise<void> {
    const details = formatRunDetails(summary);
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(details);
      this.setCopyStatus("RUN DETAILS COPIED", TEAL);
      (window as unknown as { __runSummaryCopy?: object }).__runSummaryCopy = { copied: true, fallback: false };
    } catch {
      showSelectableRunDetails(details);
      this.setCopyStatus("COPY BLOCKED — DETAILS OPENED FOR SELECTION", ORANGE);
      (window as unknown as { __runSummaryCopy?: object }).__runSummaryCopy = { copied: false, fallback: true };
    }
  }

  private setCopyStatus(message: string, color: string): void {
    this.copyStatus?.destroy();
    this.copyStatus = this.text(WIDTH / 2, 461, message, color, "8px", true).setDepth(3000);
  }

  private selectReturnAction(index: number): void {
    this.returnActionIndex = Math.max(0, Math.min(this.returnActions.length - 1, index));
    this.refreshReturnActions();
  }

  private moveReturnAction(direction: -1 | 1): void {
    this.returnActionIndex = moveDebriefSelection(
      this.returnActionIndex,
      direction,
      this.returnActions.length,
    );
    this.refreshReturnActions();
  }

  private activateReturnAction(): void {
    this.returnActions[this.returnActionIndex]?.run();
  }

  private refreshReturnActions(): void {
    (window as unknown as { __runSummaryNavigation?: object }).__runSummaryNavigation = {
      selectedIndex: this.returnActionIndex,
      selectedShortcut: this.returnActions[this.returnActionIndex]?.shortcut ?? null,
    };
    this.returnActions.forEach((action, index) => {
      const selected = index === this.returnActionIndex;
      this.returnFrames[index]?.setFillStyle(selected ? 0x24384f : PANEL, 0.96)
        .setStrokeStyle(selected ? 2 : 1, selected ? 0x68e4e8 : 0x52677b);
      this.returnLabels[index]?.setColor(selected ? TEAL : IVORY);
      this.returnHints[index]?.setText(selected
        ? `ENTER / A${action.shortcut ? ` / ${action.shortcut}` : ""}`
        : action.shortcut);
    });
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
    }).setResolution(uiTextResolution());
    if (centred) text.setOrigin(0.5, 0);
    else if (align === 1) text.setOrigin(1, 0);
    return text;
  }
}

function showSelectableRunDetails(details: string): void {
  document.getElementById("run-details-fallback")?.remove();
  const returnFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
    ? document.activeElement
    : document.querySelector<HTMLElement>("#game-root canvas");
  const overlay = document.createElement("div");
  overlay.id = "run-details-fallback";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "run-details-fallback-heading");
  Object.assign(overlay.style, {
    position: "fixed", inset: "0", zIndex: "10000", display: "grid", placeItems: "center",
    background: "rgba(5, 10, 16, .88)", padding: "24px",
  });
  const panel = document.createElement("div");
  Object.assign(panel.style, { width: "min(680px, 92vw)", color: "#e8e2d4", fontFamily: "monospace" });
  const heading = document.createElement("p");
  heading.id = "run-details-fallback-heading";
  heading.textContent = "Clipboard access was blocked. Select and copy these run details:";
  const textarea = document.createElement("textarea");
  textarea.value = details;
  textarea.readOnly = true;
  textarea.setAttribute("aria-label", "Selectable run details");
  Object.assign(textarea.style, {
    width: "100%", height: "280px", boxSizing: "border-box", resize: "vertical",
    background: "#101923", color: "#e8e2d4", border: "1px solid #68e4e8", padding: "12px",
  });
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "Close";
  Object.assign(close.style, { marginTop: "12px", padding: "8px 18px", cursor: "pointer" });
  const closeDialog = (): void => {
    document.removeEventListener("keydown", handleDialogKey);
    overlay.remove();
    const focusTarget = returnFocus?.isConnected
      ? returnFocus
      : document.querySelector<HTMLElement>("#game-root canvas");
    if (focusTarget instanceof HTMLCanvasElement && !focusTarget.hasAttribute("tabindex")) {
      focusTarget.tabIndex = -1;
    }
    focusTarget?.focus();
  };
  const handleDialogKey = (event: KeyboardEvent): void => {
    if (event.code !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    closeDialog();
  };
  close.addEventListener("click", closeDialog);
  document.addEventListener("keydown", handleDialogKey);
  panel.append(heading, textarea, close);
  overlay.append(panel);
  document.body.append(overlay);
  textarea.focus();
  textarea.select();
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

function demoSummary(reviewWeapons: readonly WeaponId[] = [
  "bastion-service-rifle",
  "scattergun",
  "bulwark-rotary-cannon",
]) {
  const damageByWeapon = Object.fromEntries(
    reviewWeapons.map((weaponId, index) => [weaponId, 1428.5 - index * 286.25]),
  );
  return createRunSummary({
    mode: "expedition",
    threatTier: 2,
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
    damageByWeapon,
    weapons: reviewWeapons.map((weaponId) => ({ weaponId, tier: 2 })),
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
    provenance: createCurrentRunProvenance({
      combatSeed: 61061,
      mapSeed: 20260910,
      gameSpeedMultiplier: 1,
      autoFireEnabled: true,
      aimAssistStrength: 0.35,
    }),
  });
}
