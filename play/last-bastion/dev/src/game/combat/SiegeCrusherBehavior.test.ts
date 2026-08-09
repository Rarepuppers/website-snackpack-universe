import { describe, expect, it } from "vitest";
import {
  siegeCrusherChargeDestination,
  stepSiegeCrusherBehavior,
  type SiegeCrusherState,
} from "./SiegeCrusherBehavior";

const BASE: SiegeCrusherState = {
  phase: "stalk",
  phaseRemainingSeconds: 0.05,
  direction: { x: 0, y: 0 },
  attackCount: 0,
};

function step(state: SiegeCrusherState, health = 100, chargeBlocked = false) {
  return stepSiegeCrusherBehavior(state, {
    deltaSeconds: 0.05,
    enemyId: 2,
    health,
    maxHealth: 100,
    position: { x: 0, y: 0 },
    playerPosition: { x: 5, y: 0 },
    chargeBlocked,
  });
}

describe("SiegeCrusherBehavior", () => {
  it("locks a charge direction after completing its final repositioning tick", () => {
    const result = step(BASE);
    expect(result.state).toMatchObject({
      phase: "charge-windup",
      direction: { x: 1, y: 0 },
      attackCount: 1,
    });
    expect(result.movement).toMatchObject({ kind: "fixed", speedMetresPerSecond: 1.4 });
    expect(result.facingDirection).toEqual({ x: 1, y: 0 });
  });

  it("probes the tier-scaled charge destination and stops on an obstacle impact", () => {
    const charge = { ...BASE, phase: "charge" as const, direction: { x: 1, y: 0 } };
    expect(siegeCrusherChargeDestination(charge, {
      deltaSeconds: 0.05,
      health: 20,
      maxHealth: 100,
      position: { x: 2, y: 3 },
    })).toEqual({ x: 2.54, y: 3 });
    const blocked = step(charge, 20, true);
    expect(blocked.action).toEqual({ kind: "charge-impact" });
    expect(blocked.state).toMatchObject({ phase: "recovery", phaseRemainingSeconds: 0.7 });
    expect(blocked.movement).toEqual({ kind: "none" });
  });

  it("emits tier-scaled sweep and slam payloads", () => {
    expect(step({ ...BASE, phase: "sweep-windup" }, 20).action)
      .toEqual({ kind: "sweep", radiusMetres: 3.1, enrageTier: 2 });
    expect(step({ ...BASE, phase: "slam-windup" }, 20).action)
      .toEqual({ kind: "slam", radiusMetres: 4, enrageTier: 2 });
  });
});
