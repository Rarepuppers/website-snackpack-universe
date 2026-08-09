import { describe, expect, it } from "vitest";
import { stepArcWardenCombatBehavior } from "./ArcWardenBehavior";
import { createArcWardenBehavior } from "./ArcWardenBeam";

function step(position: { x: number; y: number }, enemyId = 1) {
  return stepArcWardenCombatBehavior(createArcWardenBehavior(), {
    deltaSeconds: 0.1,
    enemyId,
    position,
    playerPosition: { x: 10, y: 0 },
    obstacles: [],
    movementSpeedMetresPerSecond: 2,
  });
}

describe("ArcWardenBehavior", () => {
  it("approaches beyond eight metres and retreats inside 4.5 metres", () => {
    expect(step({ x: 0, y: 0 }).movement)
      .toMatchObject({ kind: "fixed", direction: { x: 1, y: 0 }, speedMetresPerSecond: 2 });
    const retreat = step({ x: 7, y: 0 }).movement;
    expect(retreat).toMatchObject({ kind: "fixed", speedMetresPerSecond: 2 });
    if (retreat.kind !== "fixed") throw new Error("expected fixed retreat movement");
    expect(retreat.direction.x).toBe(-1);
    expect(Math.abs(retreat.direction.y)).toBe(0);
  });

  it("strafes deterministically inside the preferred band while facing the player", () => {
    const odd = step({ x: 4, y: 0 }, 1);
    const even = step({ x: 4, y: 0 }, 2);
    expect(odd.facingDirection).toEqual({ x: 1, y: 0 });
    expect(odd.movement).toMatchObject({ kind: "fixed", direction: { x: 0, y: -1 } });
    expect(even.movement).toMatchObject({ kind: "fixed" });
    if (even.movement.kind !== "fixed") throw new Error("expected fixed strafe movement");
    expect(Math.abs(even.movement.direction.x)).toBe(0);
    expect(even.movement.direction.y).toBe(1);
  });

  it("locks its lane, starts one warning, and holds movement while charging", () => {
    const state = { ...createArcWardenBehavior(), cooldownSeconds: 0 };
    const result = stepArcWardenCombatBehavior(state, {
      deltaSeconds: 0.1,
      enemyId: 1,
      position: { x: 4, y: 0 },
      playerPosition: { x: 10, y: 0 },
      obstacles: [],
      movementSpeedMetresPerSecond: 2,
    });
    expect(result.warningStarted).toBe(true);
    expect(result.state.phase).toBe("charge");
    expect(result.facingDirection).toEqual({ x: 1, y: 0 });
    expect(result.movement).toEqual({ kind: "none" });
  });
});
