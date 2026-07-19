import { describe, expect, it } from "vitest";
import {
  BASE_HEIGHT,
  BASE_WIDTH,
  planDisplayScale,
  setUiDeviceScale,
  uiSafeArea,
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

  it("locks the 960x540 simulation canvas to exact Full HD and 4K multiples", () => {
    expect([BASE_WIDTH, BASE_HEIGHT]).toEqual([960, 540]);
    expect(planDisplayScale(1920, 1080, 1)).toEqual({ deviceScale: 2, zoom: 2 });
    expect(planDisplayScale(3840, 2160, 1)).toEqual({ deviceScale: 4, zoom: 4 });
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

describe("uiSafeArea", () => {
  it("keeps every HUD edge inside a symmetric 960x540 title-safe rectangle", () => {
    expect(uiSafeArea()).toEqual({
      left: 19, top: 11, right: 941, bottom: 529, centreX: 480, centreY: 270,
    });
  });

  it("projects to exact proportional margins at Full HD and 4K", () => {
    const safe = uiSafeArea();
    expect([safe.left * 2, safe.top * 2, (BASE_WIDTH - safe.right) * 2]).toEqual([38, 22, 38]);
    expect([safe.left * 4, safe.top * 4, (BASE_HEIGHT - safe.bottom) * 4]).toEqual([76, 44, 44]);
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
