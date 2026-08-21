import { describe, expect, it } from "vitest";
import { createRunSummary } from "./RunSummary";
import { runRecordPresentation } from "./RunRecordPresentation";

function summary(overrides: Partial<Parameters<typeof createRunSummary>[0]> = {}) {
  return createRunSummary({
    mode: "expedition",
    outcome: "victory",
    heroId: "marine",
    perkId: null,
    waveReached: 10,
    nodesCleared: 20,
    kills: 100,
    scrapEarned: 50,
    scrapBanked: 20,
    level: 8,
    damageByWeapon: {},
    weapons: [],
    upgrades: [],
    ...overrides,
  });
}

describe("run record presentation", () => {
  it("puts the defeat cause ahead of aggregate damage", () => {
    const view = runRecordPresentation(summary({
      outcome: "defeat",
      heroId: "scout",
      defeatCause: "storm-regent",
      damageTakenBySource: { scuttler: 20 },
    }));

    expect(view).toEqual({ heroLabel: "SCOUT", balanceSignal: "DOWNED BY STORM REGENT" });
  });

  it("shows the dominant incoming threat for a completed run", () => {
    const view = runRecordPresentation(summary({
      damageTakenBySource: { scuttler: 4.4, "arc-warden": 9.6 },
    }));

    expect(view.balanceSignal).toBe("TOP THREAT ARC WARDEN 10");
  });

  it("falls back to the strongest weapon when no incoming damage was recorded", () => {
    const view = runRecordPresentation(summary({
      damageByWeapon: { scattergun: 30, "bastion-service-rifle": 70.2 },
    }));

    expect(view.balanceSignal).toBe("TOP WEAPON BASTION SERVICE RIFLE 70");
  });
});
