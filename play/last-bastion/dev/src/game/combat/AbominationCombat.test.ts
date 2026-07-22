import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import {
  ABOMINATION_SLAM_TERRAIN_DAMAGE,
  CombatSimulation,
  PLAYER_MAX_HEALTH,
  type CombatEvent,
} from "./CombatSimulation";

describe("Abomination live combat integration", () => {
  it("locks a visible slam, hits a stationary player once, and enters recovery", () => {
    const simulation = createSimulation();
    const enemyId = spawnInSlamRange(simulation);
    const events: CombatEvent[] = [];
    const phases = new Set<string>();
    for (let frame = 0; frame < 55; frame += 1) {
      const snapshot = simulation.step(intent(), 0.05);
      events.push(...snapshot.events);
      const enemy = snapshot.enemies.find((candidate) => candidate.id === enemyId);
      if (enemy?.abominationPhase) phases.add(enemy.abominationPhase);
    }
    expect(events.find((event) => event.type === "abomination-slam-warning"))
      .toMatchObject({ enemyId });
    expect(events.filter((event) => event.type === "abomination-slam-impact"))
      .toEqual([expect.objectContaining({ enemyId, hitPlayer: true })]);
    expect(phases).toEqual(new Set(["slam-windup", "slam-impact", "recovery", "shamble"]));
    expect(simulation.snapshot().playerHealth).toBeLessThan(PLAYER_MAX_HEALTH);
  });

  it("keeps the impact at the locked point so perpendicular movement dodges", () => {
    const simulation = createSimulation();
    spawnInSlamRange(simulation);
    let warned = false;
    let impact: Extract<CombatEvent, { type: "abomination-slam-impact" }> | null = null;
    for (let frame = 0; frame < 45 && !impact; frame += 1) {
      const snapshot = simulation.step(intent({ move: warned ? { x: 0, y: 1 } : { x: 0, y: 0 } }), 0.05);
      warned ||= snapshot.events.some((event) => event.type === "abomination-slam-warning");
      impact = snapshot.events.find((event): event is Extract<CombatEvent, { type: "abomination-slam-impact" }> => (
        event.type === "abomination-slam-impact"
      )) ?? null;
    }
    expect(warned).toBe(true);
    expect(impact).toMatchObject({ hitPlayer: false, damage: 0 });
    expect(simulation.snapshot().playerHealth).toBe(PLAYER_MAX_HEALTH);
  });

  it("damages nearby terrain through the numeric durability contract", () => {
    const simulation = createSimulation([{ id: "slam-cover", kind: "barricade", x: 16, y: 8, width: 1, height: 1 }]);
    spawnInSlamRange(simulation);
    const before = simulation.snapshot().terrain.find((terrain) => terrain.id === "slam-cover")!;
    let damageEvent: Extract<CombatEvent, { type: "obstacle-damaged" }> | undefined;
    for (let frame = 0; frame < 30 && !damageEvent; frame += 1) {
      const snapshot = simulation.step(intent(), 0.05);
      damageEvent = snapshot.events.find((event): event is Extract<CombatEvent, { type: "obstacle-damaged" }> => (
        event.type === "obstacle-damaged" && event.obstacleId === "slam-cover"
      ));
    }
    expect(damageEvent).toMatchObject({ source: "enemy-slam", damage: ABOMINATION_SLAM_TERRAIN_DAMAGE });
    expect(simulation.snapshot().terrain.find((terrain) => terrain.id === "slam-cover")!.health)
      .toBe(before.health - ABOMINATION_SLAM_TERRAIN_DAMAGE);
  });
});

function createSimulation(obstacles: readonly { id: string; kind: "barricade"; x: number; y: number; width: number; height: number }[] = []): CombatSimulation {
  return new CombatSimulation({
    autoStartWaves: false,
    arena: { id: "abomination-test", widthMetres: 30, heightMetres: 16.875, tileSizeMetres: 1, obstacles },
  });
}

function spawnInSlamRange(simulation: CombatSimulation): number {
  const player = simulation.snapshot().playerPosition;
  return simulation.spawnEnemy("abomination", { x: player.x - 2, y: player.y });
}

function intent(overrides: Partial<PlayerIntent> = {}): PlayerIntent {
  return {
    move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
    evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
    kitPressed: false, pausePressed: false, restartPressed: false,
    ...overrides,
  };
}
