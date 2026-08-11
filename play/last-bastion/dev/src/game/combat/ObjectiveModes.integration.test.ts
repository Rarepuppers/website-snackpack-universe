import { describe, expect, it } from "vitest";
import type { ArenaDefinition } from "../arena/ArenaDefinition";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation } from "./CombatSimulation";
import { expeditionEncounterForNode, type ExpeditionEncounterDescriptor } from "../expedition/ExpeditionEncounter";
import { generateExpeditionMap } from "../expedition/ExpeditionMap";

const EMPTY_ARENA: ArenaDefinition = {
  id: "objective-test",
  widthMetres: 45,
  heightMetres: 25.3125,
  tileSizeMetres: 1,
  obstacles: [],
};

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
};

describe("expanded objective mode integration", () => {
  it("activates seeded objective modifiers in ordinary expedition combat", () => {
    const descriptors: ExpeditionEncounterDescriptor[] = [];
    for (let seed = 1; seed <= 80 && descriptors.length < 3; seed += 1) {
      const map = generateExpeditionMap(seed);
      for (const node of map.nodes) {
        const descriptor = expeditionEncounterForNode(map.seed, node);
        if (descriptor.objectiveMode && !descriptors.some(({ objectiveMode }) => objectiveMode === descriptor.objectiveMode)) {
          descriptors.push(descriptor);
        }
      }
    }
    expect(descriptors.map(({ objectiveMode }) => objectiveMode).sort()).toEqual(["collect", "deny", "escort"]);
    for (const descriptor of descriptors) {
      const snapshot = new CombatSimulation({ expeditionEncounter: descriptor, arena: EMPTY_ARENA }).snapshot();
      expect(Boolean(snapshot.escortObjective || snapshot.denyObjective || snapshot.collectObjective)).toBe(true);
    }
  });

  it("completes Deny after every channel anchor is destroyed", () => {
    const simulation = new CombatSimulation({ scenario: "deny-objective", autoStartWaves: false, arena: EMPTY_ARENA });
    const initial = simulation.snapshot().denyObjective!;
    expect(initial.terminals).toHaveLength(3);
    simulation.step(IDLE, 0.05);
    expect(simulation.snapshot().denyObjective!.corruption).toBeGreaterThan(0);
    for (const terminal of initial.terminals) simulation.dealDamage(terminal.id, 10_000);
    const snapshot = simulation.step(IDLE, 0.05);
    expect(snapshot.status).toBe("victory");
    expect(snapshot.denyObjective?.status).toBe("complete");
    expect(snapshot.pendingDecision?.title).toBe("OBJECTIVE SECURED — CHOOSE A RELIC");
  });

  it("collects a timed route and awards the objective reward", () => {
    const simulation = new CombatSimulation({ scenario: "collect-objective", autoStartWaves: false, arena: EMPTY_ARENA });
    for (const enemy of simulation.snapshot().enemies) simulation.dealDamage(enemy.id, 10_000);
    let snapshot = simulation.snapshot();
    for (let frame = 0; frame < 1_600 && snapshot.status === "combat"; frame += 1) {
      const target = snapshot.collectObjective!.pickups.find((pickup) => !pickup.collected)!.position;
      const dx = target.x - snapshot.playerPosition.x;
      const dy = target.y - snapshot.playerPosition.y;
      const length = Math.hypot(dx, dy) || 1;
      snapshot = simulation.step({ ...IDLE, move: { x: dx / length, y: dy / length } }, 0.05);
    }
    expect(snapshot.status).toBe("victory");
    expect(snapshot.collectObjective?.collected).toBe(snapshot.collectObjective?.total);
    expect(snapshot.pendingDecision?.title).toBe("OBJECTIVE SECURED — CHOOSE A RELIC");
    expect(snapshot.runMetrics.scrapEarned).toBeGreaterThanOrEqual(25);
  });
});
