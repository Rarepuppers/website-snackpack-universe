import { describe, expect, it } from "vitest";
import type { ArenaDefinition } from "../arena/ArenaDefinition";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, type CombatEvent } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
};

const EMPTY_ARENA: ArenaDefinition = {
  id: "reclaimer-test",
  widthMetres: 30,
  heightMetres: 20,
  tileSizeMetres: 1,
  obstacles: [],
};

function collect(simulation: CombatSimulation, seconds: number): CombatEvent[] {
  const events: CombatEvent[] = [];
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) {
    events.push(...simulation.step(IDLE, 0.05).events);
  }
  return events;
}

function setupRepairPair(): { simulation: CombatSimulation; reclaimerId: number; targetId: number } {
  const simulation = new CombatSimulation({
    autoStartWaves: false,
    autoFireEnabled: false,
    arena: EMPTY_ARENA,
    widthMetres: 30,
    heightMetres: 20,
  });
  const targetId = simulation.spawnEnemy("arc-warden", { x: 10, y: 10 });
  simulation.dealDamage(targetId, 4, "physical");
  const reclaimerId = simulation.spawnEnemy("cyborg-reclaimer", { x: 7, y: 10 });
  return { simulation, reclaimerId, targetId };
}

describe("Cyborg Reclaimer live gate", () => {
  it("locks and completes one capped repair on a damaged machine", () => {
    const { simulation, targetId } = setupRepairPair();
    const before = simulation.snapshot().enemies.find((enemy) => enemy.id === targetId)!.health;
    const events = collect(simulation, 2.4);
    expect(events.some((event) => event.type === "reclaimer-link-started" && event.targetId === targetId))
      .toBe(true);
    const completed = events.find((event) => event.type === "reclaimer-repair-completed");
    expect(completed).toMatchObject({ type: "reclaimer-repair-completed", targetId });
    const after = simulation.snapshot().enemies.find((enemy) => enemy.id === targetId)!.health;
    expect(after).toBeGreaterThan(before);
    expect(after).toBeLessThanOrEqual(12);
  });

  it("incoming damage breaks the live tether without spending a patch", () => {
    const { simulation, reclaimerId } = setupRepairPair();
    expect(collect(simulation, 0.85).some((event) => event.type === "reclaimer-link-started")).toBe(true);
    simulation.dealDamage(reclaimerId, 1, "physical");
    const events = collect(simulation, 0.1);
    expect(events).toContainEqual(expect.objectContaining({
      type: "reclaimer-link-interrupted",
      enemyId: reclaimerId,
      reason: "damage",
    }));
    const reclaimer = simulation.snapshot().enemies.find((enemy) => enemy.id === reclaimerId)!;
    expect(reclaimer).toMatchObject({ reclaimerPhase: "recovery", reclaimerChargesRemaining: 3 });
  });

  it("enforces one simultaneous live link across two Reclaimers", () => {
    const { simulation } = setupRepairPair();
    simulation.spawnEnemy("cyborg-reclaimer", { x: 7, y: 12 });
    collect(simulation, 0.85);
    expect(simulation.snapshot().enemies.filter((enemy) => (
      enemy.type === "cyborg-reclaimer" && enemy.reclaimerPhase === "channel"
    ))).toHaveLength(1);
  });

  it("authors one Reclaimer with damaged allies inside the mixed-machine cap", () => {
    const simulation = new CombatSimulation({ scenario: "cyborg-reclaimer", seed: 65067 });
    const snapshot = simulation.snapshot();
    expect(snapshot.enemies.filter((enemy) => enemy.type === "cyborg-reclaimer")).toHaveLength(1);
    expect(snapshot.enemies).toHaveLength(6);
    expect(snapshot.enemies.filter((enemy) => enemy.health < enemy.maxHealth)).toHaveLength(3);
    expect(snapshot.enemies.length).toBeLessThanOrEqual(12);
  });
});
