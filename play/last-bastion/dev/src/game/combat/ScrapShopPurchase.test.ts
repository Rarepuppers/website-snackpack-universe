import { describe, expect, it } from "vitest";
import {
  classifyScrapShopPurchase,
  planScrapShopPurchase,
  validateScrapShopPurchaseEffect,
} from "./ScrapShopPurchase";

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

describe("validateScrapShopPurchaseEffect", () => {
  it("accepts known eligible upgrades and rejects unknown or ineligible upgrades", () => {
    expect(validateScrapShopPurchaseEffect(
      { kind: "upgrade", upgradeId: "rapid-cycling" },
      () => true,
    )).toEqual({ kind: "upgrade", upgradeId: "rapid-cycling" });
    expect(validateScrapShopPurchaseEffect(
      { kind: "upgrade", upgradeId: "missing" },
      () => true,
    )).toEqual({ kind: "none" });
    expect(validateScrapShopPurchaseEffect(
      { kind: "upgrade", upgradeId: "rapid-cycling" },
      () => false,
    )).toEqual({ kind: "none" });
  });

  it("validates weapon and item catalogue membership", () => {
    expect(validateScrapShopPurchaseEffect(
      { kind: "weapon", weaponId: "arc-carbine" },
      () => false,
    )).toEqual({ kind: "weapon", weaponId: "arc-carbine" });
    expect(validateScrapShopPurchaseEffect(
      { kind: "weapon", weaponId: "missing" },
      () => false,
    )).toEqual({ kind: "none" });
    expect(validateScrapShopPurchaseEffect(
      { kind: "item", itemId: "glass-cannon" },
      () => false,
    )).toEqual({ kind: "item", itemId: "glass-cannon" });
    expect(validateScrapShopPurchaseEffect(
      { kind: "item", itemId: "missing" },
      () => false,
    )).toEqual({ kind: "none" });
  });

  it("passes fixed and none effects through without consulting upgrade eligibility", () => {
    const eligibility = () => { throw new Error("must not be called"); };
    expect(validateScrapShopPurchaseEffect({ kind: "repair" }, eligibility)).toEqual({ kind: "repair" });
    expect(validateScrapShopPurchaseEffect({ kind: "none" }, eligibility)).toEqual({ kind: "none" });
  });
});
