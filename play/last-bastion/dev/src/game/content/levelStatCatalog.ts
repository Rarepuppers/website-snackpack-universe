import { formatStat } from "../stats/formatStat";
import type { PlayerStatBlock } from "../stats/PlayerStatBlock";

/**
 * Brotato-style level-up stat cards (overhaul Phase 3C — see
 * `last-bastion-shop-economy-plan.md`).
 *
 * Every card is a small permanent bump to one field of the unified
 * `PlayerStatBlock`, which is the whole point: the shop, items, and level-ups
 * now speak one stat language, so "+6% crit chance" means the same thing
 * wherever the player reads it.
 *
 * These deliberately do **not** replace the twelve authored upgrades in
 * `upgradeCatalog.ts` — those change how weapons behave (pierce, chain, twin
 * shot) and have no stat-vector equivalent. Level-ups alternate between the two.
 */
export interface LevelStatCard {
  id: string;
  name: string;
  /** The single block field this card grants. */
  statKey: keyof PlayerStatBlock;
  /** Additive grant, in the field's own units (percent for `*Percent`, points for flat). */
  amount: number;
  /** How the value reads to the player — decides the `%` suffix and the card copy. */
  unit: "percent" | "flat";
  /** Grouping label shown on the card, mirroring the item catalogue's tags. */
  category: "offence" | "defence" | "utility";
}

const card = (
  id: string,
  name: string,
  statKey: keyof PlayerStatBlock,
  amount: number,
  unit: LevelStatCard["unit"],
  category: LevelStatCard["category"],
): LevelStatCard => Object.freeze({ id, name, statKey, amount, unit, category });

export const LEVEL_STAT_CARDS: readonly LevelStatCard[] = Object.freeze([
  // --- Offence ---
  card("lvl-damage", "Weapon Calibration", "damagePercent", 5, "percent", "offence"),
  card("lvl-crit-chance", "Targeting Instinct", "critChancePercent", 4, "percent", "offence"),
  card("lvl-ranged", "Marksmanship", "rangedDamagePercent", 7, "percent", "offence"),
  card("lvl-melee", "Close Quarters", "meleeDamagePercent", 7, "percent", "offence"),
  card("lvl-elemental", "Reactive Payload", "elementalDamagePercent", 8, "percent", "offence"),
  card("lvl-attack-speed", "Cycling Drill", "attackSpeedPercent", 5, "percent", "offence"),

  // --- Defence ---
  card("lvl-max-hp", "Constitution", "maxHpFlat", 5, "flat", "defence"),
  card("lvl-armour", "Plating Grafts", "armourFlat", 1, "flat", "defence"),
  card("lvl-dodge", "Evasive Footwork", "dodgePercent", 3, "percent", "defence"),
  card("lvl-regen", "Field Metabolism", "hpRegenPerSecond", 0.2, "flat", "defence"),
  card("lvl-lifesteal", "Siphon Rounds", "lifestealPercent", 3, "percent", "defence"),

  // --- Utility ---
  card("lvl-move-speed", "Servo Tuning", "moveSpeedPercent", 5, "percent", "utility"),
  card("lvl-harvesting", "Salvage Training", "harvestingPercent", 10, "percent", "utility"),
  card("lvl-luck", "Scavenger's Eye", "luck", 5, "flat", "utility"),
  // Authored but deliberately NOT offered — see LEVEL_STAT_ORDER below.
  card("lvl-engineering", "Field Engineering", "engineering", 5, "flat", "utility"),
]);

/**
 * The scan order level-ups walk. Interleaved across categories so consecutive
 * levels never offer three cards from the same group — the same trick
 * `UPGRADE_ORDER` uses.
 *
 * **Every id here must grant a stat something actually reads.** `lvl-engineering`
 * is excluded for exactly that reason: `engineering` has no consumer in combat
 * (the only structures in the game are Assembly Prime's enemy-side drones), so
 * offering it let a player spend a level-up on nothing. Its definition stays
 * above so re-enabling it is a one-line change once an engineering item exists.
 */
export const LEVEL_STAT_ORDER: readonly string[] = Object.freeze([
  "lvl-damage", "lvl-max-hp", "lvl-move-speed",
  "lvl-crit-chance", "lvl-armour", "lvl-harvesting",
  "lvl-ranged", "lvl-dodge", "lvl-luck",
  "lvl-melee", "lvl-regen", "lvl-attack-speed",
  "lvl-elemental", "lvl-lifesteal",
]);

const CARD_BY_ID: ReadonlyMap<string, LevelStatCard> = new Map(
  LEVEL_STAT_CARDS.map((entry) => [entry.id, entry]),
);

export function levelStatCardById(id: string): LevelStatCard | null {
  return CARD_BY_ID.get(id) ?? null;
}

export function isLevelStatCardId(value: unknown): value is string {
  return typeof value === "string" && CARD_BY_ID.has(value);
}

/**
 * Card copy, e.g. `[OFFENCE] +7% ranged damage`. Carries the same bracketed
 * category prefix the upgrade cards use, so a mixed level-up draw reads as one
 * list rather than two. Numbers route through `formatStat`.
 */
export function levelStatCardDescription(entry: LevelStatCard): string {
  const sign = entry.amount < 0 ? "-" : "+";
  const magnitude = formatStat(Math.abs(entry.amount));
  const suffix = entry.unit === "percent" ? "%" : "";
  return `[${entry.category.toUpperCase()}] ${sign}${magnitude}${suffix} ${LEVEL_STAT_LABELS[entry.statKey]}`;
}

/** Player-facing names for the block fields the cards touch. */
export const LEVEL_STAT_LABELS: Readonly<Partial<Record<keyof PlayerStatBlock, string>>> = Object.freeze({
  damagePercent: "damage",
  meleeDamagePercent: "melee damage",
  rangedDamagePercent: "ranged damage",
  elementalDamagePercent: "elemental damage",
  critChancePercent: "crit chance",
  attackSpeedPercent: "attack speed",
  maxHpFlat: "max HP",
  armourFlat: "armour",
  hpRegenPerSecond: "HP regen per second",
  lifestealPercent: "lifesteal",
  dodgePercent: "dodge",
  moveSpeedPercent: "move speed",
  harvestingPercent: "scrap gained",
  luck: "luck",
  engineering: "engineering",
});
