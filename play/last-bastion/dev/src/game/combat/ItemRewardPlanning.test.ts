import { describe, expect, it } from "vitest";
import { ITEM_CATALOG } from "../content/itemCatalog";
import { foldRunItemStats, planItemGrant, planWeightedRewardItem } from "./ItemRewardPlanning";

describe("weighted reward-item planning", () => {
  it("maps supplied endpoint rolls onto the authored catalogue", () => {
    expect(planWeightedRewardItem({ luck: 0, curse: 0, randomUnit: 0 })?.itemId).toBe(ITEM_CATALOG[0]?.id);
    expect(planWeightedRewardItem({ luck: 0, curse: 0, randomUnit: 0.999999 })?.itemId)
      .toBe(ITEM_CATALOG.at(-1)?.id);
  });

  it("is deterministic for the same luck, curse, and supplied roll", () => {
    const input = { luck: 35, curse: 10, randomUnit: 0.42 };
    expect(planWeightedRewardItem(input)).toEqual(planWeightedRewardItem(input));
  });
});

describe("item grant and stat-fold planning", () => {
  it("accepts authored items and rejects unknown ids", () => {
    expect(planItemGrant("whetstone")).toEqual({ itemId: "whetstone" });
    expect(planItemGrant("not-an-item")).toBeNull();
  });

  it("adds stacked owned-item stats onto copied base grants", () => {
    const baseItemStats = { damagePercent: 5, armourFlat: 1 };
    expect(foldRunItemStats({
      baseItemStats,
      ownedItemIds: ["whetstone", "whetstone", "plate-fragment"],
    })).toEqual({ damagePercent: 21, armourFlat: 3 });
    expect(baseItemStats).toEqual({ damagePercent: 5, armourFlat: 1 });
  });

  it("ignores unknown owned ids through the canonical catalogue fold", () => {
    expect(foldRunItemStats({ baseItemStats: { luck: 2 }, ownedItemIds: ["not-an-item"] }))
      .toEqual({ luck: 2 });
  });
});
