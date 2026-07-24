import { describe, expect, it } from "vitest";
import {
  foldItemStats,
  ITEM_CATALOG,
  ITEM_RARITY_BASE_PRICE,
  ITEM_STAT_KEYS,
  itemById,
  type ItemRarity,
} from "./itemCatalog";

const RARITIES: readonly ItemRarity[] = ["common", "uncommon", "rare", "legendary", "cursed"];

describe("item catalog integrity", () => {
  it("has unique ids and a positive price on every entry", () => {
    const ids = ITEM_CATALOG.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of ITEM_CATALOG) {
      expect(entry.basePrice, entry.id).toBeGreaterThan(0);
      expect(RARITIES).toContain(entry.rarity);
      expect(entry.tags.length, entry.id).toBeGreaterThan(0);
    }
  });

  it("only modifies real stat-block keys", () => {
    for (const entry of ITEM_CATALOG) {
      for (const key of Object.keys(entry.statModifiers)) {
        expect(ITEM_STAT_KEYS, `${entry.id} -> ${key}`).toContain(key);
      }
    }
  });

  it("prices climb with rarity (cursed excepted — cheap for their power)", () => {
    expect(ITEM_RARITY_BASE_PRICE.common).toBeLessThan(ITEM_RARITY_BASE_PRICE.uncommon);
    expect(ITEM_RARITY_BASE_PRICE.uncommon).toBeLessThan(ITEM_RARITY_BASE_PRICE.rare);
    expect(ITEM_RARITY_BASE_PRICE.rare).toBeLessThan(ITEM_RARITY_BASE_PRICE.legendary);
    expect(ITEM_RARITY_BASE_PRICE.cursed).toBeLessThan(ITEM_RARITY_BASE_PRICE.legendary);
  });

  it("includes genuine trade-off items (both a positive and a negative stat)", () => {
    const tradeoffs = ITEM_CATALOG.filter((entry) => {
      const values = Object.values(entry.statModifiers);
      return values.some((v) => (v ?? 0) > 0) && values.some((v) => (v ?? 0) < 0);
    });
    expect(tradeoffs.length).toBeGreaterThanOrEqual(8);
  });

  it("covers every offence bucket and both survival directions across the catalogue", () => {
    const touched = new Set<string>();
    for (const entry of ITEM_CATALOG) {
      for (const key of Object.keys(entry.statModifiers)) touched.add(key);
    }
    for (const key of ["damagePercent", "meleeDamagePercent", "rangedDamagePercent", "elementalDamagePercent", "critChancePercent", "maxHpFlat", "armourFlat", "moveSpeedPercent", "attackSpeedPercent", "lifestealPercent", "harvestingPercent"]) {
      expect(touched, key).toContain(key);
    }
  });
});

describe("foldItemStats", () => {
  it("sums modifiers across owned items, stacking duplicates", () => {
    const folded = foldItemStats(["whetstone", "whetstone", "glass-cannon"]);
    // whetstone +8% damage x2, glass-cannon +25% damage / -15 max HP.
    expect(folded.damagePercent).toBe(8 + 8 + 25);
    expect(folded.maxHpFlat).toBe(-15);
  });

  it("ignores unknown ids and returns only touched fields", () => {
    const folded = foldItemStats(["plate-fragment", "not-an-item"]);
    expect(folded).toEqual({ armourFlat: 2 });
  });

  it("returns an empty object for no items", () => {
    expect(foldItemStats([])).toEqual({});
  });

  it("nets opposing modifiers to their signed sum", () => {
    // sniper-scope: +30% ranged / -15% attack speed; adrenaline-pump: +20% attack speed / -8% damage.
    const folded = foldItemStats(["sniper-scope", "adrenaline-pump"]);
    expect(folded.attackSpeedPercent).toBe(-15 + 20);
    expect(folded.rangedDamagePercent).toBe(30);
    expect(folded.damagePercent).toBe(-8);
  });
});

describe("itemById", () => {
  it("looks up by id and returns null for misses", () => {
    expect(itemById("whetstone")?.name).toBe("Whetstone");
    expect(itemById("nope")).toBeNull();
  });
});
