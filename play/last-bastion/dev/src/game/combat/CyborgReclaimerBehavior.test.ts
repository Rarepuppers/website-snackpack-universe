import { describe, expect, it } from "vitest";
import { stepCyborgReclaimerBehavior, selectReclaimerMovementTarget } from "./CyborgReclaimerBehavior";
import {
  RECLAIMER_CHANNEL_SECONDS,
  createReclaimerRepairBehavior,
  type ReclaimerRepairTarget,
} from "./CyborgReclaimerRepair";

function machine(overrides: Partial<ReclaimerRepairTarget> = {}): ReclaimerRepairTarget {
  return {
    id: 2,
    type: "arc-warden",
    position: { x: 4, y: 0 },
    health: 4,
    maxHealth: 8,
    dead: false,
    machine: true,
    rank: "standard",
    ...overrides,
  };
}

function input(overrides: Partial<Parameters<typeof stepCyborgReclaimerBehavior>[1]> = {}) {
  return {
    deltaSeconds: 0.1,
    ownerId: 1,
    ownerPosition: { x: 0, y: 0 },
    playerPosition: { x: 10, y: 0 },
    movementSpeedMetresPerSecond: 2,
    lockedTarget: null,
    repairTargets: [machine()],
    activeLinkOwnerId: null,
    ownerWasDamaged: false,
    ...overrides,
  };
}

describe("CyborgReclaimerBehavior", () => {
  it("starts an eligible repair and faces its locked target", () => {
    const state = { ...createReclaimerRepairBehavior(), cooldownSeconds: 0 };
    const stepped = stepCyborgReclaimerBehavior(state, input());
    expect(stepped.state).toMatchObject({
      phase: "channel",
      phaseRemainingSeconds: RECLAIMER_CHANNEL_SECONDS,
      targetId: 2,
    });
    expect(stepped.startedTarget?.id).toBe(2);
    expect(stepped.facingDirection).toEqual({ x: 1, y: 0 });
    expect(stepped.movement).toEqual({ kind: "none" });
  });

  it("pursues the nearest damaged machine while repair acquisition is unavailable", () => {
    const near = machine({ id: 4, position: { x: 3, y: 0 } });
    const far = machine({ id: 3, position: { x: 5, y: 0 } });
    expect(selectReclaimerMovementTarget(1, { x: 0, y: 0 }, [far, near])?.id).toBe(4);
    const stepped = stepCyborgReclaimerBehavior(createReclaimerRepairBehavior(), input({
      repairTargets: [far, near],
      activeLinkOwnerId: 99,
    }));
    expect(stepped.startedTarget).toBeNull();
    expect(stepped.movement).toMatchObject({ kind: "fixed", direction: { x: 1, y: 0 } });
  });

  it("falls back to player pursuit and holds still during recovery", () => {
    const seeking = stepCyborgReclaimerBehavior(createReclaimerRepairBehavior(), input({ repairTargets: [] }));
    expect(seeking.movement).toMatchObject({ kind: "fixed", direction: { x: 1, y: 0 } });
    const recovery = stepCyborgReclaimerBehavior(
      { ...createReclaimerRepairBehavior(), phase: "recovery", phaseRemainingSeconds: 0.5 },
      input({ repairTargets: [] }),
    );
    expect(recovery.movement).toEqual({ kind: "none" });
    expect(recovery.facingDirection).toBeNull();
  });
});
