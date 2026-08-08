import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planDesktopDisplayTransition, type DesktopDisplayInfo } from "./DesktopDisplayPolicy.js";

const displays: readonly DesktopDisplayInfo[] = [
  { id: "1", label: "Primary", bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workArea: { x: 0, y: 0, width: 1920, height: 1040 }, scaleFactor: 1 },
  { id: "2", label: "Ultrawide", bounds: { x: 1920, y: 0, width: 3440, height: 1440 }, workArea: { x: 1920, y: 0, width: 3440, height: 1400 }, scaleFactor: 1.25 },
];

describe("desktop display transition policy", () => {
  it("centres the preserved window size on the requested display", () => {
    const plan = planDesktopDisplayTransition(
      { fullscreenMode: "windowed", selectedDisplayId: "2" },
      displays,
      "1",
      { x: 40, y: 40, width: 1280, height: 720 },
    )!;
    assert.equal(plan.display.id, "2");
    assert.deepEqual(plan.windowedBounds, { x: 3000, y: 340, width: 1280, height: 720 });
    assert.equal(plan.fullscreen, false);
  });

  it("falls back to the current display and clamps oversized windows", () => {
    const plan = planDesktopDisplayTransition(
      { fullscreenMode: "borderless", selectedDisplayId: "missing" },
      displays,
      "1",
      { x: 0, y: 0, width: 5000, height: 3000 },
    )!;
    assert.equal(plan.display.id, "1");
    assert.deepEqual(plan.windowedBounds, { x: 0, y: 0, width: 1920, height: 1040 });
    assert.equal(plan.fullscreen, true);
  });

  it("returns null when the host reports no displays", () => {
    assert.equal(planDesktopDisplayTransition(
      { fullscreenMode: "windowed", selectedDisplayId: null }, [], null,
      { x: 0, y: 0, width: 1280, height: 720 },
    ), null);
  });
});
