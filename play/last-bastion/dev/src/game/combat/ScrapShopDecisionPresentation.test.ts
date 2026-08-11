import { describe, expect, it } from "vitest";
import {
  presentScrapShopManagementDecision,
  presentScrapShopOffersDecision,
  presentScrapShopSellDecision,
} from "./ScrapShopDecisionPresentation";

const offers = [
  { id: "a", name: "Alpha", description: "A", cost: 10, affordable: true },
  { id: "b", name: "Beta", description: "B", cost: 20, affordable: false },
];

describe("ScrapShopDecisionPresentation", () => {
  it("presents offers with a lock marker followed by manage and leave actions", () => {
    const decision = presentScrapShopOffersDecision({
      offers,
      profileName: "Scrap Shop",
      securedScrap: 15,
      lockedOfferId: "b",
      rerollUsed: false,
      rerollCost: 10,
    });
    expect(decision.title).toBe("SCRAP SHOP — 15 SCRAP");
    expect(decision.shopMode).toBe("offers");
    expect(decision.options.map((option) => [option.id, option.name])).toEqual([
      ["a", "Alpha"],
      ["b", "Beta [LOCKED]"],
      ["shop-manage", "Manage Stock"],
      ["shop-leave", "Leave Shop"],
    ]);
    expect(decision.options[1]).not.toBe(offers[1]);
  });

  it("presents management locks, reroll, bans, sell, and back in authored order", () => {
    const decision = presentScrapShopManagementDecision({
      offers,
      securedScrap: 15,
      lockedOfferId: "a",
      rerollUsed: false,
      rerollCost: 15,
      canReroll: true,
    });
    expect(decision.shopMode).toBe("manage");
    expect(decision.options.map((option) => option.id)).toEqual([
      "shop-lock:a", "shop-lock:b", "shop-reroll",
      "shop-ban:a", "shop-ban:b", "shop-sell-menu", "shop-back",
    ]);
    expect(decision.options[0]?.name).toBe("Unlock Offer 1");
    expect(decision.options[2]).toMatchObject({ affordable: true, cost: 15 });
  });

  it("explains unavailable and already-used management rerolls", () => {
    const unavailable = presentScrapShopManagementDecision({
      offers, securedScrap: 100, lockedOfferId: null,
      rerollUsed: false, rerollCost: 15, canReroll: false,
    });
    expect(unavailable.options[2]).toMatchObject({
      description: "No complete replacement rack is available.",
      affordable: false,
    });
    const used = presentScrapShopManagementDecision({
      offers, securedScrap: 100, lockedOfferId: null,
      rerollUsed: true, rerollCost: 15, canReroll: true,
    });
    expect(used.options[2]).toMatchObject({ name: "Reroll Used", affordable: false });
  });

  it("presents sell eligibility and keeps the back action last", () => {
    const decision = presentScrapShopSellDecision({
      entries: [
        { instanceId: 7, displayName: "Rifle", tier: 2, saleValue: 60, canSell: true },
        { instanceId: 8, displayName: "Blade", tier: 1, saleValue: 30, canSell: false },
      ],
      securedScrap: 40,
      lockedOfferId: "a",
      rerollUsed: true,
      rerollCost: 20,
    });
    expect(decision.title).toBe("SELL WEAPON — 40 SCRAP");
    expect(decision.options).toEqual([
      expect.objectContaining({ id: "shop-sell:7", name: "Rifle — Tier 2", description: "Sell for 60 Scrap.", affordable: true }),
      expect.objectContaining({ id: "shop-sell:8", description: "Keep at least one active weapon.", affordable: false }),
      expect.objectContaining({ id: "shop-back" }),
    ]);
  });
});
