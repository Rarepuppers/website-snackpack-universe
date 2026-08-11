import { describe, expect, it } from "vitest";
import { selectWeightedOfferIndex } from "./ScrapShopOfferSelection";

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
});
