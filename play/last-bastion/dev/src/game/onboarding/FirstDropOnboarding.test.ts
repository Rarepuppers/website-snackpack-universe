import { describe, expect, it } from "vitest";
import {
  advanceFirstDropOnboarding,
  completedFirstDropGoalCount,
  createFirstDropOnboarding,
  firstIncompleteDropGoal,
  shouldShowFirstDropOnboarding,
} from "./FirstDropOnboarding";

describe("guided first drop", () => {
  it("accumulates completed goals even when the player demonstrates them out of order", () => {
    let state = createFirstDropOnboarding();
    state = advanceFirstDropOnboarding(state, {
      moved: false, evaded: true, dealtDamage: true, clearedWave: false,
    });
    expect(completedFirstDropGoalCount(state)).toBe(2);
    expect(firstIncompleteDropGoal(state)).toBe("move");

    state = advanceFirstDropOnboarding(state, {
      moved: true, evaded: false, dealtDamage: false, clearedWave: true,
    });
    expect(completedFirstDropGoalCount(state)).toBe(4);
    expect(firstIncompleteDropGoal(state)).toBeNull();
  });

  it("shows once for real runs, supports explicit review, and stays off lab routes", () => {
    expect(shouldShowFirstDropOnboarding(0, false, false)).toBe(true);
    expect(shouldShowFirstDropOnboarding(1, false, false)).toBe(false);
    expect(shouldShowFirstDropOnboarding(5, true, false)).toBe(true);
    expect(shouldShowFirstDropOnboarding(0, true, true)).toBe(false);
  });
});
