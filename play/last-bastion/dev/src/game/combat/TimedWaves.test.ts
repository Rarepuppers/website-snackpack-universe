import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
};

function choosePending(simulation: CombatSimulation): void {
  const decision = simulation.snapshot().pendingDecision;
  if (!decision) return;
  const option = decision.kind === "scrap-shop"
    ? decision.options.find((candidate) => candidate.id === "shop-leave")
    : decision.options.find((candidate) => candidate.affordable !== false);
  if (option) simulation.chooseOption(option.id);
}

function removeAllEnemies(simulation: CombatSimulation): void {
  for (const enemy of simulation.snapshot().enemies) simulation.dealDamage(enemy.id, 100_000);
}

describe("timed wave lifecycle", () => {
  it("keeps wave three alive until 30 seconds and spends its full budget", () => {
    const simulation = new CombatSimulation({ seed: 412 });
    for (let frame = 0; frame < 1_200; frame += 1) {
      choosePending(simulation);
      const snapshot = simulation.step(IDLE, 0.05);
      removeAllEnemies(simulation);
      if (snapshot.waveNumber === 3 && snapshot.status === "combat") break;
    }

    expect(simulation.snapshot().waveNumber).toBe(3);
    for (let frame = 0; frame < 580; frame += 1) {
      simulation.step(IDLE, 0.05);
      removeAllEnemies(simulation);
    }
    let snapshot = simulation.snapshot();
    expect(snapshot.status).toBe("combat");
    expect(snapshot.density.waveDurationSeconds).toBe(30);
    expect(snapshot.density.threatSpawned).toBe(snapshot.density.threatBudget);

    for (let frame = 0; frame < 25 && simulation.snapshot().status === "combat"; frame += 1) {
      simulation.step(IDLE, 0.05);
      removeAllEnemies(simulation);
    }
    snapshot = simulation.snapshot();
    expect(snapshot.status).toBe("intermission");
    expect(snapshot.density.waveElapsedSeconds).toBeGreaterThanOrEqual(30);
  });
});
