import { describe, expect, it } from "vitest";
import { createEscortObjective, stepEscortObjective } from "./EscortObjective";

describe("escort objective", () => {
  it("moves through every waypoint and completes without hostiles", () => {
    let state = createEscortObjective([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }]);
    state = stepEscortObjective(state, { deltaSeconds: 2, nearbyHostiles: 0 });
    expect(state.status).toBe("complete");
    expect(state.position).toEqual({ x: 1, y: 1 });
    expect(state.progress).toBe(1);
  });

  it("stops and takes proportional damage while its lane is occupied", () => {
    const state = createEscortObjective([{ x: 0, y: 0 }, { x: 10, y: 0 }], 20);
    const pressured = stepEscortObjective(state, { deltaSeconds: 1, nearbyHostiles: 2 });
    expect(pressured.position).toEqual({ x: 0, y: 0 });
    expect(pressured.health).toBe(15);
    expect(pressured.underAttack).toBe(true);
  });

  it("fails at zero health and remains terminal", () => {
    let state = createEscortObjective([{ x: 0, y: 0 }, { x: 10, y: 0 }], 5);
    state = stepEscortObjective(state, { deltaSeconds: 1, nearbyHostiles: 2 });
    expect(state.status).toBe("failed");
    expect(stepEscortObjective(state, { deltaSeconds: 10, nearbyHostiles: 0 })).toBe(state);
  });
});
