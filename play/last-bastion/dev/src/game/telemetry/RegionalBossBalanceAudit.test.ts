import { describe, expect, it } from "vitest";
import {
  runRegionalBossBalanceAudit,
  summarizeRegionalBossBalanceAudit,
} from "./RegionalBossBalanceAudit";

describe("regional boss balance preflight", () => {
  it("runs five rotating-hero samples for every authored strategy", () => {
    const rows = runRegionalBossBalanceAudit(5);
    expect(rows).toHaveLength(15);
    expect(new Set(rows.map((row) => row.heroId))).toEqual(new Set(["marine", "medic", "assault", "tactician", "scout"]));
    expect(summarizeRegionalBossBalanceAudit(rows)).toHaveLength(3);
  });

  it("exposes every signature phase and keeps both Sovereign answers viable", () => {
    const rows = runRegionalBossBalanceAudit(5);
    const choir = rows.filter((row) => row.boss === "the-choir");
    const coreRush = rows.filter((row) => row.strategy === "core-rush");
    const summonControl = rows.filter((row) => row.strategy === "summon-control");

    expect(choir.every((row) => row.phaseTransitions >= 2)).toBe(true);
    expect(coreRush.every((row) => row.fabricationWaves >= 1)).toBe(true);
    expect(summonControl.some((row) => row.childDefeats > 0)).toBe(true);
    expect(coreRush.filter((row) => row.outcome === "victory").length).toBeGreaterThanOrEqual(3);
    expect(summonControl.filter((row) => row.outcome === "victory").length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the representative boss-entry build inside the pre-observation safety envelope", () => {
    const summaries = summarizeRegionalBossBalanceAudit(runRegionalBossBalanceAudit(5));
    for (const summary of summaries) {
      expect(summary.winRate, `${summary.boss} ${summary.strategy}`).toBeGreaterThanOrEqual(0.6);
      expect(summary.medianDurationSeconds, `${summary.boss} ${summary.strategy}`).toBeGreaterThan(20);
      expect(summary.medianDurationSeconds, `${summary.boss} ${summary.strategy}`).toBeLessThan(180);
      expect(summary.medianPeakLiveEnemies, `${summary.boss} ${summary.strategy}`).toBeLessThanOrEqual(12);
    }
  });
});
