import { describe, expect, it } from "vitest";
import { SCOUT_DEPLOYMENT_RELEASED } from "../progression/ArmoryProgression";
import { assetsForGroup } from "./AssetGroups";

describe("AssetGroups", () => {
  it("returns stable, non-empty, duplicate-free groups", () => {
    for (const group of [
      "boot", "hero", "arena", "encounter", "weapons", "shop", "gallery",
      "close-view",
    ] as const) {
      const first = assetsForGroup(group);
      expect(first.length, group).toBeGreaterThan(0);
      expect(new Set(first.map((asset) => asset.id)).size).toBe(first.length);
      expect(first).toEqual(assetsForGroup(group));
    }
  });

  it("includes every production-playable hero family", () => {
    const ids = assetsForGroup("hero").map((asset) => asset.id);
    expect(ids.some((id) => id.startsWith("marine"))).toBe(true);
    expect(ids.some((id) => id.startsWith("medic"))).toBe(true);
    expect(ids.some((id) => id.startsWith("assault"))).toBe(true);
    expect(ids.some((id) => id.startsWith("tactician"))).toBe(true);
    expect(ids.some((id) => id.startsWith("scout"))).toBe(SCOUT_DEPLOYMENT_RELEASED);
  });

  it("includes Assault's Marauder family with released weapons", () => {
    expect(assetsForGroup("weapons").map((asset) => asset.id)).toContain("marauder-ar-v1");
  });

});
