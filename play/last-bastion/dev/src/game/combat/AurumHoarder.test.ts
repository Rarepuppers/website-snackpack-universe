import { describe, expect, it } from "vitest";
import {
  AURUM_HOARDER_BREAK_THRESHOLDS,
  crossedAurumThresholds,
  isAurumSpawnEligible,
  selectAurumExit,
  shouldSpawnAurumHoarder,
} from "./AurumHoarder";

describe("Aurum Hoarder rules", () => {
  const eligible = {
    waveNumber: 3,
    totalWaves: 5,
    roll: 0.05,
    liveEnemies: 20,
    liveCap: 32,
    alreadySpawned: false,
    objectiveActive: false,
    rewardEconomyEnabled: true,
  } as const;

  it("requires the live Scrap economy before accepting an eligible seeded roll", () => {
    expect(shouldSpawnAurumHoarder(eligible)).toBe(true);
    expect(shouldSpawnAurumHoarder({ ...eligible, rewardEconomyEnabled: false })).toBe(false);
  });

  it("rejects tutorial, boss, objective, duplicate, and full-cap contexts", () => {
    for (const context of [
      { ...eligible, waveNumber: 2 },
      { ...eligible, waveNumber: 5 },
      { ...eligible, objectiveActive: true },
      { ...eligible, alreadySpawned: true },
      { ...eligible, liveEnemies: 32 },
    ]) {
      expect(isAurumSpawnEligible(context)).toBe(false);
    }
  });

  it("accepts a deterministic mid-run roll below the event chance", () => {
    expect(isAurumSpawnEligible(eligible)).toBe(true);
    expect(isAurumSpawnEligible({ ...eligible, roll: 0.1 })).toBe(false);
  });

  it("chooses a deterministic exit safely away from the Marine", () => {
    const exit = selectAurumExit({ x: 30, y: 12 }, { x: 22.5, y: 12.5 }, 45, 25);
    expect(exit.x).toBeCloseTo(44.3);
    expect(Math.hypot(exit.x - 22.5, exit.y - 12.5)).toBeGreaterThan(6);
  });

  it("pays each armour threshold once even when one hit crosses several", () => {
    expect(crossedAurumThresholds(120, 58, 120, 0)).toEqual([0.75, 0.5]);
    expect(crossedAurumThresholds(58, 0, 120, 2)).toEqual([0.25]);
    expect(AURUM_HOARDER_BREAK_THRESHOLDS).toHaveLength(3);
  });
});
