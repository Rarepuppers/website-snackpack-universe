import { describe, expect, it } from "vitest";
import { createRunSummary, mergeRunMetrics, totalRunDamage } from "./RunSummary";

describe("Task 50 run-summary contract", () => {
  it("merges cross-node metrics without losing weapon attribution", () => {
    const merged = mergeRunMetrics(
      { kills: 12, scrapEarned: 30, damageByWeapon: { rifle: 100, blade: 20 } },
      { kills: 8, scrapEarned: 25, damageByWeapon: { rifle: 40, arc: 60 } },
    );
    expect(merged).toEqual({
      kills: 20,
      scrapEarned: 55,
      damageByWeapon: { rifle: 140, blade: 20, arc: 60 },
    });
    expect(totalRunDamage(merged)).toBe(220);
  });

  it("normalizes a serializable final-build recap", () => {
    const summary = createRunSummary({
      mode: "expedition",
      outcome: "victory",
      heroId: "marine",
      perkId: "perk-veteran",
      waveReached: 8,
      nodesCleared: 7,
      kills: 240,
      scrapEarned: 180.5,
      scrapBanked: 42,
      level: 14,
      damageByWeapon: { "bastion-service-rifle": 900.25 },
      weapons: [{ weaponId: "bastion-service-rifle", tier: 2 }],
      upgrades: [{ upgradeId: "rapid-cycling", level: 3 }],
    });
    expect(summary.newlyUnlockedPerkIds).toEqual([]);
    expect(summary.weapons).toEqual([{ weaponId: "bastion-service-rifle", tier: 2 }]);
    expect(summary.damageByWeapon["bastion-service-rifle"]).toBeCloseTo(900.25);
  });
});
