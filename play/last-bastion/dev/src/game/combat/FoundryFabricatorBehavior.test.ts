import { describe, expect, it } from "vitest";
import {
  resolveFoundryFabricationRequest,
  stepFoundryFabricatorBehavior,
} from "./FoundryFabricatorBehavior";
import { createFoundryFabricatorBehavior, type FoundryChildReservation } from "./FoundryFabricatorLifecycle";

const DRONE_RESERVATION: FoundryChildReservation = {
  childType: "foundry-drone",
  reservedThreat: 2,
  reservedLiveSlots: 1,
};

describe("FoundryFabricatorBehavior", () => {
  it("requests only on an established positioning tick and alternates child type", () => {
    expect(stepFoundryFabricatorBehavior(createFoundryFabricatorBehavior(), 0.1, false).requestedChildType)
      .toBe("foundry-drone");
    expect(stepFoundryFabricatorBehavior(
      { ...createFoundryFabricatorBehavior(), chargesRemaining: 2 },
      0.1,
      false,
    ).requestedChildType).toBe("foundry-turret");
    const leavesRecovery = stepFoundryFabricatorBehavior({
      ...createFoundryFabricatorBehavior(),
      phase: "recovery",
      phaseRemainingSeconds: 0.05,
    }, 0.05, false);
    expect(leavesRecovery.state.phase).toBe("positioning");
    expect(leavesRecovery.requestedChildType).toBeNull();
  });

  it("pursues the player only when a shared-capacity request is rejected out of range", () => {
    const state = createFoundryFabricatorBehavior();
    const far = resolveFoundryFabricationRequest(state, {
      position: { x: 0, y: 0 }, playerPosition: { x: 10, y: 0 }, movementSpeedMetresPerSecond: 2,
      arenaWidthMetres: 30, arenaHeightMetres: 20, reservation: null,
    });
    expect(far.facingDirection).toEqual({ x: 1, y: 0 });
    expect(far.movement).toMatchObject({ kind: "fixed", direction: { x: 1, y: 0 } });
    const near = resolveFoundryFabricationRequest(state, {
      position: { x: 4, y: 0 }, playerPosition: { x: 10, y: 0 }, movementSpeedMetresPerSecond: 2,
      arenaWidthMetres: 30, arenaHeightMetres: 20, reservation: null,
    });
    expect(near.movement).toEqual({ kind: "none" });
  });

  it("locks an alternating bounded pad target for an accepted reservation", () => {
    const state = { ...createFoundryFabricatorBehavior(), chargesRemaining: 2 };
    const result = resolveFoundryFabricationRequest(state, {
      position: { x: 1, y: 19.8 }, playerPosition: { x: 10, y: 10 }, movementSpeedMetresPerSecond: 2,
      arenaWidthMetres: 30, arenaHeightMetres: 20, reservation: DRONE_RESERVATION,
    });
    expect(result.state).toMatchObject({ phase: "channel", target: { x: 0.7, y: 19.3 } });
    expect(result.startedFabrication).toMatchObject({ target: { x: 0.7, y: 19.3 } });
    expect(result.movement).toEqual({ kind: "none" });
  });
});
