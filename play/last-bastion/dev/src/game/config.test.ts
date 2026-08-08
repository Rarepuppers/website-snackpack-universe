import { describe, expect, it } from "vitest";
import { phaserFrameTiming } from "./rendering/FrameCapConfig";

describe("game renderer configuration", () => {
  it("uses Phaser's on-screen limiter for an explicit frame cap", () => {
    expect(phaserFrameTiming(120)).toEqual({ limit: 120, target: 120 });
  });

  it("leaves the display-rate option uncapped by Phaser", () => {
    expect(phaserFrameTiming("display")).toEqual({ limit: 0, target: 60 });
  });
});
