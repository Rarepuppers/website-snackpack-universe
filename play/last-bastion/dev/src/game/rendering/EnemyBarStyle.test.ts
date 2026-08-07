import { describe, expect, it } from "vitest";
import { buildupRowY, enemyBarStyle, shieldRowY } from "./EnemyBarStyle";
import type { EnemyThreatClass } from "./EnemyHealthBars";

const ALL_CLASSES: readonly EnemyThreatClass[] = [
  "standard",
  "specialist",
  "elite",
  "mini-boss",
  "boss",
];

describe("enemyBarStyle", () => {
  it("leaves the ordinary bar at its established 34x4 geometry", () => {
    // Regression guard: the rank work must not resize the common case, which is
    // what 30+ enemies on screen are actually made of.
    const standard = enemyBarStyle("standard");
    expect(standard.width).toBe(34);
    expect(standard.height).toBe(4);
    expect(standard.framed).toBe(false);
    expect(standard.pips).toBe(0);
  });

  it("derives the previously hard-coded shield and buildup rows at standard height", () => {
    const standard = enemyBarStyle("standard");
    expect(shieldRowY(standard)).toBe(5);
    expect(buildupRowY(standard)).toBe(9);
  });

  it("escalates size monotonically with rank so it reads without colour", () => {
    const ranked = ["standard", "elite", "mini-boss", "boss"] as const;
    for (let index = 1; index < ranked.length; index += 1) {
      const previous = enemyBarStyle(ranked[index - 1]!);
      const current = enemyBarStyle(ranked[index]!);
      expect(current.width).toBeGreaterThan(previous.width);
      expect(current.height).toBeGreaterThanOrEqual(previous.height);
    }
  });

  it("gives every rank above standard a frame and at least one pip", () => {
    for (const threatClass of ["elite", "mini-boss", "boss"] as const) {
      const style = enemyBarStyle(threatClass);
      expect(style.framed).toBe(true);
      expect(style.accent).not.toBeNull();
      expect(style.pips).toBeGreaterThan(0);
    }
  });

  it("distinguishes elite from mini-boss by pip count, not colour alone", () => {
    const elite = enemyBarStyle("elite");
    const miniBoss = enemyBarStyle("mini-boss");
    expect(elite.accent).toBe(miniBoss.accent);
    expect(miniBoss.pips).toBeGreaterThan(elite.pips);
  });

  it("keeps specialist unmarked, matching the shipped behaviour", () => {
    expect(enemyBarStyle("specialist").accent).toBeNull();
    expect(enemyBarStyle("specialist").pips).toBe(0);
  });

  it("never lets rows overlap the bar or each other, at any rank", () => {
    for (const threatClass of ALL_CLASSES) {
      const style = enemyBarStyle(threatClass);
      // Shield strip must start below the health track.
      expect(shieldRowY(style)).toBeGreaterThanOrEqual(style.height);
      // Buildup tick must clear the 3px shield strip.
      expect(buildupRowY(style)).toBeGreaterThanOrEqual(shieldRowY(style) + 3);
    }
  });

  it("returns a usable style for every threat class", () => {
    for (const threatClass of ALL_CLASSES) {
      const style = enemyBarStyle(threatClass);
      expect(style.width).toBeGreaterThan(0);
      expect(style.height).toBeGreaterThan(0);
      expect(style.segments).toBeGreaterThanOrEqual(1);
    }
  });
});
