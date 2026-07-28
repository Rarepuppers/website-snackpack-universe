import { describe, expect, it } from "vitest";
import { assetsForGroup } from "./AssetGroups";

describe("AssetGroups", () => {
  it("returns stable, non-empty, duplicate-free groups", () => {
    for (const group of ["boot", "hero", "arena", "encounter", "weapons", "shop", "gallery", "close-view"] as const) {
      const first = assetsForGroup(group);
      expect(first.length, group).toBeGreaterThan(0);
      expect(new Set(first.map((asset) => asset.id)).size).toBe(first.length);
      expect(first).toEqual(assetsForGroup(group));
    }
  });
});
