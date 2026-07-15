import { describe, expect, it } from "vitest";
import { HeroStateMachine } from "./HeroStateMachine";

describe("HeroStateMachine", () => {
  it("travels the configured distance and ends the evasive move", () => {
    const machine = new HeroStateMachine();
    const stats = {
      durationSeconds: 0.5,
      distanceMetres: 4,
      invulnerabilitySeconds: 0.2,
    };
    let totalDistance = 0;

    expect(machine.startEvasiveMove({ x: 1, y: 0 }, stats)).toBe(true);

    for (let index = 0; index < 5; index += 1) {
      totalDistance += machine.update(0.1, { x: 0, y: 0 }).displacementMetres.x;
    }

    expect(totalDistance).toBeCloseTo(4);
    expect(machine.currentState).toBe("idle");
  });

  it("does not restart while already evading", () => {
    const machine = new HeroStateMachine();
    const stats = {
      durationSeconds: 0.5,
      distanceMetres: 4,
      invulnerabilitySeconds: 0.2,
    };

    expect(machine.startEvasiveMove({ x: 1, y: 0 }, stats)).toBe(true);
    expect(machine.startEvasiveMove({ x: 0, y: 1 }, stats)).toBe(false);
  });
});
