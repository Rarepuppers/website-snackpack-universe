import { describe, expect, it } from "vitest";
import {
  createRunSummary,
  damagePerMinute,
  mergeRunMetrics,
  totalRunDamage,
} from "./RunSummary";
import { applyTransformationChoice, createTransformationAffinityState } from "../transformations/TransformationAffinity";

describe("Task 50 run-summary contract", () => {
  it("merges cross-node metrics without losing weapon attribution", () => {
    const merged = mergeRunMetrics(
      {
        kills: 12,
        scrapEarned: 30,
        damageByWeapon: { rifle: 100, blade: 20 },
        damageTakenBySource: { contact: 6, projectile: 2 },
      },
      {
        kills: 8,
        scrapEarned: 25,
        damageByWeapon: { rifle: 40, arc: 60 },
        damageTakenBySource: { contact: 4, hazard: 3 },
      },
    );
    expect(merged).toEqual({
      kills: 20,
      scrapEarned: 55,
      damageByWeapon: { rifle: 140, blade: 20, arc: 60 },
      damageBySecond: [],
      elapsedSeconds: 0,
      damageTaken: 0,
      damageTakenBySource: { contact: 10, projectile: 2, hazard: 3 },
      eliteKills: 0,
      bossDamage: 0,
      highestHit: 0,
      criticalHits: 0,
      defeatCause: null,
    });
    expect(totalRunDamage(merged)).toBe(220);
  });

  it("rebases encounter timelines onto expedition elapsed time and aggregates minute bars", () => {
    const firstTimeline = Array.from({ length: 61 }, () => 0);
    firstTimeline[0] = 60;
    firstTimeline[60] = 40;
    const merged = mergeRunMetrics(
      {
        kills: 0,
        scrapEarned: 0,
        damageByWeapon: {},
        elapsedSeconds: 65,
        damageBySecond: firstTimeline,
      },
      {
        kills: 0,
        scrapEarned: 0,
        damageByWeapon: {},
        elapsedSeconds: 60,
        damageBySecond: [120],
      },
    );
    expect(merged.damageBySecond?.[65]).toBe(120);
    expect(damagePerMinute(merged)).toEqual([60, 160, 0]);
  });

  it("normalizes a serializable final-build recap", () => {
    const exposure = applyTransformationChoice(createTransformationAffinityState(), "psionic-operative", "psionic-sniper");
    if (!exposure.ok) throw new Error(exposure.reason);
    const summary = createRunSummary({
      mode: "expedition",
      threatTier: 2,
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
      transformation: exposure.state,
    });
    expect(summary.newlyUnlockedPerkIds).toEqual([]);
    expect(summary.threatTier).toBe(2);
    expect(summary.weapons).toEqual([{ weaponId: "bastion-service-rifle", tier: 2 }]);
    expect(summary.damageByWeapon["bastion-service-rifle"]).toBeCloseTo(900.25);
    expect(summary.highestHit).toBe(0);
    expect(summary.criticalHits).toBe(0);
    expect(summary.transformation.paths[0]).toMatchObject({ pathId: "psionic-operative", affinity: 1 });
  });
});
