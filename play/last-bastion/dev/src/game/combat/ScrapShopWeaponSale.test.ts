import { describe, expect, it } from "vitest";
import {
  planScrapShopWeaponSale,
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
