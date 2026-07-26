import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation } from "./CombatSimulation";
import { foldItemStats, itemById } from "../content/itemCatalog";

/**
 * `rangePercent` wiring (26 July 2026). The stat shipped in `PlayerStatBlock`
 * with **zero read sites** and no item granting it, so weapon reach was a stat
 * the game advertised and never varied — the same placebo failure mode the
 * content-debt plan found in the relics.
 *
 * These assert an observable outcome rather than the stat field, which would
 * have passed the whole time the stat did nothing.
 */

function intent(overrides: Partial<PlayerIntent> = {}): PlayerIntent {
  return {
    move: { x: 0, y: 0 },
    aim: { x: 1, y: 0 },
    fireHeld: false,
    evasiveMovePressed: false,
    interactPressed: false,
    ultimatePressed: false,
    kitPressed: false,
    pausePressed: false,
    restartPressed: false,
    ...overrides,
  };
}

/**
 * Frames before a scuttler walking in from 8 m takes its first hit. Reach is the
 * only variable: the hero stands still, the weapon auto-fires at the nearest
 * body, and the target closes at a fixed speed — so a longer weapon connects
 * strictly sooner. Measuring the *moment of contact* rather than a hit/no-hit
 * boundary keeps the test off knife-edge distances that depend on hitbox radii.
 */
function framesToFirstHit(ownedItemIds: readonly string[]): number {
  const simulation = new CombatSimulation({
    seed: 909,
    autoStartWaves: false,
    // Patrol Blade: 2.4 m, auto-targeting, no projectile travel to confound it.
    startingWeaponIds: ["patrol-blade"],
    startingBuild: {
      health: 30, shield: 0, level: 1, experience: 0, scrap: 0,
      weapons: [{ weaponId: "patrol-blade", tier: 1 }],
      upgrades: [],
      ownedItemIds: [...ownedItemIds],
    },
  });
  const start = simulation.snapshot().playerPosition;
  const targetId = simulation.spawnEnemy("scuttler", { x: start.x + 8, y: start.y });
  const maxHealth = simulation.snapshot().enemies.find((enemy) => enemy.id === targetId)!.maxHealth;

  for (let frame = 0; frame < 600; frame += 1) {
    simulation.step(intent({ fireHeld: true }), 0.02);
    const target = simulation.snapshot().enemies.find((enemy) => enemy.id === targetId);
    if (!target || target.health < maxHealth) return frame;
  }
  return -1;
}

describe("rangePercent actually changes weapon reach", () => {
  it("is granted by real, purchasable items", () => {
    expect(itemById("long-barrel")?.statModifiers.rangePercent).toBe(20);
    expect(itemById("reflex-sight")?.statModifiers.rangePercent).toBe(12);
    expect(itemById("sawn-off-stock")?.statModifiers.rangePercent).toBe(-25);
    // Stacking works through the ordinary fold, so two barrels are +40%.
    expect(foldItemStats(["long-barrel", "long-barrel"]).rangePercent).toBe(40);
  });

  it("connects sooner the more range you own, and stacks", () => {
    const baseline = framesToFirstHit([]);
    const oneBarrel = framesToFirstHit(["long-barrel"]);
    const threeBarrels = framesToFirstHit(["long-barrel", "long-barrel", "long-barrel"]);

    expect(baseline).toBeGreaterThan(0);
    expect(oneBarrel).toBeLessThan(baseline);
    expect(threeBarrels).toBeLessThan(oneBarrel);
  });

  it("gives up reach for the item that trades it away", () => {
    // The downside is real, not decorative: Sawn-Off Stock buys +25% damage by
    // making you wait longer before you can touch anything.
    expect(framesToFirstHit(["sawn-off-stock"])).toBeGreaterThan(framesToFirstHit([]));
  });

  it("leaves reach alone for items that do not touch range", () => {
    expect(framesToFirstHit(["whetstone"])).toBe(framesToFirstHit([]));
  });
});
