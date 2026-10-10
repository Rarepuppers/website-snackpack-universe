import { describe, expect, it } from "vitest";
import { createCurrentRunProvenance, createRunSummary } from "./RunSummary";
import { formatRunDetails, quickDropRetryUrl, runModeName } from "./RunReport";
import { UPGRADE_CATALOG } from "../content/upgradeCatalog";
import RUN_SUMMARY_SCENE from "../scenes/RunSummaryScene.ts?raw";

function summary(mode: "quick-drop" | "expedition" = "quick-drop") {
  return createRunSummary({
    mode,
    outcome: "defeat",
    heroId: "marine",
    perkId: "perk-veteran",
    waveReached: 4,
    nodesCleared: mode === "expedition" ? 3 : 0,
    kills: 42,
    scrapEarned: 18,
    scrapBanked: 7,
    level: 5,
    damageByWeapon: { "bastion-service-rifle": 320 },
    elapsedSeconds: 125,
    damageTaken: 24,
    damageTakenBySource: { projectile: 16, contact: 8 },
    defeatCause: "storm projectile",
    threatTier: mode === "expedition" ? 2 : null,
    commandMarksEarned: 9,
    weapons: [{ weaponId: "bastion-service-rifle", tier: 1 }],
    upgrades: [],
    provenance: createCurrentRunProvenance({
      combatSeed: 61061,
      mapSeed: mode === "expedition" ? 2026 : null,
      gameSpeedMultiplier: 0.75,
      autoFireEnabled: true,
      aimAssistStrength: 0.35,
      gameSpeedModified: true,
    }),
  });
}

describe("reproducible run report", () => {
  it("formats setup identity and a factual defeat explanation without machine paths", () => {
    const report = formatRunDetails(summary());
    expect(report).toContain("Combat seed: 61061");
    expect(report).toContain("Simulation: 3");
    expect(report).toContain("speed 0.75x (changed during run)");
    expect(report).toContain("Duration: 2:05");
    expect(report).toContain("Dominant incoming threat: projectile");
    expect(report).toContain("Strongest weapon: bastion service rifle");
    expect(report).toContain("9 Command Marks");
    expect(report).toContain("What ended this run: storm projectile");
    expect(report).not.toMatch(/[A-Z]:\\|file:\/\//i);
  });

  it("includes the selected threat tier in expedition reports", () => {
    expect(formatRunDetails(summary("expedition"))).toContain("Threat tier: 2");
    expect(formatRunDetails(summary())).not.toContain("Threat tier:");
  });

  it("builds an exact Quick Drop retry URL with hero, perk, seed and settings", () => {
    expect(quickDropRetryUrl(summary())).toBe(
      "?screen=game&hero=marine&seed=61061&gamespeed=0.75&autofire=1&aimassist=0.35&perk=perk-veteran",
    );
    expect(quickDropRetryUrl(summary("expedition"))).toBeNull();
  });

  it("normalizes old summaries to explicit unknown provenance", () => {
    const old = createRunSummary({ ...summary(), provenance: undefined });
    expect(old.provenance).toMatchObject({ combatSeed: null, mapSeed: null, buildVersion: "unknown", simulationVersion: 0 });
    expect(quickDropRetryUrl(old)).toBeNull();
  });

  it("keeps a Daily retry a Daily and names the mode in the report", () => {
    const daily = createRunSummary({ ...summary(), dailyKey: "2026-10-11" });
    expect(new URLSearchParams(quickDropRetryUrl(daily)!).get("daily")).toBe("2026-10-11");
    expect(new URLSearchParams(quickDropRetryUrl(summary())!).get("daily")).toBeNull();
    expect(runModeName(daily)).toBe("Daily Drop (2026-10-11)");
    expect(runModeName(summary())).toBe("Quick Drop");
    expect(formatRunDetails(daily)).toContain("Mode: Daily Drop (2026-10-11)");
    expect(formatRunDetails(summary())).toContain("Progress: wave 4, level 5");
  });

  it("uses only real upgrade ids in the debrief review fixture", () => {
    // The fixture once named a non-existent "armour-plating", so every debrief
    // capture showed a raw id instead of an upgrade name.
    const ids = [...RUN_SUMMARY_SCENE.matchAll(/upgradeId: "([a-z-]+)"/g)].map((match) => match[1]!);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(Object.keys(UPGRADE_CATALOG), id).toContain(id);
  });
});
