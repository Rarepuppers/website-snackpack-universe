import { describe, expect, it } from "vitest";
import { createFoundrySovereignState, sovereignSummonBuff, sovereignWave, stepFoundrySovereign } from "./FoundrySovereign";

describe("FoundrySovereign", () => {
  it("telegraphs before fabricating deterministic mixed waves", () => {
    const warning = stepFoundrySovereign({ ...createFoundrySovereignState(), phaseRemainingSeconds: 0 }, 0);
    expect(warning.warning).toBe(true);
    expect(warning.fabricated).toEqual([]);
    const fabricated = stepFoundrySovereign({ ...warning.state, phaseRemainingSeconds: 0 }, 0);
    expect(fabricated.fabricated).toEqual(["foundry-drone", "foundry-drone"]);
    expect(fabricated.state.phase).toBe("fabricating");
  });

  it("rotates drone, mixed, and turret waves", () => {
    expect(sovereignWave(0)).toEqual(["foundry-drone", "foundry-drone"]);
    expect(sovereignWave(1)).toEqual(["foundry-drone", "foundry-turret"]);
    expect(sovereignWave(2)).toEqual(["foundry-turret", "foundry-turret"]);
  });

  it("caps the summon buff at fifty percent", () => {
    expect(sovereignSummonBuff(2)).toBe(1.2);
    expect(sovereignSummonBuff(99)).toBe(1.5);
  });
});
