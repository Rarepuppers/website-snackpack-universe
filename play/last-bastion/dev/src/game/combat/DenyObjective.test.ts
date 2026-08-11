import { describe, expect, it } from "vitest";
import { createDenyObjective, stepDenyObjective } from "./DenyObjective";

const TERMINALS = [
  { id: 1, position: { x: 2, y: 2 } },
  { id: 2, position: { x: 6, y: 2 } },
  { id: 3, position: { x: 4, y: 6 } },
];

describe("deny objective", () => {
  it("builds corruption for each live channel", () => {
    const next = stepDenyObjective(createDenyObjective(TERMINALS), {
      deltaSeconds: 2,
      liveTerminalIds: new Set([1, 2, 3]),
    });
    expect(next.corruption).toBeCloseTo(0.132);
  });

  it("completes when every channel is interrupted", () => {
    const next = stepDenyObjective(createDenyObjective(TERMINALS), {
      deltaSeconds: 1,
      liveTerminalIds: new Set(),
    });
    expect(next.status).toBe("complete");
  });

  it("fails when corruption reaches the terminal", () => {
    let state = createDenyObjective(TERMINALS);
    state = stepDenyObjective(state, { deltaSeconds: 20, liveTerminalIds: new Set([1, 2, 3]) });
    expect(state.status).toBe("failed");
    expect(state.corruption).toBe(1);
  });
});
