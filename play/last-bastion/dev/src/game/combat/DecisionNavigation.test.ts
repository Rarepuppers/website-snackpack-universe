import { describe, expect, it } from "vitest";
import { stepDecisionNavigation, type DecisionNavigationInput } from "./DecisionNavigation";

function input(overrides: Partial<DecisionNavigationInput> = {}): DecisionNavigationInput {
  return {
    selectedIndex: 0,
    enabled: [true, true, true],
    keyboardDelta: 0,
    stickY: 0,
    stickReady: true,
    digitIndex: null,
    confirmPressed: false,
    ...overrides,
  };
}

describe("stepDecisionNavigation", () => {
  it("moves one option per keypress", () => {
    expect(stepDecisionNavigation(input({ keyboardDelta: 1 })).selectedIndex).toBe(1);
    expect(stepDecisionNavigation(input({ selectedIndex: 1, keyboardDelta: -1 })).selectedIndex).toBe(0);
  });

  it("wraps at both ends", () => {
    expect(stepDecisionNavigation(input({ selectedIndex: 2, keyboardDelta: 1 })).selectedIndex).toBe(0);
    expect(stepDecisionNavigation(input({ selectedIndex: 0, keyboardDelta: -1 })).selectedIndex).toBe(2);
  });

  it("skips options the player cannot afford", () => {
    const result = stepDecisionNavigation(input({
      selectedIndex: 0,
      enabled: [true, false, true],
      keyboardDelta: 1,
    }));
    expect(result.selectedIndex).toBe(2);
  });

  it("settles rather than spinning when nothing is affordable", () => {
    // The bounded loop matters: an unbounded "step until enabled" would hang the
    // frame on a shop where every offer is out of reach.
    const result = stepDecisionNavigation(input({
      enabled: [false, false, false],
      keyboardDelta: 1,
    }));
    expect(Number.isInteger(result.selectedIndex)).toBe(true);
    expect(result.confirm).toBe(false);
  });

  it("refuses to confirm a disabled option", () => {
    expect(stepDecisionNavigation(input({
      enabled: [false, true, true],
      confirmPressed: true,
    })).confirm).toBe(false);
    expect(stepDecisionNavigation(input({ confirmPressed: true })).confirm).toBe(true);
  });

  describe("the gamepad stick", () => {
    it("steps once per push rather than once per frame", () => {
      const pushed = stepDecisionNavigation(input({ stickY: 0.9 }));
      expect(pushed.selectedIndex).toBe(1);
      expect(pushed.stickReady).toBe(false);

      // Held at full deflection on the next frame: must not step again.
      const held = stepDecisionNavigation(input({
        selectedIndex: pushed.selectedIndex,
        stickY: 0.9,
        stickReady: pushed.stickReady,
      }));
      expect(held.selectedIndex).toBe(1);
    });

    it("re-arms once the stick returns to centre", () => {
      const centred = stepDecisionNavigation(input({ stickY: 0.1, stickReady: false }));
      expect(centred.stickReady).toBe(true);
    });

    it("ignores a lazy push that never reaches the threshold", () => {
      // Between release and engage: neither a step nor a re-arm.
      const result = stepDecisionNavigation(input({ stickY: 0.5, stickReady: true }));
      expect(result.selectedIndex).toBe(0);
      expect(result.stickReady).toBe(true);
    });

    it("reads the stick upward as well as downward", () => {
      expect(stepDecisionNavigation(input({ selectedIndex: 1, stickY: -0.9 })).selectedIndex).toBe(0);
    });
  });

  describe("quick-pick digits", () => {
    it("selects and confirms in one press", () => {
      const result = stepDecisionNavigation(input({ digitIndex: 2 }));
      expect(result).toMatchObject({ selectedIndex: 2, confirm: true });
    });

    it("moves the highlight but does not buy an option the player cannot afford", () => {
      // Preserved from the scene's original behaviour: the digit still moves the
      // selection, and the confirm is what refuses. Worth pinning rather than
      // assuming, because the two halves live in different places.
      const result = stepDecisionNavigation(input({ enabled: [true, false, true], digitIndex: 1 }));
      expect(result).toMatchObject({ selectedIndex: 1, confirm: false });
    });

    it("ignores a digit with no option behind it", () => {
      const result = stepDecisionNavigation(input({ digitIndex: 7 }));
      expect(result).toMatchObject({ selectedIndex: 0, confirm: false });
    });
  });

  describe("degenerate input", () => {
    it("does nothing with no options at all", () => {
      const result = stepDecisionNavigation(input({ enabled: [], confirmPressed: true, digitIndex: 0 }));
      expect(result).toEqual({ selectedIndex: 0, stickReady: true, confirm: false });
    });

    it("recovers from a selection index left out of range", () => {
      // A decision that shrinks between frames would otherwise index past the end.
      expect(stepDecisionNavigation(input({ selectedIndex: 99 })).selectedIndex).toBe(2);
      expect(stepDecisionNavigation(input({ selectedIndex: -4 })).selectedIndex).toBe(0);
      expect(stepDecisionNavigation(input({ selectedIndex: Number.NaN })).selectedIndex).toBe(0);
    });
  });
});
