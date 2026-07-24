import { describe, expect, it } from "vitest";
import {
  NO_PLAYER_STATS,
  outgoingDamageMultiplier,
  resolvePlayerStats,
} from "./PlayerStatBlock";

describe("resolvePlayerStats", () => {
  it("returns neutral defaults with no sources", () => {
    expect(resolvePlayerStats()).toEqual(NO_PLAYER_STATS);
    expect(resolvePlayerStats({})).toEqual(NO_PLAYER_STATS);
  });

  it("folds item stats additively into the block", () => {
    const block = resolvePlayerStats({ itemStats: { damagePercent: 15, armourFlat: 2, maxHpFlat: 20 } });
    expect(block.damagePercent).toBe(15);
    expect(block.armourFlat).toBe(2);
    expect(block.maxHpFlat).toBe(20);
    // Untouched fields keep their defaults.
    expect(block.moveSpeedPercent).toBe(0);
    expect(block.critMultiplier).toBe(1.5);
  });

  it("supports negative item stats (the trade-off knob)", () => {
    const block = resolvePlayerStats({ itemStats: { damagePercent: 20, attackSpeedPercent: -10, moveSpeedPercent: -8 } });
    expect(block.damagePercent).toBe(20);
    expect(block.attackSpeedPercent).toBe(-10);
    expect(block.moveSpeedPercent).toBe(-8);
  });

  it("treats item crit multiplier as an additive bonus on the 1.5 baseline", () => {
    // Items contribute a bonus, not an absolute; +0.5 yields an effective x2.0,
    // and multiple items' bonuses (summed in foldItemStats) simply add on top.
    expect(resolvePlayerStats({ itemStats: { critMultiplier: 0.5 } }).critMultiplier).toBeCloseTo(2.0);
    expect(resolvePlayerStats({ itemStats: { critMultiplier: 0.6 } }).critMultiplier).toBeCloseTo(2.1);
  });
});

describe("outgoingDamageMultiplier", () => {
  it("applies the global damage bonus to every weapon profile", () => {
    const stats = { ...NO_PLAYER_STATS, damagePercent: 25 };
    expect(outgoingDamageMultiplier(stats, { melee: true, elemental: false })).toBeCloseTo(1.25);
    expect(outgoingDamageMultiplier(stats, { melee: false, elemental: true })).toBeCloseTo(1.25);
  });

  it("adds the melee bucket only to melee weapons and the ranged bucket only to ranged", () => {
    const stats = { ...NO_PLAYER_STATS, meleeDamagePercent: 30, rangedDamagePercent: 10 };
    expect(outgoingDamageMultiplier(stats, { melee: true, elemental: false })).toBeCloseTo(1.30);
    expect(outgoingDamageMultiplier(stats, { melee: false, elemental: false })).toBeCloseTo(1.10);
  });

  it("adds the elemental bucket only to elemental weapons, stacking with the base and pattern buckets", () => {
    const stats = { ...NO_PLAYER_STATS, damagePercent: 10, rangedDamagePercent: 20, elementalDamagePercent: 40 };
    // Ranged + elemental weapon: 1 + (10 + 20 + 40)/100.
    expect(outgoingDamageMultiplier(stats, { melee: false, elemental: true })).toBeCloseTo(1.70);
    // Ranged + physical weapon: elemental bucket excluded.
    expect(outgoingDamageMultiplier(stats, { melee: false, elemental: false })).toBeCloseTo(1.30);
  });
});
