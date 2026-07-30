import type { ItemDefinition, ItemRarity, ItemTag } from "./itemCatalog";

/**
 * Themed shop stock (Brotato overhaul Phase 4 — see
 * `last-bastion-shop-economy-plan.md`).
 *
 * Phase 3B put an ordinary scrap shop after *every* cleared node, so a special
 * shop can no longer be special just by existing. What makes a liberation shop
 * worth the fight is the **quality and focus** of its stock: a rarity floor, a
 * tag filter, and a price multiplier. That makes every themed shop a data row
 * rather than a new system — `buildScrapShopCandidates` reads the profile and
 * filters, and nothing else in the shop changes.
 */
export type ShopProfileId =
  | "scrap-market"
  | "blacksmith"
  | "science-lab"
  | "bio-lab"
  | "church"
  | "black-market"
  | "special-merchant";

export interface ShopProfile {
  id: ShopProfileId;
  /** Shown on the map node and in the shop title. */
  name: string;
  /** Which stock lines this shop carries at all. */
  stock: {
    /** Field repair. Also the campaign's guaranteed heal, so most shops keep it. */
    repair: boolean;
    /** Uranium kit + armour retrofit. */
    utility: boolean;
    upgrades: boolean;
    weapons: boolean;
    items: boolean;
  };
  /** When set, only items carrying at least one of these tags are stocked. */
  itemTags?: readonly ItemTag[];
  /** When set, only items at or above this rarity are stocked. */
  minRarity?: ItemRarity;
  /** Multiplier on every price — premium stock costs more, the black market less. */
  priceMultiplier: number;
}

/**
 * Rarity ordering for the `minRarity` floor. `cursed` ranks with `rare` rather
 * than at the bottom: it is deliberately cheap *for its power*, not weak.
 */
const RARITY_RANK: Readonly<Record<ItemRarity, number>> = Object.freeze({
  common: 0,
  uncommon: 1,
  rare: 2,
  cursed: 2,
  legendary: 3,
});

const profile = (
  id: ShopProfileId,
  name: string,
  stock: ShopProfile["stock"],
  priceMultiplier: number,
  extras: Pick<Partial<ShopProfile>, "itemTags" | "minRarity"> = {},
): ShopProfile => Object.freeze({ id, name, stock, priceMultiplier, ...extras });

const ALL_STOCK = Object.freeze({
  repair: true, utility: true, upgrades: true, weapons: true, items: true,
});

export const SHOP_PROFILES: Readonly<Record<ShopProfileId, ShopProfile>> = Object.freeze({
  /** The default post-node shop: everything, unfiltered, at list price. */
  "scrap-market": profile("scrap-market", "Scrap Shop", ALL_STOCK, 1),

  /** Weapons and the merge/tier game. No items beyond raw offence. */
  blacksmith: profile("blacksmith", "Blacksmith", {
    repair: true, utility: true, upgrades: false, weapons: true, items: true,
  }, 1, { itemTags: ["offence", "melee", "ranged", "crit"] }),

  /** Upgrades and augments — the Cyborg-affinity bench. */
  "science-lab": profile("science-lab", "Science Lab", {
    repair: true, utility: true, upgrades: true, weapons: false, items: true,
  }, 1.1, { itemTags: ["crit", "elemental", "economy"] }),

  /** Mutations and organic grafts: survivability bought with risk. */
  "bio-lab": profile("bio-lab", "Bio Lab", {
    repair: true, utility: false, upgrades: false, weapons: false, items: true,
  }, 1, { itemTags: ["sustain", "defence", "mobility", "risk"] }),

  /** Doctrine and faith: the curse-for-blessing trade, nothing mundane. */
  church: profile("church", "Church of the Designed Arrival", {
    repair: true, utility: false, upgrades: false, weapons: false, items: true,
  }, 0.9, { itemTags: ["risk"], minRarity: "rare" }),

  /** Cheap, potent, and not asking where any of it came from. */
  "black-market": profile("black-market", "Black Market", {
    repair: false, utility: true, upgrades: false, weapons: true, items: true,
  }, 0.75, { minRarity: "rare" }),

  /** Curated high-end stock at a premium. */
  "special-merchant": profile("special-merchant", "Special Merchant", {
    repair: true, utility: true, upgrades: false, weapons: false, items: true,
  }, 1.25, { minRarity: "rare" }),
});

/** Profiles a liberation node can roll. The plain scrap market is not among them. */
export const LIBERATION_SHOP_PROFILES: readonly ShopProfileId[] = Object.freeze([
  "blacksmith", "science-lab", "bio-lab", "church", "black-market", "special-merchant",
]);

export const DEFAULT_SHOP_PROFILE_ID: ShopProfileId = "scrap-market";

export function shopProfileById(id: string | null | undefined): ShopProfile {
  return SHOP_PROFILES[id as ShopProfileId] ?? SHOP_PROFILES[DEFAULT_SHOP_PROFILE_ID];
}

export function isShopProfileId(value: unknown): value is ShopProfileId {
  return typeof value === "string" && value in SHOP_PROFILES;
}

/** Deterministic profile for a liberation node, so a seed always yields the same chart. */
export function liberationProfileForSeed(seed: number): ShopProfileId {
  const index = Math.abs(Math.floor(seed)) % LIBERATION_SHOP_PROFILES.length;
  return LIBERATION_SHOP_PROFILES[index]!;
}

/**
 * Relative appearance rate by rarity. Before this existed, rarity affected
 * *price only* — every item in the catalogue was drawn uniformly, so a legendary
 * was exactly as likely to appear as a common. These are the base odds `luck`
 * and `curse` then bend.
 */
const RARITY_DRAW_WEIGHT: Readonly<Record<ItemRarity, number>> = Object.freeze({
  common: 100,
  uncommon: 55,
  rare: 24,
  legendary: 8,
  cursed: 14,
});

/**
 * Weight for non-item stock (field repair, kits, upgrades, weapons). Sits
 * mid-table so weighting the items does not crowd the rest of the shop out.
 */
export const NON_ITEM_DRAW_WEIGHT = 45;

/**
 * How likely this rarity is to appear, bent by the two reserved stats.
 *
 * `luck` lifts the rarer tiers hardest (it is applied per rarity rank, so it
 * barely moves commons and strongly moves legendaries). `curse` is the
 * trade-off knob and cuts both ways: it drags the good tiers down *and* makes
 * cursed stock — deliberately cheap for its power — far more likely.
 */
export function rarityDrawWeight(rarity: ItemRarity, luck = 0, curse = 0): number {
  const base = RARITY_DRAW_WEIGHT[rarity];
  if (rarity === "cursed") {
    return Math.max(1, base * Math.max(0.1, 1 + curse / 100));
  }
  const bend = Math.max(0.1, 1 + (luck - curse) / 100);
  return Math.max(1, base * bend ** RARITY_RANK[rarity]);
}

/** True when this shop stocks the item at all (tag filter + rarity floor). */
export function profileStocksItem(profile: ShopProfile, definition: ItemDefinition): boolean {
  if (!profile.stock.items) return false;
  if (profile.minRarity && RARITY_RANK[definition.rarity] < RARITY_RANK[profile.minRarity]) {
    return false;
  }
  if (profile.itemTags && !definition.tags.some((tag) => profile.itemTags!.includes(tag))) {
    return false;
  }
  return true;
}
