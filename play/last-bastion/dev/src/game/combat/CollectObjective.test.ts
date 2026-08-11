import { describe, expect, it } from "vitest";
import { createCollectObjective, stepCollectObjective } from "./CollectObjective";

describe("collect objective", () => {
  it("collects only pickups inside the player radius", () => {
    const result = stepCollectObjective(createCollectObjective([{ x: 2, y: 2 }, { x: 8, y: 8 }]), {
      deltaSeconds: 0.05,
      playerPosition: { x: 2.5, y: 2 },
    });
    expect(result.collectedIds).toEqual([1]);
    expect(result.state.pickups.map(({ collected }) => collected)).toEqual([true, false]);
  });

  it("completes after the final pickup", () => {
    const result = stepCollectObjective(createCollectObjective([{ x: 2, y: 2 }]), {
      deltaSeconds: 0.05,
      playerPosition: { x: 2, y: 2 },
    });
    expect(result.state.status).toBe("complete");
  });

  it("fails when time expires with pickups remaining", () => {
    const result = stepCollectObjective(createCollectObjective([{ x: 2, y: 2 }], 1), {
      deltaSeconds: 2,
      playerPosition: { x: 9, y: 9 },
    });
    expect(result.state.status).toBe("failed");
  });
});
