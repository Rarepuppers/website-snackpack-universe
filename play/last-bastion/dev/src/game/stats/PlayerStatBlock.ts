import type { PerkRunModifiers } from "../perks/perkCatalog";
import type { RelicRunModifiers } from "../content/relicCatalog";
import type { TransformationRunModifiers } from "../transformations/TransformationRunModifiers";

/**
 * The unified player stat vector (Brotato-style overhaul — see
 * `last-bastion-shop-economy-plan.md`). This is the single resolved surface
 * combat reads for damage, defence, crit, and economy scaling, folded once from
 * every build source: hero base + level growth, perks, relics/artifacts,
 * transformations, upgrades, and — the point of the overhaul — shop items.
 *
 * Adopting this is deliberately incremental: the five existing modifier bags
 * keep resolving independently, and combat migrates its read-sites onto this
 * block one stat at a time (each migration paired with a test proving the value
 * matches the old path). New stats with no prior home (crit, the damage buckets,
 * dodge, luck, harvesting, %-of-damage lifesteal, curse) are introduced here and
 * wired directly, since there is nothing to migrate from.
 *
 * Convention: `*Percent` fields are additive percentages (0 = no change, 20 =
 * +20%); flat fields are additive; explicit `*Multiplier` fields are
 * multiplicative (1 = no change). Damage buckets are additive with each other
 * and with `damagePercent` before being applied as one multiplier.
 */
export interface PlayerStatBlock {
  // --- Offence ---
  /** Global outgoing-damage bonus applied to every weapon (additive %). */
  damagePercent: number;
  /** Extra % for melee-pattern weapons (melee-sweep / orbit-blade). */
  meleeDamagePercent: number;
  /** Extra % for ranged-pattern weapons (projectile / scatter / chain / beam / orbit). */
  rangedDamagePercent: number;
  /** Extra % for elemental weapons (any non-physical damage type). */
  elementalDamagePercent: number;
  /** Per-hit chance to crit, as a percentage (0..100+, clamped at roll time). */
  critChancePercent: number;
  /** Damage multiplier applied on a crit (1.5 = +50% on crit). */
  critMultiplier: number;
  /** Global attack-speed bonus (additive %). */
  attackSpeedPercent: number;
  /** Global weapon-range bonus (additive %). Reserved until range wiring lands. */
  rangePercent: number;

  // --- Defence / survival ---
  /** Flat max-HP bonus (points). */
  maxHpFlat: number;
  /** Max-HP bonus as a percentage of base. */
  maxHpPercent: number;
  /** Flat armour bonus. */
  armourFlat: number;
  /** Passive HP regenerated per second (additive on top of the base trickle). */
  hpRegenPerSecond: number;
  /** Fraction of damage dealt returned as health, as a percentage. */
  lifestealPercent: number;
  /** Chance to ignore an incoming hit entirely, as a percentage. Reserved. */
  dodgePercent: number;
  /** Global move-speed bonus (additive %). */
  moveSpeedPercent: number;

  // --- Economy / meta ---
  /** Scrap-gain bonus (additive %); folds into the reserved `mineralFindPercent`. */
  harvestingPercent: number;
  /** Bends shop rarity toward better stock. Reserved for the shop rework. */
  luck: number;
  /** Bends shop rarity toward worse stock (the trade-off knob). Reserved. */
  curse: number;
  /** Boosts turret / structure item power. Reserved for engineering items. */
  engineering: number;
}

export const NO_PLAYER_STATS: Readonly<PlayerStatBlock> = Object.freeze({
  damagePercent: 0,
  meleeDamagePercent: 0,
  rangedDamagePercent: 0,
  elementalDamagePercent: 0,
  critChancePercent: 0,
  critMultiplier: 1.5,
  attackSpeedPercent: 0,
  rangePercent: 0,
  maxHpFlat: 0,
  maxHpPercent: 0,
  armourFlat: 0,
  hpRegenPerSecond: 0,
  lifestealPercent: 0,
  dodgePercent: 0,
  moveSpeedPercent: 0,
  harvestingPercent: 0,
  luck: 0,
  curse: 0,
  engineering: 0,
});

/**
 * Sources folded into the resolved block. Optional so callers (and tests) can
 * supply only what they have; each defaults to its neutral bag. `itemStats` is
 * the shop-item contribution — a partial block carried on the run build — and is
 * where the entire Brotato item economy lands.
 */
export interface PlayerStatSources {
  perk?: PerkRunModifiers | null;
  relic?: RelicRunModifiers | null;
  transformation?: TransformationRunModifiers | null;
  itemStats?: Partial<PlayerStatBlock> | null;
}

/**
 * Folds every build source into one resolved block. Additive fields sum;
 * `critMultiplier` (the one multiplicative field here) starts at the item/base
 * value and is not double-counted. Only sources that already expose a stat in
 * their own bag contribute today; the rest arrive as the incremental migration
 * and the item catalogue land.
 */
export function resolvePlayerStats(sources: PlayerStatSources = {}): PlayerStatBlock {
  const block: PlayerStatBlock = { ...NO_PLAYER_STATS };

  const relic = sources.relic;
  if (relic) {
    // Symbiote Heart etc. already grant per-kill lifesteal via RelicRunModifiers;
    // %-of-damage lifesteal is a distinct new stat and stays item-sourced.
    // (No relic fields map cleanly onto the new %-stats yet; migration adds them.)
    void relic;
  }

  const transformation = sources.transformation;
  if (transformation) {
    // Committed-path effects already reach combat through TransformationRunModifiers'
    // own read-sites; they are not re-folded here to avoid double application during
    // the incremental migration. Left as an explicit seam for later consolidation.
    void transformation;
  }

  const item = sources.itemStats;
  if (item) {
    // Every stat is additive, including `critMultiplier`: the block starts at the
    // 1.5 crit baseline and items contribute a bonus on top (an item with
    // `critMultiplier: 0.5` yields an effective x2.0). This is what lets item
    // contributions sum cleanly in `foldItemStats` before they reach here.
    for (const key of Object.keys(NO_PLAYER_STATS) as (keyof PlayerStatBlock)[]) {
      const value = item[key];
      if (typeof value === "number") block[key] += value;
    }
  }

  return block;
}

/** The additive outgoing-damage multiplier for a weapon of the given profile. */
export function outgoingDamageMultiplier(
  stats: PlayerStatBlock,
  profile: { melee: boolean; elemental: boolean },
): number {
  const bucket = profile.melee ? stats.meleeDamagePercent : stats.rangedDamagePercent;
  const elemental = profile.elemental ? stats.elementalDamagePercent : 0;
  return 1 + (stats.damagePercent + bucket + elemental) / 100;
}
