import { describe, expect, it } from "vitest";
import { debriefGamepadIntent, moveDebriefSelection } from "./DebriefNavigation";

describe("debrief navigation", () => {
  it("maps only navigation, confirm, and back buttons", () => {
    expect(debriefGamepadIntent(0)).toBe("confirm");
    expect(debriefGamepadIntent(1)).toBe("back");
    expect(debriefGamepadIntent(12)).toBe("previous");
    expect(debriefGamepadIntent(15)).toBe("next");
    expect(debriefGamepadIntent(4)).toBeNull();
    expect(debriefGamepadIntent(9)).toBeNull();
  });

  it("wraps selection in both directions", () => {
    expect(moveDebriefSelection(0, -1, 3)).toBe(2);
    expect(moveDebriefSelection(2, 1, 3)).toBe(0);
  });
});
