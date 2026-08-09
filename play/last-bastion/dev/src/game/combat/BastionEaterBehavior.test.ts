import { describe, expect, it } from "vitest";
import {
  bastionEaterChargeDestination,
  resolveBastionEaterActionChoice,
  stepBastionEaterBehavior,
  type BastionEaterState,
} from "./BastionEaterBehavior";

const BASE: BastionEaterState = {
  phase: "breach",
  action: "stalk",
  actionRemainingSeconds: 0.05,
  direction: { x: 0, y: 0 },
  target: { x: 0, y: 0 },
  attackCount: 0,
};

function step(state: BastionEaterState, health = 100, chargeBlocked = false) {
  return stepBastionEaterBehavior(state, {
    deltaSeconds: 0.05,
    health,
    maxHealth: 100,
    position: { x: 0, y: 0 },
    playerPosition: { x: 4, y: 0 },
    baseMovementSpeedMetresPerSecond: 0.9,
    chargeBlocked,
  });
}

describe("BastionEaterBehavior", () => {
  it("changes health phase before advancing the previous action", () => {
    const result = step({ ...BASE, action: "charge" }, 60);
    expect(result.state).toMatchObject({ phase: "brood", action: "entrance", actionRemainingSeconds: 0.8 });
    expect(result.action).toEqual({ kind: "phase-change", phase: "brood" });
    expect(result.movement).toEqual({ kind: "none" });
  });

  it("requests attack choice after final stalk movement and locks from the resolved position", () => {
    const result = step(BASE);
    expect(result.requestsActionChoice).toBe(true);
    expect(result.movement).toMatchObject({ kind: "fixed", speedMetresPerSecond: 0.9 });
    const resolved = resolveBastionEaterActionChoice(result.state, { x: 1, y: 0 }, { x: 1, y: 4 });
    expect(resolved.state).toMatchObject({
      action: "claw-windup",
      direction: { x: 0, y: 1 },
      target: { x: 1, y: 4 },
      attackCount: 1,
    });
    expect(resolved.action).toEqual({ kind: "claw-warning" });
  });

  it("preserves each phase's authored attack rotation", () => {
    expect(resolveBastionEaterActionChoice({ ...BASE, phase: "breach", attackCount: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }).state.action)
      .toBe("charge-windup");
    expect(resolveBastionEaterActionChoice({ ...BASE, phase: "brood", attackCount: 2 }, { x: 0, y: 0 }, { x: 1, y: 0 }).state.action)
      .toBe("egg-windup");
    expect(resolveBastionEaterActionChoice({ ...BASE, phase: "last-stand", attackCount: 3 }, { x: 0, y: 0 }, { x: 1, y: 0 }).state.action)
      .toBe("breach-windup");
  });

  it("probes last-stand charges and stops immediately on impact", () => {
    const charge = { ...BASE, phase: "last-stand" as const, action: "charge" as const, direction: { x: 1, y: 0 } };
    expect(bastionEaterChargeDestination(charge, { x: 2, y: 3 }, 0.05)).toEqual({ x: 2.46, y: 3 });
    const blocked = step(charge, 20, true);
    expect(blocked.action).toEqual({ kind: "charge-impact" });
    expect(blocked.state).toMatchObject({ action: "recovery", actionRemainingSeconds: 0.55 });
    expect(blocked.movement).toEqual({ kind: "none" });
  });
});
