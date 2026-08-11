import { describe, expect, it } from "vitest";
import { planScrapShopBan } from "./ScrapShopBan";

const repair = { id: "shop-repair", cost: 40 };
const armour = { id: "shop-armour-retrofit", cost: 50 };
const weapon = { id: "shop-weapon:arc-carbine", cost: 60 };

describe("planScrapShopBan", () => {
  it("removes the banned offer, appends the replacement, and clears its lock", () => {
    expect(planScrapShopBan({
      offers: [repair, armour],
      bannedOfferId: repair.id,
      lockedOfferId: repair.id,
      replacement: weapon,
    })).toEqual({ offers: [armour, weapon], lockedOfferId: null });
  });

  it("preserves a different lock when the replacement pool is exhausted", () => {
    expect(planScrapShopBan({
      offers: [repair, armour],
      bannedOfferId: repair.id,
      lockedOfferId: armour.id,
      replacement: null,
    })).toEqual({ offers: [armour], lockedOfferId: armour.id });
  });

  it("can assemble a replacement when the prior rack is absent", () => {
    expect(planScrapShopBan({
      offers: null,
      bannedOfferId: repair.id,
      lockedOfferId: null,
      replacement: weapon,
    })).toEqual({ offers: [weapon], lockedOfferId: null });
  });
});
