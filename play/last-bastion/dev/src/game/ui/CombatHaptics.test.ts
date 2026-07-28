import { describe, expect, it, vi } from "vitest";
import type { CombatEvent } from "../combat/CombatSimulation";
import { CombatHaptics, hapticPatternForCombatEvent } from "./CombatHaptics";

describe("combat haptic feedback", () => {
  it("maps only consequential events to distinct feedback patterns", () => {
    const point = { x: 1, y: 2 };
    expect(hapticPatternForCombatEvent({ type: "player-hit", position: point, damage: 4 }))
      .toMatchObject({ durationMilliseconds: 110, strongMagnitude: 0.65 });
    expect(hapticPatternForCombatEvent({ type: "player-shield-hit", position: point, damage: 4 }))
      .toMatchObject({ durationMilliseconds: 70, weakMagnitude: 0.38 });
    expect(hapticPatternForCombatEvent({ type: "player-revived", position: point }))
      .toMatchObject({ durationMilliseconds: 280 });
    expect(hapticPatternForCombatEvent({ type: "xp-collected", position: point, value: 1 })).toBeNull();
  });

  it("scales both motors and treats zero strength or missing hardware as safe no-ops", async () => {
    const playEffect = vi.fn().mockResolvedValue("complete");
    const haptics = new CombatHaptics(() => ({ playEffect }), 0.5);
    const event: CombatEvent = { type: "player-hit", position: { x: 0, y: 0 }, damage: 6 };
    haptics.playForEvent(event);
    expect(playEffect).toHaveBeenCalledWith("dual-rumble", {
      duration: 110,
      strongMagnitude: 0.325,
      weakMagnitude: 0.125,
    });

    haptics.setStrength(0);
    haptics.playForEvent(event);
    expect(playEffect).toHaveBeenCalledTimes(1);
    expect(() => new CombatHaptics(() => null, 1).playForEvent(event)).not.toThrow();
  });
});
