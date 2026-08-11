import { describe, expect, it } from "vitest";
import {
  assembleLockedScrapShopReroll,
  canPlanScrapShopReroll,
  planPaidScrapShopReroll,
  scrapShopRerollExcludedIds,
} from "./ScrapShopReroll";

describe("ScrapShopReroll", () => {
  it("plans a paid reroll or rejects it in historical validation order", () => {
    expect(planPaidScrapShopReroll({ rerollUsed: true, cost: 30, securedScrap: 0 })).toEqual({
      ok: false,
      reason: "already-used",
    });
    expect(planPaidScrapShopReroll({ rerollUsed: false, cost: 30, securedScrap: 29 })).toEqual({
      ok: false,
      reason: "insufficient-scrap",
    });
    expect(planPaidScrapShopReroll({ rerollUsed: false, cost: 30, securedScrap: 45 })).toEqual({
      ok: true,
      cost: 30,
      remainingScrap: 15,
    });
  });

  it("excludes every current rack ID and checks unlocked replacement capacity", () => {
    const offers = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    expect([...scrapShopRerollExcludedIds(offers)]).toEqual(["a", "b", "c", "d"]);
    expect(canPlanScrapShopReroll({
      offers,
      candidates: [{ id: "a" }, { id: "e" }, { id: "f" }, { id: "g" }],
      lockedOfferId: "a",
    })).toBe(true);
    expect(canPlanScrapShopReroll({
      offers,
      candidates: [{ id: "e" }, { id: "f" }],
      lockedOfferId: "a",
    })).toBe(false);
  });

  it("preserves the declared-lock slot count even if that ID is stale", () => {
    expect(canPlanScrapShopReroll({
      offers: [{ id: "a" }, { id: "b" }],
      candidates: [{ id: "c" }],
      lockedOfferId: "missing",
    })).toBe(true);
    expect(canPlanScrapShopReroll({ offers: null, candidates: [{ id: "c" }], lockedOfferId: null })).toBe(false);
  });

  it("keeps an actual lock first and slices a full replacement draw to remaining slots", () => {
    const locked = { id: "b" };
    const replacements = [{ id: "e" }, { id: "f" }, { id: "g" }, { id: "h" }];
    expect(assembleLockedScrapShopReroll({
      offers: [{ id: "a" }, locked, { id: "c" }, { id: "d" }],
      lockedOfferId: "b",
      drawnReplacements: replacements,
      offerCount: 4,
    })).toEqual([locked, replacements[0], replacements[1], replacements[2]]);
  });
});
