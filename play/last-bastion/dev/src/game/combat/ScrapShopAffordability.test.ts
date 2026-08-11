import { describe, expect, it } from "vitest";
import { refreshScrapShopAffordability, sortScrapShopOffersAffordableFirst } from "./ScrapShopAffordability";

describe("ScrapShopAffordability", () => {
  it("refreshes against current Scrap and treats missing cost as free", () => {
    const offers = [{ id: "free" }, { id: "edge", cost: 10 }, { id: "dear", cost: 11 }];
    const refreshed = refreshScrapShopAffordability(offers, 10);
    expect(refreshed.map((offer) => offer.affordable)).toEqual([true, true, false]);
    expect(refreshed[0]).not.toBe(offers[0]);
  });

  it("orders affordable offers first while preserving order inside both groups", () => {
    const offers = [
      { id: "dear-a", affordable: false },
      { id: "cheap-a", affordable: true },
      { id: "dear-b", affordable: false },
      { id: "cheap-b", affordable: true },
    ];
    expect(sortScrapShopOffersAffordableFirst(offers).map((offer) => offer.id))
      .toEqual(["cheap-a", "cheap-b", "dear-a", "dear-b"]);
    expect(offers.map((offer) => offer.id)).toEqual(["dear-a", "cheap-a", "dear-b", "cheap-b"]);
  });
});
