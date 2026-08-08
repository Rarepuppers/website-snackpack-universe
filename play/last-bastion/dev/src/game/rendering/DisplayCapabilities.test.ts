import { describe, expect, it } from "vitest";
import {
  browserDisplayCapabilities,
  desktopDisplayCapabilities,
} from "./DisplayCapabilities";

describe("DisplayCapabilities", () => {
  it("does not advertise host-only controls in a browser", () => {
    expect(browserDisplayCapabilities({ fullscreenApiAvailable: true })).toEqual({
      host: "browser",
      fullscreenModes: ["windowed", "borderless"],
      canSelectDisplay: false,
      frameCaps: [60, "display"],
      canControlVsync: false,
    });
  });

  it("hides browser fullscreen when the API is unavailable", () => {
    expect(browserDisplayCapabilities({ fullscreenApiAvailable: false }).fullscreenModes)
      .toEqual(["windowed"]);
  });

  it("keeps unproven exclusive fullscreen and vsync out of the desktop contract", () => {
    const capabilities = desktopDisplayCapabilities();
    expect(capabilities.canSelectDisplay).toBe(true);
    expect(capabilities.fullscreenModes).toEqual(["windowed", "borderless"]);
    expect(capabilities.frameCaps).toEqual([60, 120, 144, "display"]);
    expect(capabilities.canControlVsync).toBe(false);
  });
});
