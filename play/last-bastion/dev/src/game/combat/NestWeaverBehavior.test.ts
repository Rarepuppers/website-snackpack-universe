import { describe, expect, it } from "vitest";
import {
  NEST_WEAVER_POSITIONING_SECONDS,
  NEST_WEAVER_RECOVERY_SECONDS,
  NEST_WEAVER_RETRY_SECONDS,
  resolveNestWeaverPlacement,
  stepNestWeaverBehavior,
  type NestWeaverBehaviorState,
} from "./NestWeaverBehavior";

const POSITIONING: NestWeaverBehaviorState = { phase: "positioning", phaseRemainingSeconds: 0.1 };

function step(state: NestWeaverBehaviorState, position = { x: 0, y: 0 }) {
  return stepNestWeaverBehavior(state, {
    deltaSeconds: 0.1,
    position,
    playerPosition: { x: 6, y: 0 },
    movementSpeedMetresPerSecond: 2,
    pendingReservationAvailable: false,
  });
}

describe("NestWeaverBehavior", () => {
  it("holds its preferred band and requests placement after movement", () => {
    const comfortable = step(POSITIONING);
    expect(comfortable.movement).toEqual({ kind: "none" });
    expect(comfortable.requestsPlacement).toBe(true);

    expect(step({ ...POSITIONING, phaseRemainingSeconds: 1 }, { x: -4, y: 0 }).movement)
      .toMatchObject({ kind: "fixed", direction: { x: 1, y: 0 }, speedMetresPerSecond: 2 });
    const retreat = step({ ...POSITIONING, phaseRemainingSeconds: 1 }, { x: 3, y: 0 }).movement;
    expect(retreat).toMatchObject({ kind: "fixed", speedMetresPerSecond: 2 });
    if (retreat.kind !== "fixed") throw new Error("expected fixed retreat movement");
    expect(retreat.direction.x).toBe(-1);
    expect(Math.abs(retreat.direction.y)).toBe(0);
  });

  it("retries rejected reservations and commits accepted windups", () => {
    const due = step(POSITIONING).state;
    expect(resolveNestWeaverPlacement(due, false)).toEqual({
      phase: "positioning",
      phaseRemainingSeconds: NEST_WEAVER_RETRY_SECONDS,
    });
    expect(resolveNestWeaverPlacement(due, true)).toEqual({
      phase: "placement-windup",
      phaseRemainingSeconds: 0.85,
    });
  });

  it("lays a reserved pod, recovers, then resumes positioning", () => {
    const windup = stepNestWeaverBehavior(
      { phase: "placement-windup", phaseRemainingSeconds: 0.05 },
      {
        deltaSeconds: 0.05,
        position: { x: 0, y: 0 },
        playerPosition: { x: 6, y: 0 },
        movementSpeedMetresPerSecond: 2,
        pendingReservationAvailable: true,
      },
    );
    expect(windup.laysPod).toBe(true);
    expect(windup.state).toEqual({ phase: "recovery", phaseRemainingSeconds: NEST_WEAVER_RECOVERY_SECONDS });
    expect(step({ phase: "recovery", phaseRemainingSeconds: 0.05 }).state).toEqual({
      phase: "positioning",
      phaseRemainingSeconds: NEST_WEAVER_POSITIONING_SECONDS,
    });
  });
});
