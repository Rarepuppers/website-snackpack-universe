import { describe, expect, it } from "vitest";
import type { PlayerIntent } from "../input/PlayerIntent";
import { CombatSimulation, type PowerupType } from "./CombatSimulation";

const DEDICATED_TYPES = [
  "siege-loader",
  "phase-jacket",
  "hunter-optics",
  "last-stand-stimulant",
  "emp-charge",
  "butchers-serum",
] as const satisfies readonly PowerupType[];

const IDLE: PlayerIntent = {
  move: { x: 0, y: 0 },
  aim: { x: 1, y: 0 },
  fireHeld: false,
  evasiveMovePressed: false,
  interactPressed: false,
  ultimatePressed: false,
  kitPressed: false,
  pausePressed: false,
  restartPressed: false,
};

describe("power-up identity review lab", () => {
  it("exposes every dedicated identity as a world pickup without starting waves", () => {
    const simulation = new CombatSimulation({ scenario: "powerup-identity" });
    const snapshot = simulation.snapshot();

    expect(snapshot.status).toBe("combat");
    expect(snapshot.enemies).toHaveLength(0);
    expect(snapshot.powerups.map(({ type }) => type)).toEqual(DEDICATED_TYPES);
  });

  it("fills the HUD tray with the five genuinely timed dedicated effects", () => {
    const simulation = new CombatSimulation({ scenario: "powerup-identity" });
    const initial = simulation.snapshot().activeBuffs;
    const activeTypes = initial.map(({ type }) => type);

    expect(activeTypes).toEqual(DEDICATED_TYPES.filter((type) => type !== "emp-charge"));
    expect(activeTypes).toHaveLength(5);

    for (let tick = 0; tick < 200; tick += 1) simulation.step(IDLE, 0.05);
    expect(simulation.snapshot().activeBuffs).toEqual(initial);
  });
});
