import { NO_PLAYER_STATS, type PlayerStatBlock } from "../stats/PlayerStatBlock";

/**
 * Shop items (Brotato overhaul — see `last-bastion-shop-economy-plan.md`). An
 * item is a bundle of stat modifiers with a rarity and a price; the entire
 * economy of positive-and-negative trade-offs is expressed as data here, and
 * combat needs no per-item wiring because every modifier lands in the unified
 * `PlayerStatBlock` (Phase 1). Behavioural (non-stat) items reuse the relic hook
 * shape and are added later; this catalogue is stat items only.
 *
 * `statModifiers` values follow the block's conventions: `*Percent` fields are
 * additive percentages, flats are additive, and `critMultiplier` is an additive
 * bonus on the 1.5 crit baseline (so `0.3` means +30% crit damage).
 */
export type ItemRarity = "common" | "uncommon" | "rare" | "legendary" | "cursed";

export type ItemTag =
  | "offence" | "melee" | "ranged" | "elemental" | "crit"
  | "defence" | "sustain" | "mobility" | "economy" | "risk";

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  /** Base scrap cost before any wave/shop scaling. */
  basePrice: number;
  tags: readonly ItemTag[];
  statModifiers: Partial<PlayerStatBlock>;
}

/** Default price floor per rarity; individual items may override via `basePrice`. */
export const ITEM_RARITY_BASE_PRICE: Readonly<Record<ItemRarity, number>> = Object.freeze({
  common: 15,
  uncommon: 30,
  rare: 55,
  legendary: 90,
  // Cursed items are cheap for their power — the trap. Their downside is the cost.
  cursed: 40,
});

const item = (
  id: string,
  name: string,
  rarity: ItemRarity,
  tags: readonly ItemTag[],
  statModifiers: Partial<PlayerStatBlock>,
  description: string,
  basePrice = ITEM_RARITY_BASE_PRICE[rarity],
): ItemDefinition => Object.freeze({ id, name, rarity, tags, statModifiers: Object.freeze(statModifiers), description, basePrice });

export const ITEM_CATALOG: readonly ItemDefinition[] = Object.freeze([
  // --- Common, pure-positive (small bumps, cheap) ---
  item("whetstone", "Whetstone", "common", ["offence"], { damagePercent: 8 }, "+8% damage."),
  item("targeting-chip", "Targeting Chip", "common", ["offence", "crit"], { critChancePercent: 6 }, "+6% crit chance."),
  item("ration-pack", "Ration Pack", "common", ["defence", "sustain"], { maxHpFlat: 8 }, "+8 max HP."),
  item("plate-fragment", "Plate Fragment", "common", ["defence"], { armourFlat: 2 }, "+2 armour."),
  item("combat-stims", "Combat Stims", "common", ["offence"], { attackSpeedPercent: 8 }, "+8% attack speed."),
  item("track-shoes", "Track Shoes", "common", ["mobility"], { moveSpeedPercent: 10 }, "+10% move speed."),
  item("scrap-magnet", "Scrap Magnet", "common", ["economy"], { harvestingPercent: 15 }, "+15% scrap gained."),
  item("field-dressing", "Field Dressing", "common", ["sustain"], { hpRegenPerSecond: 0.4 }, "+0.4 HP regen per second."),

  // --- Uncommon, focused or mild trade-off ---
  item("bayonet", "Bayonet", "uncommon", ["offence", "melee"], { meleeDamagePercent: 20 }, "+20% melee damage."),
  item("scope-mount", "Scope Mount", "uncommon", ["offence", "ranged"], { rangedDamagePercent: 20 }, "+20% ranged damage."),
  item("thermal-core", "Thermal Core", "uncommon", ["offence", "elemental"], { elementalDamagePercent: 22 }, "+22% elemental damage."),
  item("evasion-servos", "Evasion Servos", "uncommon", ["defence", "mobility"], { dodgePercent: 8 }, "+8% dodge."),
  item("leech-rounds", "Leech Rounds", "uncommon", ["sustain"], { lifestealPercent: 5 }, "+5% lifesteal."),
  item("weighted-boots", "Weighted Boots", "uncommon", ["defence", "risk"], { armourFlat: 3, moveSpeedPercent: -8 }, "+3 armour, -8% move speed."),
  item("adrenaline-pump", "Adrenaline Pump", "uncommon", ["offence", "risk"], { attackSpeedPercent: 20, damagePercent: -8 }, "+20% attack speed, -8% damage."),

  // --- Rare, sharper trade-offs and multi-stat ---
  item("glass-cannon", "Glass Cannon", "rare", ["offence", "risk"], { damagePercent: 25, maxHpFlat: -15 }, "+25% damage, -15 max HP."),
  item("sniper-scope", "Sniper Scope", "rare", ["offence", "ranged", "risk"], { rangedDamagePercent: 30, attackSpeedPercent: -15 }, "+30% ranged damage, -15% attack speed."),
  item("berserkers-brand", "Berserker's Brand", "rare", ["offence", "melee", "risk"], { meleeDamagePercent: 25, rangedDamagePercent: -12 }, "+25% melee damage, -12% ranged damage."),
  item("focusing-lens", "Focusing Lens", "rare", ["crit"], { critChancePercent: 12, critMultiplier: 0.3 }, "+12% crit chance, +30% crit damage."),
  item("featherweight-frame", "Featherweight Frame", "rare", ["mobility", "risk"], { moveSpeedPercent: 18, armourFlat: -3 }, "+18% move speed, -3 armour."),
  item("bulwark-plating", "Bulwark Plating", "rare", ["defence", "risk"], { armourFlat: 6, attackSpeedPercent: -18 }, "+6 armour, -18% attack speed."),

  // --- Legendary, powerful multi-stat ---
  item("titan-serum", "Titan Serum", "legendary", ["defence", "sustain", "risk"], { maxHpFlat: 25, armourFlat: 3, attackSpeedPercent: -15 }, "+25 max HP, +3 armour, -15% attack speed."),
  item("bloodthirster", "Bloodthirster", "legendary", ["offence", "melee", "sustain", "risk"], { lifestealPercent: 12, meleeDamagePercent: 15, maxHpFlat: -12 }, "+12% lifesteal, +15% melee damage, -12 max HP."),
  item("overclock-module", "Overclock Module", "legendary", ["offence", "risk"], { attackSpeedPercent: 30, maxHpPercent: -20 }, "+30% attack speed, -20% max HP."),

  // --- Cursed, huge power, harsh downside ---
  item("cursed-idol", "Cursed Idol", "cursed", ["offence", "risk"], { damagePercent: 40, maxHpFlat: -25, armourFlat: -2 }, "+40% damage, -25 max HP, -2 armour."),
  item("blood-pact", "Blood Pact", "cursed", ["offence", "sustain", "risk"], { lifestealPercent: 15, damagePercent: 20, maxHpPercent: -30 }, "+15% lifesteal, +20% damage, -30% max HP."),
]);

export const ITEM_IDS: readonly string[] = Object.freeze(ITEM_CATALOG.map((entry) => entry.id));

export function itemById(id: string): ItemDefinition | null {
  return ITEM_CATALOG.find((entry) => entry.id === id) ?? null;
}

export function isItemId(value: unknown): value is string {
  return typeof value === "string" && ITEM_CATALOG.some((entry) => entry.id === value);
}

/**
 * Folds a list of owned item ids into one accumulated `Partial<PlayerStatBlock>`
 * — the shape carried on the run build as `itemStats`. Duplicate ids stack (you
 * can own two of an item), unknown ids are ignored, and only fields an item
 * actually touches appear in the result.
 */
export function foldItemStats(ownedItemIds: readonly string[]): Partial<PlayerStatBlock> {
  const totals: Partial<PlayerStatBlock> = {};
  for (const id of ownedItemIds) {
    const definition = itemById(id);
    if (!definition) continue;
    for (const key of Object.keys(definition.statModifiers) as (keyof PlayerStatBlock)[]) {
      const value = definition.statModifiers[key];
      if (typeof value !== "number") continue;
      totals[key] = (totals[key] ?? 0) + value;
    }
  }
  return totals;
}

/** Every stat key an item may modify — the keys of the resolved stat block. */
export const ITEM_STAT_KEYS: readonly (keyof PlayerStatBlock)[] = Object.freeze(
  Object.keys(NO_PLAYER_STATS) as (keyof PlayerStatBlock)[],
);
