import { describe, expect, it } from "vitest";
import { stepRiftStalkerBehavior, type RiftStalkerState } from "./RiftStalkerBehavior";

const BASE: RiftStalkerState = {
  phase: "cloak",
  phaseRemainingSeconds: 0.05,
  direction: { x: 0, y: 0 },
  markTarget: { x: 0, y: 0 },
  chainedThisCycle: false,
};

function step(state: RiftStalkerState, health = 100, position = { x: 0, y: 0 }) {
  return stepRiftStalkerBehavior(state, {
    deltaSeconds: 0.05,
    enemyId: 1,
    health,
    maxHealth: 100,
    position,
    playerPosition: { x: 3, y: 0 },
  });
}

describe("RiftStalkerBehavior", () => {
  it("moves on the final cloak tick, locks a mark, then warps and pounces", () => {
    const marked = step(BASE);
    expect(marked.movement.kind).toBe("fixed");
    expect(marked.action).toEqual({ kind: "mark" });
    expect(marked.state).toMatchObject({ phase: "mark", markTarget: { x: 3, y: 0 } });
    const warped = step({ ...marked.state, phaseRemainingSeconds: 0.05 });
    expect(warped.action).toEqual({ kind: "warp-out" });
    expect(warped.state.phase).toBe("warp");
    const pounced = step({ ...warped.state, phaseRemainingSeconds: 0.05 });
    expect(pounced.action).toEqual({ kind: "pounce", frenzyTier: 0 });
    expect(pounced.facingDirection).toBeNull();
  });

  it("chains one frenzy mark before choosing a locked slash", () => {
    const chained = step({ ...BASE, phase: "pounce" }, 20);
    expect(chained.action).toEqual({ kind: "mark" });
    expect(chained.state).toMatchObject({ phase: "mark", chainedThisCycle: true });
    const slashTell = step({
      ...BASE,
      phase: "pounce",
      chainedThisCycle: true,
      phaseRemainingSeconds: 0.05,
    }, 20, { x: 1, y: 0 });
    expect(slashTell.state).toMatchObject({ phase: "slash-windup", direction: { x: 1, y: 0 } });
    const slash = step({ ...slashTell.state, phaseRemainingSeconds: 0.05 }, 20);
    expect(slash.action).toEqual({ kind: "slash", frenzyTier: 2 });
  });

  it("clears the frenzy-chain latch throughout recovery", () => {
    const result = step({
      ...BASE,
      phase: "recovery",
      phaseRemainingSeconds: 0.2,
      chainedThisCycle: true,
    }, 20);
    expect(result.state).toMatchObject({ phase: "recovery", chainedThisCycle: false });
    expect(result.movement).toEqual({ kind: "none" });
  });
});
