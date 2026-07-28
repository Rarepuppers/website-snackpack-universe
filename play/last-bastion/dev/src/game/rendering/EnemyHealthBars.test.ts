import { describe, expect, it } from "vitest";
import { EnemyHealthBars, shouldShowEnemyHealthBar, type EnemyHealthBarTarget } from "./EnemyHealthBars";

function target(overrides: Partial<EnemyHealthBarTarget> = {}): EnemyHealthBarTarget {
  return {
    threatClass: "standard",
    health: 5,
    maxHealth: 10,
    shield: 0,
    maxShield: 0,
    recentDamageRemainingSeconds: 0,
    hasActiveStatus: false,
    majorAttackWindup: false,
    ...overrides,
  };
}

describe("enemy health-bar visibility policy", () => {
  it("keeps standard enemies hidden until All mode and tactical activity", () => {
    expect(shouldShowEnemyHealthBar(target(), "off")).toBe(false);
    expect(shouldShowEnemyHealthBar(target(), "threats")).toBe(false);
    expect(shouldShowEnemyHealthBar(target({ recentDamageRemainingSeconds: 1 }), "threats")).toBe(false);
    expect(shouldShowEnemyHealthBar(target({ recentDamageRemainingSeconds: 1 }), "all")).toBe(true);
    expect(shouldShowEnemyHealthBar(target({ hasActiveStatus: true }), "all")).toBe(true);
  });

  it("shows specialists and elites in Threats mode only when tactically active", () => {
    for (const threatClass of ["specialist", "elite"] as const) {
      expect(shouldShowEnemyHealthBar(target({ threatClass }), "threats")).toBe(false);
      expect(shouldShowEnemyHealthBar(target({ threatClass, majorAttackWindup: true }), "threats")).toBe(true);
      expect(shouldShowEnemyHealthBar(target({ threatClass, hasActiveStatus: true }), "threats")).toBe(true);
    }
  });

  it("keeps bosses and mini-bosses visible in every non-off mode", () => {
    for (const threatClass of ["mini-boss", "boss"] as const) {
      expect(shouldShowEnemyHealthBar(target({ threatClass }), "threats")).toBe(true);
      expect(shouldShowEnemyHealthBar(target({ threatClass }), "all")).toBe(true);
      expect(shouldShowEnemyHealthBar(target({ threatClass }), "off")).toBe(false);
    }
  });

  it("recycles removed views and never exceeds the live enemy count", () => {
    const graphics = {
      clear() { return this; }, fillStyle() { return this; }, fillRect() { return this; },
      setPosition() { return this; }, setDepth() { return this; }, setVisible() { return this; },
      setAlpha() { return this; },
    };
    const scene = {
      add: { graphics: () => ({ ...graphics }) },
      tweens: { killTweensOf() {}, add() {} },
    } as never;
    const bars = new EnemyHealthBars(scene);
    const enemy = (id: number) => ({ id, position: { x: id, y: id }, ...target({ recentDamageRemainingSeconds: 1 }) });
    bars.sync([enemy(1) as never], "all", true, 32);
    expect(bars.activeViewCount).toBe(1);
    bars.sync([], "all", true, 32);
    expect(bars.activeViewCount).toBe(0);
    expect(bars.pooledViewCount).toBe(1);
    bars.sync([enemy(2) as never, enemy(3) as never], "all", true, 32);
    expect(bars.activeViewCount).toBe(2);
    expect(bars.pooledViewCount).toBe(0);
  });
});
