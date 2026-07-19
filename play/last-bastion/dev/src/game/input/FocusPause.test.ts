import { describe, expect, it } from "vitest";
import { focusLossRequestsPause } from "./FocusPause";

describe("focus-loss pause", () => {
  it("pauses immediately when the window loses focus", () => {
    expect(focusLossRequestsPause("blur", false)).toBe(true);
  });

  it("pauses only the hidden half of a visibility change", () => {
    expect(focusLossRequestsPause("visibilitychange", true)).toBe(true);
    expect(focusLossRequestsPause("visibilitychange", false)).toBe(false);
  });
});
