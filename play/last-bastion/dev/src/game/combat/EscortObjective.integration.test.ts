import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation } from "./CombatSimulation";

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 }, aim: { x: 1, y: 0 }, fireHeld: false,
  evasiveMovePressed: false, interactPressed: false, ultimatePressed: false,
  kitPressed: false, pausePressed: false, restartPressed: false,
};

describe("escort objective integration", () => {
  it("exposes pressure, health, progress, failure, and an objective reward", () => {
    const pressured = new CombatSimulation({ scenario: "escort-objective", autoStartWaves: false });
    const initial = pressured.snapshot().escortObjective!;
    for (let frame = 0; frame < 30; frame += 1) pressured.step(IDLE, 0.05);
    expect(pressured.snapshot().escortObjective!.health).toBeLessThan(initial.health);

    const cleared = new CombatSimulation({ scenario: "escort-objective", autoStartWaves: false });
    for (const enemy of cleared.snapshot().enemies) cleared.dealDamage(enemy.id, 10_000);
    let snapshot = cleared.snapshot();
    for (let frame = 0; frame < 800 && snapshot.status === "combat"; frame += 1) {
      snapshot = cleared.step(IDLE, 0.05);
    }
    expect(snapshot.status).toBe("victory");
    expect(snapshot.escortObjective?.progress).toBe(1);
    expect(snapshot.pendingDecision?.title).toBe("OBJECTIVE SECURED — CHOOSE A RELIC");
    expect(snapshot.runMetrics.scrapEarned).toBeGreaterThanOrEqual(25);
  });
});
