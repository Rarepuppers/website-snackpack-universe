import { describe, expect, it } from "vitest";
import { BASE_HEIGHT, BASE_WIDTH } from "./DisplayScaling";
import { planDisplayPresentation } from "./DisplayPresentation";

describe("planDisplayPresentation", () => {
  it("keeps exact 1080p and 4K multiples crisp", () => {
    const fullHd = planDisplayPresentation(viewport(1920, 1080));
    const fourK = planDisplayPresentation(viewport(3840, 2160));

    expect(fullHd).toMatchObject({
      mode: "crisp",
      renderDeviceScale: 2,
      renderWidth: 1920,
      renderHeight: 1080,
      presentationWidth: 1920,
      presentationHeight: 1080,
      worldRect: { x: 0, y: 0, width: 1920, height: 1080 },
      physicalWorldRect: { x: 0, y: 0, width: 1920, height: 1080 },
      sampling: "nearest",
      cropped: false,
    });
    expect(fourK).toMatchObject({
      mode: "crisp",
      renderDeviceScale: 4,
      worldRect: { x: 0, y: 0, width: 3840, height: 2160 },
      sampling: "nearest",
    });
  });

  it("supersamples 1440p instead of leaving an integer-scale island", () => {
    const plan = planDisplayPresentation(viewport(2560, 1440));

    expect(plan).toMatchObject({
      mode: "fill",
      renderDeviceScale: 3,
      renderWidth: 2880,
      renderHeight: 1620,
      worldRect: { x: 0, y: 0, width: 2560, height: 1440 },
      sampling: "linear",
      cropped: false,
    });
  });

  it("fits Deck to 1280x720 with intentional 40px bands and no distortion", () => {
    const plan = planDisplayPresentation(viewport(1280, 800));

    expect(plan).toMatchObject({
      mode: "fill",
      renderDeviceScale: 2,
      worldRect: { x: 0, y: 40, width: 1280, height: 720 },
      presentationWidth: 1280,
      presentationHeight: 800,
      physicalWorldRect: { x: 0, y: 40, width: 1280, height: 720 },
      frameInsets: { left: 0, top: 40, right: 0, bottom: 40 },
      cropped: false,
    });
    expectAspectPreserved(plan.worldRect.width, plan.worldRect.height);
  });

  it("uses the authored expanded frame on Deck only when that asset is available", () => {
    const unavailable = planDisplayPresentation({
      ...viewport(1280, 800),
      requestedMode: "expanded-frame",
      expandedFrameAvailable: false,
    });
    const available = planDisplayPresentation({
      ...viewport(1280, 800),
      requestedMode: "auto",
      expandedFrameAvailable: true,
    });

    expect(unavailable.mode).toBe("fill");
    expect(available.mode).toBe("expanded-frame");
    expect(available.worldRect).toEqual({ x: 0, y: 40, width: 1280, height: 720 });
  });

  it("centres an ultrawide world and exposes both side-frame insets", () => {
    const plan = planDisplayPresentation({
      ...viewport(3440, 1440),
      expandedFrameAvailable: true,
    });

    expect(plan).toMatchObject({
      mode: "expanded-frame",
      renderDeviceScale: 3,
      worldRect: { x: 440, y: 0, width: 2560, height: 1440 },
      presentationWidth: 3440,
      presentationHeight: 1440,
      physicalWorldRect: { x: 440, y: 0, width: 2560, height: 1440 },
      frameInsets: { left: 440, top: 0, right: 440, bottom: 0 },
      cropped: false,
    });
    expectAspectPreserved(plan.worldRect.width, plan.worldRect.height);
  });

  it("fits a 1366x768 laptop without crop, stretch, or a 960x540 postage stamp", () => {
    const plan = planDisplayPresentation(viewport(1366, 768));

    expect(plan.mode).toBe("fill");
    expect(plan.renderDeviceScale).toBe(2);
    expect(plan.worldRect.width).toBeCloseTo(1365.3333333);
    expect(plan.worldRect.height).toBe(768);
    expect(plan.worldRect.x).toBeCloseTo(1 / 3);
    expect(plan.physicalWorldRect).toEqual({ x: 0, y: 0, width: 1365, height: 768 });
    expect(Object.values(plan.physicalWorldRect).every(Number.isInteger)).toBe(true);
    expectAspectPreserved(plan.worldRect.width, plan.worldRect.height);
  });

  it("retains explicit crisp letterboxing as a player choice", () => {
    const plan = planDisplayPresentation({
      ...viewport(2560, 1440),
      requestedMode: "crisp",
    });

    expect(plan).toMatchObject({
      mode: "crisp",
      renderDeviceScale: 2,
      worldRect: { x: 320, y: 180, width: 1920, height: 1080 },
      frameInsets: { left: 320, top: 180, right: 320, bottom: 180 },
      sampling: "nearest",
    });
  });

  it("uses a whole physical supersample scale at fractional Windows DPI", () => {
    const plan = planDisplayPresentation({ ...viewport(1920, 1080), devicePixelRatio: 1.25 });
    expect(plan.mode).toBe("fill");
    expect(plan.renderDeviceScale).toBe(3);
    expect(plan.worldRect).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
    expect(plan).toMatchObject({
      presentationWidth: 2400,
      presentationHeight: 1350,
      physicalWorldRect: { x: 0, y: 0, width: 2400, height: 1350 },
    });
  });

  it("never lets a legacy size preference crop the authored world", () => {
    const plan = planDisplayPresentation({
      ...viewport(1920, 1080),
      requestedMode: "crisp",
      sizeMultiplier: 2,
    });
    expect(plan.worldRect).toEqual({ x: 0, y: 0, width: 1920, height: 1080 });
    expect(plan.frameInsets).toEqual({ left: 0, top: 0, right: 0, bottom: 0 });
    expect(plan.cropped).toBe(false);
  });
});

function viewport(windowWidth: number, windowHeight: number) {
  return { windowWidth, windowHeight, devicePixelRatio: 1 };
}

function expectAspectPreserved(width: number, height: number): void {
  expect(width / height).toBeCloseTo(BASE_WIDTH / BASE_HEIGHT, 10);
}
