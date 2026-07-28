import { describe, expect, it } from "vitest";
import {
  AdaptivePerformanceGovernor,
  combatEffectsBudget,
} from "./AdaptivePerformance";

describe("adaptive combat performance", () => {
  it("degrades under sustained frame pressure and recovers with hysteresis", () => {
    const governor = new AdaptivePerformanceGovernor("auto");
    for (let frame = 0; frame < 140; frame += 1) governor.sample(32);
    expect(governor.snapshot().tier).toBe("medium");

    for (let frame = 0; frame < 800; frame += 1) governor.sample(16);
    expect(governor.snapshot().tier).toBe("high");
  });

  it("honours fixed preferences and ignores suspended-frame spikes", () => {
    const governor = new AdaptivePerformanceGovernor("low");
    for (let frame = 0; frame < 500; frame += 1) governor.sample(10);
    expect(governor.snapshot().tier).toBe("low");
    expect(governor.sample(500, true)).toBe(false);
    expect(governor.setPreference("high")).toBe(true);
    expect(governor.snapshot().tier).toBe("high");
  });

  it("keeps gameplay-independent cosmetic budgets explicit", () => {
    expect(combatEffectsBudget("high", 12)).toEqual({
      maximumActiveEffects: 192,
      burstScale: 1,
      maximumDamageNumbers: 24,
    });
    expect(combatEffectsBudget("low", null)).toEqual({
      maximumActiveEffects: 48,
      burstScale: 0.45,
      maximumDamageNumbers: 10,
    });
  });
});
