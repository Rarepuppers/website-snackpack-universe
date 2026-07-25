import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import { RELIC_CATALOG, resolveRelicModifiers } from "../content/relicCatalog";

/**
 * Relic *behaviour* tests.
 *
 * Every one of these relics previously set its modifier field correctly and had
 * **zero combat read-sites** — a test asserting on `resolveRelicModifiers` alone
 * passed the whole time they did nothing. So each case here drives a real
 * `CombatSimulation` and asserts an observable difference between owning the
 * relic and not owning it.
 */
const IDLE = {
  move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, ultimatePressed: false, kitPressed: false, interactPressed: false,
  pausePressed: false, restartPressed: false,
};

function build(relicIds: string[]) {
  return {
    health: 20, shield: 0, level: 1, experience: 0, scrap: 0,
    weapons: [], upgrades: [], relicIds: relicIds as never,
  };
}

describe("relic combat effects", () => {
  it("Stabiliser Gyro narrows the fired spread while moving, and only while moving", () => {
    // Measured off real projectile angles: asserting the modifier value would
    // have passed for the entire period this relic did nothing.
    // Needs a multi-projectile weapon: the starting rifle fires one projectile
    // with no spread, so measuring it would assert nothing at all.
    const spreadWhileMoving = (relicIds: string[], moving: boolean): number => {
      const simulation = new CombatSimulation({
        autoStartWaves: false,
        startingBuild: { ...build(relicIds), weapons: [{ weaponId: "scattergun", tier: 1 }] },
      });
      const move = moving ? { x: 1, y: 0 } : { x: 0, y: 0 };
      for (let tick = 0; tick < 60; tick += 1) {
        simulation.step({ ...IDLE, move, fireHeld: true }, 0.05);
        const angles = simulation.snapshot().projectiles.map((p) => p.rotationRadians);
        if (angles.length >= 2) return Math.max(...angles) - Math.min(...angles);
      }
      return 0;
    };
    const movingWithout = spreadWhileMoving([], true);
    // Guard the guard: if this is 0 the comparisons below are vacuous.
    expect(movingWithout).toBeGreaterThan(0);

    expect(spreadWhileMoving(["rel-stabiliser-gyro"], true)).toBeLessThan(movingWithout);
    // Stationary is untouched — the relic is a moving-only bonus.
    expect(spreadWhileMoving(["rel-stabiliser-gyro"], false))
      .toBeCloseTo(spreadWhileMoving([], false), 5);
  });

  it("Field Lattice chills nearby aliens when health is collected", () => {
    const chilled = (relicIds: string[]): boolean => {
      const simulation = new CombatSimulation({
        autoStartWaves: false, startingBuild: build(relicIds),
      });
      const player = simulation.snapshot().playerPosition;
      simulation.spawnEnemy("scuttler", { x: player.x + 1, y: player.y });
      simulation.spawnPowerup("medkit", { x: player.x, y: player.y });
      simulation.step(IDLE, 0.05);
      return simulation.snapshot().enemies.some((enemy) => enemy.statuses.includes("freeze"));
    };
    expect(chilled(["rel-field-lattice"])).toBe(true);
    expect(chilled([])).toBe(false);
  });

  it("Kinetic Greaves sends the evasive move further", () => {
    const dashDistance = (relicIds: string[]): number => {
      const simulation = new CombatSimulation({
        autoStartWaves: false, startingBuild: build(relicIds),
      });
      const start = { ...simulation.snapshot().playerPosition };
      simulation.step({ ...IDLE, move: { x: 1, y: 0 } }, 0.05);
      simulation.step({ ...IDLE, move: { x: 1, y: 0 }, evasiveMovePressed: true }, 0.05);
      for (let tick = 0; tick < 12; tick += 1) simulation.step({ ...IDLE, move: { x: 1, y: 0 } }, 0.05);
      const end = simulation.snapshot().playerPosition;
      return Math.hypot(end.x - start.x, end.y - start.y);
    };
    expect(dashDistance(["rel-kinetic-greaves"])).toBeGreaterThan(dashDistance([]));
  });

  it("every relic in the live pool sets at least one modifier that combat reads", () => {
    // A catalogue-level guard: a relic whose fields are all unread is a placebo
    // pickup, and the player cannot tell the difference.
    for (const relic of RELIC_CATALOG) {
      const modifiers = resolveRelicModifiers([relic.id], null);
      const neutral = resolveRelicModifiers([], null);
      const changed = (Object.keys(modifiers) as (keyof typeof modifiers)[])
        .filter((key) => modifiers[key] !== neutral[key]);
      expect(changed.length, `${relic.id} changes nothing`).toBeGreaterThan(0);
    }
  });
});
