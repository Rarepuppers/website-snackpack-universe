import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import type { PlayerIntent } from "../input/PlayerIntent";
import { collectItemEffects, ITEM_CATALOG } from "../content/itemCatalog";

/**
 * Behavioural item effects.
 *
 * Every item in the game was a stat bundle until now, which made the catalogue
 * read as more-of-a-number-you-already-had. These fire on a *moment*. As with
 * the relic tests, each case drives a real simulation rather than asserting on
 * the catalogue — an effect that resolves correctly and is never called is
 * indistinguishable from one that does nothing.
 */

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, ultimatePressed: false, kitPressed: false,
  interactPressed: false, interactHeld: false,
  pausePressed: false, restartPressed: false,
};

function build(ownedItemIds: string[], health = 20) {
  return {
    health, shield: 0, level: 1, experience: 0, scrap: 0,
    weapons: [], upgrades: [], relicIds: [] as never,
    ownedItemIds,
  };
}

describe("behavioural item effects", () => {
  it("heals on wave start, and only for the owner", () => {
    const healthAfterWaveStart = (items: string[]): number => {
      const simulation = new CombatSimulation({
        autoStartWaves: true,
        startingBuild: build(items, 5),
      });
      simulation.step(IDLE, 0.05);
      return simulation.snapshot().playerHealth;
    };
    expect(healthAfterWaveStart(["wave-rations"])).toBeGreaterThan(healthAfterWaveStart([]));
  });

  it("Kill Clock opens a damage window on a kill and it lapses", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build(["kill-clock"]),
    });
    const player = simulation.snapshot().playerPosition;
    const probeId = simulation.spawnEnemy("abomination", { x: player.x + 2, y: player.y });

    const damageOver = (ticks: number): number => {
      const before = simulation.snapshot().enemies.find((e) => e.id === probeId)?.health ?? 0;
      for (let tick = 0; tick < ticks; tick += 1) simulation.step({ ...IDLE, fireHeld: true }, 0.05);
      const after = simulation.snapshot().enemies.find((e) => e.id === probeId)?.health ?? 0;
      return before - after;
    };

    const baseline = damageOver(20);
    // Kill something to open the window.
    const fodderId = simulation.spawnEnemy("scuttler", { x: player.x + 1, y: player.y });
    simulation.dealDamage(fodderId, 9999);
    const boosted = damageOver(20);
    expect(boosted).toBeGreaterThan(baseline);

    // Let the window lapse; damage returns to the baseline rate.
    for (let tick = 0; tick < 80; tick += 1) simulation.step(IDLE, 0.05);
    expect(damageOver(20)).toBeLessThan(boosted);
  });

  it("Tithe Collector pays only on every eighth kill", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build(["tithe-collector"]),
    });
    const scrapAfterKills = (count: number): number => {
      for (let index = 0; index < count; index += 1) {
        const id = simulation.spawnEnemy("scuttler", { x: 12 + index * 0.2, y: 12 });
        simulation.dealDamage(id, 9999);
      }
      return simulation.snapshot().securedScrap;
    };
    const afterSeven = scrapAfterKills(7);
    const afterEight = scrapAfterKills(1);
    expect(afterEight).toBeGreaterThan(afterSeven);
  });

  it("Deadman's Switch fires once when health drops, not repeatedly", () => {
    const simulation = new CombatSimulation({
      autoStartWaves: false,
      startingBuild: build(["deadmans-switch"], 3),
    });
    // Health starts under the quarter threshold, so the window opens at once.
    simulation.step(IDLE, 0.05);
    const player = simulation.snapshot().playerPosition;
    const probeId = simulation.spawnEnemy("abomination", { x: player.x + 2, y: player.y });

    const damageOver = (ticks: number): number => {
      const before = simulation.snapshot().enemies.find((e) => e.id === probeId)?.health ?? 0;
      for (let tick = 0; tick < ticks; tick += 1) simulation.step({ ...IDLE, fireHeld: true }, 0.05);
      return before - (simulation.snapshot().enemies.find((e) => e.id === probeId)?.health ?? 0);
    };

    const boosted = damageOver(20);
    // Once the six seconds lapse it must not re-trigger while still low.
    for (let tick = 0; tick < 160; tick += 1) simulation.step(IDLE, 0.05);
    expect(damageOver(20)).toBeLessThan(boosted);
  });

  it("does nothing at all for a run that owns no behavioural items", () => {
    // The default run must be byte-identical to before this system existed.
    expect(collectItemEffects([])).toEqual([]);
    expect(collectItemEffects(["whetstone", "plate-fragment"])).toEqual([]);
  });
});

describe("behavioural item catalogue", () => {
  it("only describes triggers the simulation actually resolves", () => {
    // A closed vocabulary is the point: an item must not be able to promise a
    // moment combat has no resolution point for.
    const RESOLVED = new Set(["on-kill", "on-wave-start", "on-low-health"]);
    for (const item of ITEM_CATALOG) {
      for (const effect of item.effects ?? []) {
        expect(RESOLVED.has(effect.trigger), `${item.id} -> ${effect.trigger}`).toBe(true);
      }
    }
  });

  it("ships some behavioural items, or the whole system is theoretical", () => {
    expect(ITEM_CATALOG.filter((item) => item.effects?.length).length).toBeGreaterThanOrEqual(4);
  });
});
