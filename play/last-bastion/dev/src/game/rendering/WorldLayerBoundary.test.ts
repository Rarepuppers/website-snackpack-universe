import { describe, expect, it } from "vitest";
import { isWorldLayerCandidate, WORLD_LAYER_DEPTH_CEILING } from "./WorldLayerBoundary";

describe("WorldLayerBoundary", () => {
  it("keeps world art below the stable HUD depth boundary", () => {
    expect(isWorldLayerCandidate({ active: true, visible: true, depth: 905 })).toBe(true);
    expect(isWorldLayerCandidate({ active: true, visible: true, depth: WORLD_LAYER_DEPTH_CEILING - 1 })).toBe(true);
  });

  it("leaves HUD, menus, inactive objects, and hidden pool entries out", () => {
    expect(isWorldLayerCandidate({ active: true, visible: true, depth: WORLD_LAYER_DEPTH_CEILING })).toBe(false);
    expect(isWorldLayerCandidate({ active: false, visible: true, depth: 100 })).toBe(false);
    expect(isWorldLayerCandidate({ active: true, visible: false, depth: 100 })).toBe(false);
  });
});

