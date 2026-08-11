import { describe, expect, it } from "vitest";
import {
  scrapShopWeightedDrawCount,
  selectWeightedOfferIndex,
  selectWeightedScrapShopOffers,
  shopOfferDrawWeight,
} from "./ScrapShopOfferSelection";

describe("ScrapShopOfferSelection", () => {
  it("maps a single unit roll across cumulative weighted buckets", () => {
    const weights = [1, 3, 6];
    expect(selectWeightedOfferIndex(weights, 0)).toBe(0);
    expect(selectWeightedOfferIndex(weights, 0.1)).toBe(0);
    expect(selectWeightedOfferIndex(weights, 0.10001)).toBe(1);
    expect(selectWeightedOfferIndex(weights, 0.4)).toBe(1);
    expect(selectWeightedOfferIndex(weights, 0.40001)).toBe(2);
  });

  it("falls through to the final candidate for the top of the unit interval", () => {
    expect(selectWeightedOfferIndex([2, 3, 5], 0.999999)).toBe(2);
    expect(selectWeightedOfferIndex([2, 3, 5], 1)).toBe(2);
  });

  it("reports no index for an empty candidate set", () => {
    expect(selectWeightedOfferIndex([], 0.5)).toBe(-1);
  });

  it("computes the exact number of adapter-owned RNG draws", () => {
    expect(scrapShopWeightedDrawCount(1, 7, 4)).toBe(3);
    expect(scrapShopWeightedDrawCount(0, 2, 4)).toBe(2);
    expect(scrapShopWeightedDrawCount(5, 7, 4)).toBe(0);
  });

  it("keeps initial offers and selects without replacement from supplied rolls", () => {
    const repair = { id: "shop-repair" };
    const candidates = [
      { id: "shop-weapon:arc-carbine" },
      { id: "shop-upgrade:rapid-cycling" },
      { id: "shop-armour-retrofit" },
    ];
    expect(selectWeightedScrapShopOffers({
      initialOffers: [repair],
      candidates,
      offerCount: 3,
      luck: 0,
      curse: 0,
      randomUnits: [0, 0],
    })).toEqual([repair, candidates[0], candidates[1]]);
    expect(candidates).toHaveLength(3);
  });

  it("uses item rarity weights while unknown and non-item offers retain the flat weight", () => {
    const flat = shopOfferDrawWeight("shop-repair", 10, 5);
    expect(flat).toBeGreaterThan(0);
    expect(shopOfferDrawWeight("shop-item:missing", 10, 5)).toBe(flat);
    expect(shopOfferDrawWeight("shop-item:glass-cannon", 10, 5)).toBeGreaterThan(0);
  });
});
