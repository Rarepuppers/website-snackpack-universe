import { describe, expect, it } from "vitest";
import { classifyScrapShopPurchase, planScrapShopPurchase } from "./ScrapShopPurchase";

describe("planScrapShopPurchase", () => {
  it("normalizes free and negative costs and plans the remaining balance", () => {
    expect(planScrapShopPurchase({
      optionId: "shop-repair",
      declaredCost: -4,
      securedScrap: 12,
      lockedOfferId: null,
    })).toEqual({
      ok: true,
      optionId: "shop-repair",
      cost: 0,
      remainingScrap: 12,
      clearLockedOffer: false,
      effect: { kind: "repair" },
    });
  });

  it("rejects insufficient Scrap without preparing a transaction", () => {
    expect(planScrapShopPurchase({
      optionId: "shop-weapon:service-rifle",
      declaredCost: 60,
      securedScrap: 59,
      lockedOfferId: null,
    })).toEqual({ ok: false });
  });

  it("marks a purchased locked offer for clearing", () => {
    const plan = planScrapShopPurchase({
      optionId: "shop-item:field-kit",
      declaredCost: 7,
      securedScrap: 20,
      lockedOfferId: "shop-item:field-kit",
    });
    expect(plan).toMatchObject({ ok: true, remainingScrap: 13, clearLockedOffer: true });
  });
});

describe("classifyScrapShopPurchase", () => {
  it("classifies fixed and prefixed effects while retaining unknown purchases", () => {
    expect(classifyScrapShopPurchase("shop-uranium-kit")).toEqual({ kind: "uranium-kit" });
    expect(classifyScrapShopPurchase("shop-armour-retrofit")).toEqual({ kind: "armour-retrofit" });
    expect(classifyScrapShopPurchase("shop-upgrade:reload")).toEqual({ kind: "upgrade", upgradeId: "reload" });
    expect(classifyScrapShopPurchase("shop-weapon:arc-carbine")).toEqual({ kind: "weapon", weaponId: "arc-carbine" });
    expect(classifyScrapShopPurchase("shop-item:field-kit")).toEqual({ kind: "item", itemId: "field-kit" });
    expect(classifyScrapShopPurchase("shop-unknown")).toEqual({ kind: "none" });
  });
});
