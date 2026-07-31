import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import type { PlayerIntent } from "../input/PlayerIntent";
import { WEAPON_CATALOG } from "../content/weaponCatalog";
import { foldItemStats, ITEM_CATALOG } from "../content/itemCatalog";
import { LEVEL_STAT_CARDS, LEVEL_STAT_ORDER } from "../content/levelStatCatalog";

/**
 * Deployables, and the `engineering` stat they exist to give a consumer.
 *
 * `engineering` sat in `PlayerStatBlock` marked "reserved for engineering
 * items" with no weapon reading it, no item granting it, and its level-up card
 * deliberately withheld from the offer order. That is three pieces of a system
 * with nothing joining them. These tests assert the join.
 */

function intent(overrides: Partial<PlayerIntent> = {}): PlayerIntent {
  return {
    move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
    evasiveMovePressed: false, ultimatePressed: false, kitPressed: false,
    interactPressed: false, interactHeld: false,
    pausePressed: false, restartPressed: false,
    ...overrides,
  };
}

function build(itemIds: string[] = []) {
  return {
    health: 20, shield: 0, level: 1, experience: 0, scrap: 0,
    weapons: [{ weaponId: "sentry-stake" as const, tier: 1 as const }],
    upgrades: [], relicIds: [] as never,
    // The run carrier holds folded stats, not ids — fold through the real path
    // so this exercises what a purchased item actually does.
    itemStats: foldItemStats(itemIds),
  };
}

function plant(simulation: CombatSimulation, ticks = 4) {
  for (let tick = 0; tick < ticks; tick += 1) simulation.step(intent({ fireHeld: true }), 0.05);
}

describe("deployables", () => {
  it("plants a structure when the weapon fires", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingBuild: build() });
    expect(simulation.snapshot().deployables).toHaveLength(0);
    plant(simulation);
    expect(simulation.snapshot().deployables).toHaveLength(1);
    expect(simulation.snapshot().deployables[0]!.weaponId).toBe("sentry-stake");
  });

  it("the planted stake shoots on its own, without the player firing", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingBuild: build() });
    plant(simulation);
    const player = simulation.snapshot().playerPosition;
    const id = simulation.spawnEnemy("abomination", { x: player.x + 3, y: player.y });
    const before = simulation.snapshot().enemies.find((enemy) => enemy.id === id)!.health;

    // Player never presses fire again — any damage is the stake's doing.
    for (let tick = 0; tick < 60; tick += 1) simulation.step(intent(), 0.05);
    const after = simulation.snapshot().enemies.find((enemy) => enemy.id === id)?.health ?? 0;
    expect(after).toBeLessThan(before);
  });

  it("expires after its lifetime rather than standing forever", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingBuild: build() });
    plant(simulation);
    expect(simulation.snapshot().deployables).toHaveLength(1);
    const lifetime = WEAPON_CATALOG["sentry-stake"].deployLifetimeSeconds;
    for (let tick = 0; tick < (lifetime + 1) / 0.05; tick += 1) simulation.step(intent(), 0.05);
    expect(simulation.snapshot().deployables).toHaveLength(0);
  });

  it("retires the oldest rather than silently refusing at the cap", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingBuild: build() });
    const cap = WEAPON_CATALOG["sentry-stake"].deployMaxActive;
    // Fire well past the cap; the weapon must never become an unexplained no-op.
    for (let round = 0; round < cap + 2; round += 1) {
      for (let tick = 0; tick < 170; tick += 1) simulation.step(intent({ fireHeld: true }), 0.05);
    }
    expect(simulation.snapshot().deployables.length).toBeLessThanOrEqual(cap);
    expect(simulation.snapshot().deployables.length).toBeGreaterThan(0);
  });

  it("engineering lifts deployable health and uptime", () => {
    const stakeStats = (itemIds: string[]) => {
      const simulation = new CombatSimulation({ autoStartWaves: false, startingBuild: build(itemIds) });
      plant(simulation);
      return simulation.snapshot().deployables[0]!;
    };
    const plain = stakeStats([]);
    const engineered = stakeStats(["fabricator-core"]);
    expect(engineered.maxHealth).toBeGreaterThan(plain.maxHealth);
    expect(engineered.remainingSeconds).toBeGreaterThan(plain.remainingSeconds);
  });

  it("a run with no engineering behaves exactly as it did before the stat had a consumer", () => {
    const simulation = new CombatSimulation({ autoStartWaves: false, startingBuild: build() });
    plant(simulation);
    const unit = simulation.snapshot().deployables[0]!;
    expect(unit.maxHealth).toBe(WEAPON_CATALOG["sentry-stake"].deployHealth);
    // Already ticking down by a few frames, so bound it rather than pin it.
    expect(unit.remainingSeconds).toBeGreaterThan(WEAPON_CATALOG["sentry-stake"].deployLifetimeSeconds - 0.5);
    expect(unit.remainingSeconds).toBeLessThanOrEqual(WEAPON_CATALOG["sentry-stake"].deployLifetimeSeconds);
  });
});

describe("engineering reachability", () => {
  it("is granted by items, so the stat can be built toward", () => {
    const granters = ITEM_CATALOG.filter((item) => (item.statModifiers.engineering ?? 0) > 0);
    expect(granters.length).toBeGreaterThan(0);
  });

  it("is offered as a level-up card now that a weapon reads it", () => {
    // Withheld deliberately until the Sentry Stake existed. Offering a card for
    // a stat nothing consumes is worse than not having the card.
    expect(LEVEL_STAT_ORDER).toContain("lvl-engineering");
    expect(LEVEL_STAT_CARDS.some((card) => card.id === "lvl-engineering")).toBe(true);
  });

  it("has a weapon that consumes it", () => {
    const readers = Object.values(WEAPON_CATALOG).filter((weapon) => weapon.attackPattern === "deployable");
    expect(readers.length).toBeGreaterThan(0);
  });
});
