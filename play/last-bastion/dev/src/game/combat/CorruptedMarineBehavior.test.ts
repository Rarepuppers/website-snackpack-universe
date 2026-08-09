import { describe, expect, it } from "vitest";
import {
  CORRUPTED_MARINE_COOLDOWN_SECONDS,
  CORRUPTED_MARINE_RECOVERY_SECONDS,
  CORRUPTED_MARINE_WINDUP_SECONDS,
  resolveCorruptedMarineAfterMovement,
  stepCorruptedMarineBehavior,
  type CorruptedMarineBehaviorState,
} from "./CorruptedMarineBehavior";

const POSITIONING: CorruptedMarineBehaviorState = {
  phase: "positioning",
  phaseRemainingSeconds: 0,
  attackCooldownSeconds: 0,
  lockedTarget: { x: 0, y: 0 },
};

describe("CorruptedMarineBehavior", () => {
  it("locks only after post-movement range and cooldown checks", () => {
    const step = stepCorruptedMarineBehavior(POSITIONING, {
      deltaSeconds: 0.05,
      position: { x: 0, y: 0 },
      playerPosition: { x: 11.1, y: 0 },
      projectileSlotAvailable: true,
    });
    expect(step.movement.kind).toBe("range-band");
    expect(resolveCorruptedMarineAfterMovement(step.state, { x: 0, y: 0 }, { x: 11.1, y: 0 }).warningStarted)
      .toBe(false);
    const locked = resolveCorruptedMarineAfterMovement(step.state, { x: 0.2, y: 0 }, { x: 11.1, y: 0 });
    expect(locked.warningStarted).toBe(true);
    expect(locked.state).toMatchObject({ phase: "windup", phaseRemainingSeconds: CORRUPTED_MARINE_WINDUP_SECONDS });
  });

  it("holds for projectile capacity, then throws and recovers", () => {
    const windup = { ...POSITIONING, phase: "windup" as const, phaseRemainingSeconds: 0.01 };
    const held = stepCorruptedMarineBehavior(windup, {
      deltaSeconds: 0.05,
      position: { x: 0, y: 0 }, playerPosition: { x: 8, y: 0 }, projectileSlotAvailable: false,
    });
    expect(held.state.phaseRemainingSeconds).toBe(0.1);
    expect(held.firesKnife).toBe(false);
    const thrown = stepCorruptedMarineBehavior(held.state, {
      deltaSeconds: 0.1,
      position: { x: 0, y: 0 }, playerPosition: { x: 8, y: 0 }, projectileSlotAvailable: true,
    });
    expect(thrown.state).toMatchObject({ phase: "throw", attackCooldownSeconds: CORRUPTED_MARINE_COOLDOWN_SECONDS });
    expect(thrown.firesKnife).toBe(true);
    const recovery = stepCorruptedMarineBehavior({ ...thrown.state, phaseRemainingSeconds: 0.01 }, {
      deltaSeconds: 0.05,
      position: { x: 0, y: 0 }, playerPosition: { x: 8, y: 0 }, projectileSlotAvailable: true,
    });
    expect(recovery.state).toMatchObject({ phase: "recovery", phaseRemainingSeconds: CORRUPTED_MARINE_RECOVERY_SECONDS });
  });
});
