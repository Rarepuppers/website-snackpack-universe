import { describe, expect, it } from "vitest";
import {
  planScrapShopWeaponSale,
  prepareScrapShopSellEntries,
  scrapShopWeaponSaleValue,
  type ScrapShopSaleTile,
} from "./ScrapShopWeaponSale";

const rifle: ScrapShopSaleTile = { instanceId: 7, weaponId: "bastion-service-rifle", tier: 2 };

describe("scrapShopWeaponSaleValue", () => {
  it("scales base weapon value by tier and sale fraction", () => {
    expect(scrapShopWeaponSaleValue(1)).toBe(30);
    expect(scrapShopWeaponSaleValue(2, 0.75)).toBe(90);
    expect(scrapShopWeaponSaleValue(3, 1 / 3)).toBe(80);
  });
});

describe("prepareScrapShopSellEntries", () => {
  it("prepares rack entries before stash entries with catalogue names and sale values", () => {
    const blade: ScrapShopSaleTile = { instanceId: 8, weaponId: "patrol-blade", tier: 1 };
    expect(prepareScrapShopSellEntries({
      rack: [{ tile: rifle }],
      stash: [null, blade],
      equippedInstanceIds: [7, 3],
      saleFraction: 0.75,
    })).toEqual([
      expect.objectContaining({ instanceId: 7, tier: 2, saleValue: 90, canSell: true }),
      expect.objectContaining({ instanceId: 8, tier: 1, saleValue: 45, canSell: true }),
    ]);
  });

  it("disables only the final active weapon and does not mutate inventory inputs", () => {
    const rack = [{ tile: rifle }];
    expect(prepareScrapShopSellEntries({ rack, stash: [], equippedInstanceIds: [7] })[0]).toMatchObject({
      instanceId: 7,
      canSell: false,
    });
    expect(rack[0]!.tile).toBe(rifle);
  });
});

describe("planScrapShopWeaponSale", () => {
  it("locates rack, stash, and active indices and computes the sale", () => {
    expect(planScrapShopWeaponSale({
      instanceId: 7,
      rack: [{ tile: rifle }],
      stash: [null, rifle],
      equippedInstanceIds: [3, 7],
      saleFraction: 0.75,
    })).toEqual({
      ok: true,
      tile: rifle,
      rackIndex: 0,
      stashIndex: 1,
      activeIndex: 1,
      amount: 90,
    });
  });

  it("rejects a missing weapon", () => {
    expect(planScrapShopWeaponSale({
      instanceId: 99,
      rack: [{ tile: rifle }],
      stash: [],
      equippedInstanceIds: [7],
    })).toEqual({ ok: false, reason: "missing-weapon" });
  });

  it("rejects selling the final active weapon but permits an inactive one", () => {
    expect(planScrapShopWeaponSale({
      instanceId: 7,
      rack: [{ tile: rifle }],
      stash: [],
      equippedInstanceIds: [7],
    })).toEqual({ ok: false, reason: "last-active-weapon" });
    expect(planScrapShopWeaponSale({
      instanceId: 7,
      rack: [{ tile: rifle }],
      stash: [],
      equippedInstanceIds: [3],
    })).toMatchObject({ ok: true, activeIndex: -1 });
  });
});
