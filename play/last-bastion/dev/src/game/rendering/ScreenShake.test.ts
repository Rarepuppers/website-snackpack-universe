import { describe, expect, it } from "vitest";
import { screenShakeIntensity } from "./ScreenShake";

describe("screen-shake intensity", () => {
  it("scales authored shake without changing its duration contract", () => {
    expect(screenShakeIntensity(0.008, {
      enabled: true, reducedMotion: false, intensityMultiplier: 0.5,
    })).toBeCloseTo(0.004);
  });

  it("lets either the legacy toggle or reduced motion suppress shake", () => {
    expect(screenShakeIntensity(0.008, {
      enabled: false, reducedMotion: false, intensityMultiplier: 1,
    })).toBe(0);
    expect(screenShakeIntensity(0.008, {
      enabled: true, reducedMotion: true, intensityMultiplier: 1,
    })).toBe(0);
  });

  it("clamps edited preferences and rejects negative authored values", () => {
    expect(screenShakeIntensity(0.008, {
      enabled: true, reducedMotion: false, intensityMultiplier: 4,
    })).toBeCloseTo(0.008);
    expect(screenShakeIntensity(-1, {
      enabled: true, reducedMotion: false, intensityMultiplier: 0.5,
    })).toBe(0);
  });
});
