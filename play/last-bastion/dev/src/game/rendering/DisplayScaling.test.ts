import { describe, expect, it } from "vitest";
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  planDisplayScale,
  setUiDeviceScale,
  uiTextResolution,
} from "./DisplayScaling";

describe("planDisplayScale", () => {
  it("maps one texel to whole physical pixels on a fractional-DPI display", () => {
    // Windows at 125%: a CSS zoom of 2 would land on 2.5 device pixels.
    const plan = planDisplayScale(1920, 1080, 1.25);
    expect(plan.deviceScale).toBe(2);
    expect(plan.zoom).toBeCloseTo(1.6);
    expect(plan.zoom * 1.25).toBe(2);
    // The canvas must still fit the window.
    expect(BASE_WIDTH * plan.zoom).toBeLessThanOrEqual(1920);
    expect(BASE_HEIGHT * plan.zoom).toBeLessThanOrEqual(1080);
  });

  it("keeps whole zoom on a standard-DPI display", () => {
    const plan = planDisplayScale(1920, 1080, 1);
    expect(plan.deviceScale).toBe(2);
    expect(plan.zoom).toBe(2);
  });

  it("uses the extra room on a HiDPI display", () => {
    // 2560×1440 at dpr 2 has room for 5 device pixels per texel: the canvas
    // occupies 2400×1350 CSS px and 4800×2700 physical px.
    const plan = planDisplayScale(2560, 1440, 2);
    expect(plan.deviceScale).toBe(5);
    expect(plan.zoom).toBe(2.5);
    expect(plan.zoom * 2).toBe(5);
    expect(BASE_WIDTH * plan.zoom).toBeLessThanOrEqual(2560);
    expect(BASE_HEIGHT * plan.zoom).toBeLessThanOrEqual(1440);
  });

  it("never drops below a single device pixel per texel", () => {
    const plan = planDisplayScale(320, 200, 1);
    expect(plan.deviceScale).toBe(1);
    expect(plan.zoom).toBe(1);
  });

  it("honours a game-size preference", () => {
    const fit = planDisplayScale(2880, 1620, 1);
    expect(fit.deviceScale).toBe(3);
    const halved = planDisplayScale(2880, 1620, 1, 0.5);
    expect(halved.deviceScale).toBe(1);
  });

  it("tolerates a missing device pixel ratio", () => {
    expect(planDisplayScale(1920, 1080, 0).zoom).toBe(2);
  });
});

describe("uiTextResolution", () => {
  it("tracks the active device scale so glyphs rasterise at native density", () => {
    setUiDeviceScale(3);
    expect(uiTextResolution()).toBe(3);
    setUiDeviceScale(1.4);
    expect(uiTextResolution()).toBe(1);
    setUiDeviceScale(0);
    expect(uiTextResolution()).toBe(1);
    setUiDeviceScale(2);
  });
});
