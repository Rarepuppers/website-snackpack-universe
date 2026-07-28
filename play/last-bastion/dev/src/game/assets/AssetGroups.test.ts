import { describe, expect, it } from "vitest";
import { assetsForGroup } from "./AssetGroups";

describe("AssetGroups", () => {
  it("returns stable, non-empty, duplicate-free groups", () => {
    for (const group of [
      "boot", "hero", "arena", "encounter", "weapons", "shop", "gallery",
      "close-view", "debrief", "shell-base", "shell-character", "map",
    ] as const) {
      const first = assetsForGroup(group);
      expect(first.length, group).toBeGreaterThan(0);
      expect(new Set(first.map((asset) => asset.id)).size).toBe(first.length);
      expect(first).toEqual(assetsForGroup(group));
    }
  });

  it("keeps the debrief preload limited to its visible art", () => {
    expect(assetsForGroup("debrief").map((asset) => asset.id)).toEqual([
      "batch-i-weapon-tiles-v1",
      "bastion-logistics-map-backdrop-v1",
    ]);
  });

  it("separates the shell backdrop from character-select art", () => {
    expect(assetsForGroup("shell-base").map((asset) => asset.id)).toEqual([
      "bastion-logistics-map-backdrop-v1",
    ]);
    expect(assetsForGroup("shell-character").map((asset) => asset.id)).toEqual([
      "canonical-perk-tiles-v2",
      "marine-select-portrait-v1",
      "medic-select-portrait-v1",
    ]);
  });

  it("limits the expedition map to its six act backdrops", () => {
    const assets = assetsForGroup("map");
    expect(assets).toHaveLength(6);
    expect(assets.every((asset) => asset.id.endsWith("-map-backdrop-v1"))).toBe(true);
  });
});
