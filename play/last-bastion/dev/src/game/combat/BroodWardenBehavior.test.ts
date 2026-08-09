import { describe, expect, it } from "vitest";
import { stepBroodWardenBehavior, type BroodWardenState } from "./BroodWardenBehavior";

const BASE: BroodWardenState = {
  phase: "stalk",
  phaseRemainingSeconds: 0.05,
  direction: { x: 0, y: 0 },
  attackCount: 0,
  rushUsed: false,
};

function step(state: BroodWardenState, health = 100, position = { x: 0, y: 0 }) {
  return stepBroodWardenBehavior(state, {
    deltaSeconds: 0.05,
    enemyId: 1,
    health,
    maxHealth: 100,
    position,
    playerPosition: { x: 2.6, y: 0 },
  });
}

describe("BroodWardenBehavior", () => {
  it("chooses cleave, acid, and egg windups from its authored attack cycle", () => {
    expect(step(BASE).state).toMatchObject({ phase: "cleave-windup", attackCount: 1 });
    expect(step({ ...BASE, attackCount: 1 }).state).toMatchObject({ phase: "acid-windup", attackCount: 2 });
    expect(step({ ...BASE, attackCount: 2 }).state).toMatchObject({ phase: "egg-windup", attackCount: 3 });
  });

  it("prioritizes the one-time enrage rush and moves on its final rush tick", () => {
    const windup = step(BASE, 49);
    expect(windup.state).toMatchObject({ phase: "rush-windup", direction: { x: 1, y: 0 } });
    const begun = step({ ...windup.state, phaseRemainingSeconds: 0.05 }, 49);
    expect(begun.action).toEqual({ kind: "swarm-rush", count: 4 });
    const finished = step({ ...begun.state, phaseRemainingSeconds: 0.05 }, 49);
    expect(finished.state.phase).toBe("recovery");
    expect(finished.movement).toMatchObject({ kind: "fixed", speedMetresPerSecond: 6.8 });
  });

  it("emits tier-scaled action payloads from completed tells", () => {
    expect(step({ ...BASE, phase: "cleave-windup" }, 20).action)
      .toEqual({ kind: "cleave", radiusMetres: 3, enrageTier: 2 });
    expect(step({ ...BASE, phase: "acid-windup" }, 20).action)
      .toEqual({ kind: "acid-volley", count: 5 });
    expect(step({ ...BASE, phase: "egg-windup" }, 20).action)
      .toEqual({ kind: "lay-eggs", count: 3 });
  });
});
