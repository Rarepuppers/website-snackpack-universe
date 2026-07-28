import { describe, expect, it } from "vitest";
import {
  NO_PLAYER_STATS,
  outgoingDamageMultiplier,
  resolvePlayerStats,
} from "./PlayerStatBlock";
import { applyPlayerStatLimits, finalAttackSpeedFactor, PLAYER_STAT_LIMITS } from "./PlayerStatLimits";

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

describe("applyPlayerStatLimits", () => {
  it("proves below-cap, exact-cap, and above-cap behavior for every bounded stat", () => {
    const below = applyPlayerStatLimits({
      ...NO_PLAYER_STATS,
      critChancePercent: 20,
      critMultiplier: 2,
      dodgePercent: 20,
      attackSpeedPercent: 100,
      moveSpeedPercent: 50,
      rangePercent: 100,
      lifestealPercent: 20,
      hpRegenPerSecond: 0.5,
    }, 10);
    expect(below.effective.critChancePercent).toBe(20);
    expect(below.effective.critMultiplier).toBe(2);
    expect(below.effective.dodgePercent).toBe(20);
    expect(below.effective.attackSpeedPercent).toBe(100);
    expect(below.effective.moveSpeedPercent).toBe(50);
    expect(below.effective.rangePercent).toBe(100);
    expect(below.effective.lifestealPercent).toBe(20);
    expect(below.effective.hpRegenPerSecond).toBe(0.5);

    const exact = applyPlayerStatLimits({
      ...NO_PLAYER_STATS,
      critChancePercent: 100,
      critMultiplier: 4,
      dodgePercent: 60,
      attackSpeedPercent: 200,
      moveSpeedPercent: 75,
      rangePercent: 200,
      lifestealPercent: 25,
      hpRegenPerSecond: 1,
    }, 10);
    expect(exact.effective.critChancePercent).toBe(PLAYER_STAT_LIMITS.critChancePercent.max);
    expect(exact.effective.critMultiplier).toBe(PLAYER_STAT_LIMITS.critMultiplier.max);
    expect(exact.effective.dodgePercent).toBe(PLAYER_STAT_LIMITS.dodgePercent.max);
    expect(exact.effective.attackSpeedPercent).toBe(200);
    expect(exact.effective.moveSpeedPercent).toBe(75);
    expect(exact.effective.rangePercent).toBe(200);
    expect(exact.effective.lifestealPercent).toBe(25);
    expect(exact.effective.hpRegenPerSecond).toBe(1);

    const above = applyPlayerStatLimits({
      ...NO_PLAYER_STATS,
      critChancePercent: 101,
      critMultiplier: 5,
      dodgePercent: 61,
      attackSpeedPercent: 300,
      moveSpeedPercent: 100,
      rangePercent: 300,
      lifestealPercent: 26,
      hpRegenPerSecond: 2,
    }, 10);
    expect(above.effective.critChancePercent).toBe(100);
    expect(above.effective.critMultiplier).toBe(4);
    expect(above.effective.dodgePercent).toBe(60);
    expect(above.effective.attackSpeedPercent).toBe(200);
    expect(above.effective.moveSpeedPercent).toBe(75);
    expect(above.effective.rangePercent).toBe(200);
    expect(above.effective.lifestealPercent).toBe(25);
    expect(above.effective.hpRegenPerSecond).toBe(1);
    expect(above.capped).toEqual(expect.arrayContaining([
      "critChancePercent", "critMultiplier", "dodgePercent", "attackSpeedPercent",
      "moveSpeedPercent", "rangePercent", "lifestealPercent", "hpRegenPerSecond",
    ]));
  });

  it("retains raw values while neutralizing malformed limited values", () => {
    const result = applyPlayerStatLimits({
      ...NO_PLAYER_STATS,
      dodgePercent: Number.POSITIVE_INFINITY,
      critMultiplier: Number.NaN,
    });
    expect(result.raw.dodgePercent).toBe(Infinity);
    expect(result.effective.dodgePercent).toBe(0);
    expect(result.effective.critMultiplier).toBe(1.5);
    expect(result.capped).toEqual(expect.arrayContaining(["dodgePercent", "critMultiplier"]));
  });

  it("keeps named attack-speed multipliers inside the final emergency bound", () => {
    expect(finalAttackSpeedFactor(0.1)).toBe(0.2);
    expect(finalAttackSpeedFactor(4)).toBe(4);
    expect(finalAttackSpeedFactor(8)).toBe(4);
  });
});
