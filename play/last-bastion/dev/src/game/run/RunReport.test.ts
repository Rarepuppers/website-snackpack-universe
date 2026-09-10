import { describe, expect, it } from "vitest";
import { createCurrentRunProvenance, createRunSummary } from "./RunSummary";
import { formatRunDetails, quickDropRetryUrl } from "./RunReport";

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
    damageTaken: 24,
    damageTakenBySource: { projectile: 16, contact: 8 },
    defeatCause: "storm projectile",
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
    expect(report).toContain("What ended this run: storm projectile");
    expect(report).not.toMatch(/[A-Z]:\\|file:\/\//i);
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
});
