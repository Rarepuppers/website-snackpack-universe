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
  // Range axis, opened 26 July 2026. `rangePercent` had zero read sites and no
  // granting item, so weapon reach was a stat the game claimed and never varied.
  // Sawn-Off is the deliberate inverse: the close-quarters and scattergun enabler.
  item("long-barrel", "Long Barrel", "uncommon", ["offence", "ranged"], { rangePercent: 20, attackSpeedPercent: -8 }, "+20% weapon range, -8% attack speed."),
  item("sawn-off-stock", "Sawn-Off Stock", "uncommon", ["offence", "risk"], { rangePercent: -25, damagePercent: 25 }, "-25% weapon range, +25% damage."),
  // Luck axis, opened 31 July 2026. `rarityDrawWeight` bends shop odds by
  // `(luck - curse)`, but only the curse half had a granting item — so the
  // upside of the whole mechanic was unreachable in a real run.
  item("lucky-token", "Lucky Token", "uncommon", ["economy"], { luck: 15 }, "+15 luck. Better shop stock."),
  item("prospectors-kit", "Prospector's Kit", "uncommon", ["economy"], { harvestingPercent: 20, luck: 8 }, "+20% scrap gained, +8 luck."),
  item("coolant-sheath", "Coolant Sheath", "uncommon", ["defence", "elemental"], { armourFlat: 3, elementalDamagePercent: 12 }, "+3 armour, +12% elemental damage."),

  // --- Rare, sharper trade-offs and multi-stat ---
  item("glass-cannon", "Glass Cannon", "rare", ["offence", "risk"], { damagePercent: 25, maxHpFlat: -15 }, "+25% damage, -15 max HP."),
  item("sniper-scope", "Sniper Scope", "rare", ["offence", "ranged", "risk"], { rangedDamagePercent: 30, attackSpeedPercent: -15 }, "+30% ranged damage, -15% attack speed."),
  item("berserkers-brand", "Berserker's Brand", "rare", ["offence", "melee", "risk"], { meleeDamagePercent: 25, rangedDamagePercent: -12 }, "+25% melee damage, -12% ranged damage."),
  item("focusing-lens", "Focusing Lens", "rare", ["crit"], { critChancePercent: 12, critMultiplier: 0.3 }, "+12% crit chance, +30% crit damage."),
  item("reflex-sight", "Reflex Sight", "rare", ["offence", "ranged", "crit"], { rangePercent: 12, critChancePercent: 6 }, "+12% weapon range, +6% crit chance."),
  item("featherweight-frame", "Featherweight Frame", "rare", ["mobility", "risk"], { moveSpeedPercent: 18, armourFlat: -3 }, "+18% move speed, -3 armour."),
  item("bulwark-plating", "Bulwark Plating", "rare", ["defence", "risk"], { armourFlat: 6, attackSpeedPercent: -18 }, "+6 armour, -18% attack speed."),
  item("loaded-dice", "Loaded Dice", "rare", ["economy", "risk"], { luck: 30, damagePercent: -10 }, "+30 luck, -10% damage."),
  item("reactive-weave", "Reactive Weave", "rare", ["defence", "mobility"], { dodgePercent: 12, moveSpeedPercent: 8 }, "+12% dodge, +8% move speed."),
  item("vital-lattice", "Vital Lattice", "rare", ["sustain", "risk"], { hpRegenPerSecond: 1.2, damagePercent: -10 }, "+1.2 HP regen per second, -10% damage."),

  // --- Legendary, powerful multi-stat ---
  item("titan-serum", "Titan Serum", "legendary", ["defence", "sustain", "risk"], { maxHpFlat: 25, armourFlat: 3, attackSpeedPercent: -15 }, "+25 max HP, +3 armour, -15% attack speed."),
  item("bloodthirster", "Bloodthirster", "legendary", ["offence", "melee", "sustain", "risk"], { lifestealPercent: 12, meleeDamagePercent: 15, maxHpFlat: -12 }, "+12% lifesteal, +15% melee damage, -12 max HP."),
  item("overclock-module", "Overclock Module", "legendary", ["offence", "risk"], { attackSpeedPercent: 30, maxHpPercent: -20 }, "+30% attack speed, -20% max HP."),
  item("fortunes-ledger", "Fortune's Ledger", "legendary", ["economy"], { luck: 40, harvestingPercent: 25 }, "+40 luck, +25% scrap gained."),
  item("executioners-loadout", "Executioner's Loadout", "legendary", ["offence", "crit", "risk"], { critChancePercent: 18, critMultiplier: 0.6, maxHpFlat: -20 }, "+18% crit chance, +60% crit damage, -20 max HP."),

  // --- Cursed, huge power, harsh downside ---
  // These are the only source of the `curse` stat, which drags future shop stock
  // toward worse rarities (and cursed stock toward better odds). Without it the
  // whole curse half of the rarity weighting is unreachable in a real run.
  item("cursed-idol", "Cursed Idol", "cursed", ["offence", "risk"], { damagePercent: 40, maxHpFlat: -25, armourFlat: -2, curse: 20 }, "+40% damage, -25 max HP, -2 armour, +20 curse."),
  item("blood-pact", "Blood Pact", "cursed", ["offence", "sustain", "risk"], { lifestealPercent: 15, damagePercent: 20, maxHpPercent: -30, curse: 15 }, "+15% lifesteal, +20% damage, -30% max HP, +15 curse."),
  item("martyrs-chain", "Martyr's Chain", "cursed", ["sustain", "risk"], { lifestealPercent: 20, maxHpPercent: -40, curse: 25 }, "+20% lifesteal, -40% max HP, +25 curse."),
  // The only item that writes both sides of the shop-odds equation. Net -5 is
  // deliberate: it buys raw damage at the price of a slightly souring shop.
  item("hollow-reliquary", "Hollow Reliquary", "cursed", ["offence", "economy", "risk"], { damagePercent: 35, luck: 25, armourFlat: -4, curse: 30 }, "+35% damage, +25 luck, -4 armour, +30 curse."),
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
