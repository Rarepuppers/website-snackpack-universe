import { describe, expect, it } from "vitest";
import { planScrapShopVisitOpen, planScrapShopVisitReset } from "./ScrapShopVisit";

describe("scrap-shop visit lifecycle", () => {
  it("resets every per-visit field without supplying a profile mutation", () => {
    const reset = planScrapShopVisitReset();
    expect(reset).toEqual({ offers: null, lockedOfferId: null, rerollUsed: false, mode: "offers" });
    expect("profileId" in reset).toBe(false);
  });

  it("opens a reset visit with the requested themed profile", () => {
    expect(planScrapShopVisitOpen("science-lab")).toEqual({
      offers: null,
      lockedOfferId: null,
      rerollUsed: false,
      mode: "offers",
      profileId: "science-lab",
    });
  });
});
