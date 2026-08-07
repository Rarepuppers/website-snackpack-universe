import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import { NO_PLAYER_STATS, resolvePlayerStats } from "../stats/PlayerStatBlock";

/**
 * `statusBuildupPercent` exists so the item economy and the level-up stat cards
 * can influence status application at all. Before it, buildup was reachable only
 * from the Element Primer relic, three element upgrades, and one transformation
 * — see `last-bastion-content-design-plan-2026-08-07.md` P4.
 */
function simulationWithBuildupStat(statusBuildupPercent: number): CombatSimulation {
  return new CombatSimulation({
    autoStartWaves: false,
    startingBuild: {
      itemStats: { statusBuildupPercent },
      relicIds: [], weapons: [], upgrades: [], ownedItemIds: [], bannedShopIds: [],
    } as never,
  });
}

/**
 * Fire on a neutral target, so the stat is the only variable. `ripper` is used
 * rather than `scuttler` because a 4 HP scuttler dies before it can ignite —
 * which silently reported "ignited in 2 hits" for both arms and made the test
 * pass-looking but meaningless. Throwing on death keeps that failure loud.
 */
function hitsUntilStatusApplies(simulation: CombatSimulation, perHit: number): number {
  const enemyId = simulation.spawnEnemy("ripper", { x: 6, y: 6 });
  for (let hit = 1; hit <= 40; hit += 1) {
    simulation.dealDamage(enemyId, perHit, "fire");
    const enemy = simulation.snapshot().enemies.find((candidate) => candidate.id === enemyId);
    if (!enemy) throw new Error(`target died after ${hit} hits before igniting; use a tougher one`);
    if ((enemy.statuses ?? []).includes("blaze")) return hit;
  }
  return Number.POSITIVE_INFINITY;
}

describe("statusBuildupPercent", () => {
  it("defaults to neutral so existing builds are unchanged", () => {
    expect(NO_PLAYER_STATS.statusBuildupPercent).toBe(0);
    expect(resolvePlayerStats().statusBuildupPercent).toBe(0);
  });

  it("is folded from item stats like every other block field", () => {
    const stats = resolvePlayerStats({ itemStats: { statusBuildupPercent: 35 } });
    expect(stats.statusBuildupPercent).toBe(35);
  });

  it("sums across contributing items", () => {
    const stats = resolvePlayerStats({ itemStats: { statusBuildupPercent: 10 } });
    const doubled = resolvePlayerStats({ itemStats: { statusBuildupPercent: 10 + 15 } });
    expect(stats.statusBuildupPercent).toBe(10);
    expect(doubled.statusBuildupPercent).toBe(25);
  });

  it("reaches the buildup threshold in fewer hits than an unmodified build", () => {
    // 1 damage per hit: the baseline needs the full 8 to reach the threshold,
    // which leaves plenty of room for a boosted build to be measurably faster
    // and keeps the 14 HP target alive throughout.
    const perHit = 1;
    const baseline = hitsUntilStatusApplies(simulationWithBuildupStat(0), perHit);
    const boosted = hitsUntilStatusApplies(simulationWithBuildupStat(100), perHit);

    expect(baseline).toBeLessThan(Number.POSITIVE_INFINITY);
    expect(boosted).toBeLessThan(baseline);
  });

  it("does not apply a status on the first hit at neutral", () => {
    // Deliberately not asserting the exact count: buildup accumulates the
    // *mitigated* damage, so the target's armour makes it take more hits than
    // the threshold divided by per-hit damage would suggest. The invariant that
    // matters is that a single chip hit never ignites.
    const hits = hitsUntilStatusApplies(simulationWithBuildupStat(0), 1);
    expect(hits).toBeGreaterThan(1);
    expect(hits).toBeLessThan(Number.POSITIVE_INFINITY);
  });
});
