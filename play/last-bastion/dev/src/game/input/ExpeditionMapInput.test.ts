import { describe, expect, it } from "vitest";
import { expeditionMapGamepadIntent } from "./ExpeditionMapInput";

describe("expedition map gamepad input", () => {
  it("maps route navigation, confirm, and back without accepting unrelated buttons", () => {
    expect(expeditionMapGamepadIntent(12)).toBe("previous");
    expect(expeditionMapGamepadIntent(14)).toBe("previous");
    expect(expeditionMapGamepadIntent(13)).toBe("next");
    expect(expeditionMapGamepadIntent(15)).toBe("next");
    expect(expeditionMapGamepadIntent(0)).toBe("confirm");
    expect(expeditionMapGamepadIntent(1)).toBe("back");
    expect(expeditionMapGamepadIntent(4)).toBeNull();
    expect(expeditionMapGamepadIntent(9)).toBeNull();
  });
});
