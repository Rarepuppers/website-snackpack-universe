import { describe, expect, it } from "vitest";
import { TOUCH_FRIENDLY_GAMES, shouldShowTouchNotice, type InputEnvironment } from "./TouchNotice";

const phone: InputEnvironment = {
  coarsePointer: true, anyFinePointer: false, gamepadConnected: false, acknowledged: false, webPage: true,
};

describe("touch notice", () => {
  it("shows on a touch-only device that has nothing else to play with", () => {
    expect(shouldShowTouchNotice(phone)).toBe(true);
  });

  it("never blocks a device that can actually play", () => {
    expect(shouldShowTouchNotice({ ...phone, coarsePointer: false, anyFinePointer: true })).toBe(false);
    // Laptop touchscreens and iPads with a trackpad report a fine pointer too.
    expect(shouldShowTouchNotice({ ...phone, anyFinePointer: true })).toBe(false);
    expect(shouldShowTouchNotice({ ...phone, gamepadConnected: true })).toBe(false);
  });

  it("respects the player's choice to continue and skips the desktop host", () => {
    expect(shouldShowTouchNotice({ ...phone, acknowledged: true })).toBe(false);
    expect(shouldShowTouchNotice({ ...phone, webPage: false })).toBe(false);
  });

  it("links only to same-site arcade pages", () => {
    for (const game of TOUCH_FRIENDLY_GAMES) expect(game.href).toMatch(/^\/play\/[a-z0-9-]+\/$/);
  });
});
