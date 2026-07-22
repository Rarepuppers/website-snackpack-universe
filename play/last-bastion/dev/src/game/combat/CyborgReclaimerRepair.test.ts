import { describe, expect, it } from "vitest";
import {
  RECLAIMER_CHANNEL_SECONDS,
  RECLAIMER_PATCH_CHARGES,
  applyReclaimerRepair,
  createReclaimerRepairBehavior,
  selectReclaimerRepairTarget,
  stepReclaimerRepair,
  tryBeginReclaimerRepair,
  type ReclaimerRepairTarget,
} from "./CyborgReclaimerRepair";

function machine(overrides: Partial<ReclaimerRepairTarget> = {}): ReclaimerRepairTarget {
  return {
    id: 2,
    type: "scrap-skitterer",
    position: { x: 3, y: 0 },
    health: 2,
    maxHealth: 4,
    dead: false,
    machine: true,
    rank: "standard",
    ...overrides,
  };
}

function readyState() {
  return { ...createReclaimerRepairBehavior(), cooldownSeconds: 0 };
}

describe("Cyborg Reclaimer finite repair boundary", () => {
  it("selects the most damaged eligible machine deterministically", () => {
    const target = selectReclaimerRepairTarget(1, { x: 0, y: 0 }, [
      machine({ id: 1, health: 1 }),
      machine({ id: 3, type: "cyborg-reclaimer", health: 1 }),
      machine({ id: 4, rank: "boss", health: 1 }),
      machine({ id: 5, machine: false, health: 1 }),
      machine({ id: 6, health: 3, maxHealth: 12 }),
      machine({ id: 2, health: 1, maxHealth: 4 }),
    ]);
    expect(target?.id).toBe(2);
  });

  it("allows only one encounter repair tether at a time", () => {
    const blocked = tryBeginReclaimerRepair(readyState(), 1, { x: 0, y: 0 }, [machine()], 99);
    expect(blocked.phase).toBe("seeking");
    const started = tryBeginReclaimerRepair(readyState(), 1, { x: 0, y: 0 }, [machine()], null);
    expect(started).toMatchObject({
      phase: "channel",
      phaseRemainingSeconds: RECLAIMER_CHANNEL_SECONDS,
      targetId: 2,
    });
  });

  it("locks one target, caps repair at missing health, and consumes one finite patch", () => {
    const target = machine({ health: 3, maxHealth: 4 });
    const channel = tryBeginReclaimerRepair(readyState(), 1, { x: 0, y: 0 }, [target], null);
    const completed = stepReclaimerRepair(
      channel,
      RECLAIMER_CHANNEL_SECONDS,
      { x: 0, y: 0 },
      target,
      false,
    );
    expect(completed).toMatchObject({
      interrupted: false,
      completedRepair: { targetId: 2, amount: 1 },
      state: { phase: "recovery", chargesRemaining: RECLAIMER_PATCH_CHARGES - 1, targetId: null },
    });
    expect(applyReclaimerRepair(target, completed.completedRepair!.amount).health).toBe(4);
  });

  it("breaks on owner damage or excessive range without consuming a patch", () => {
    const channel = tryBeginReclaimerRepair(readyState(), 1, { x: 0, y: 0 }, [machine()], null);
    const damaged = stepReclaimerRepair(channel, 0.2, { x: 0, y: 0 }, machine(), true);
    expect(damaged).toMatchObject({
      interrupted: true,
      completedRepair: null,
      state: { phase: "recovery", chargesRemaining: RECLAIMER_PATCH_CHARGES },
    });

    const ranged = stepReclaimerRepair(
      channel,
      0.2,
      { x: 0, y: 0 },
      machine({ position: { x: 8, y: 0 } }),
      false,
    );
    expect(ranged.interrupted).toBe(true);
    expect(ranged.state.chargesRemaining).toBe(RECLAIMER_PATCH_CHARGES);
  });

  it("cannot acquire when its finite patch budget is exhausted", () => {
    const exhausted = { ...readyState(), chargesRemaining: 0 };
    expect(tryBeginReclaimerRepair(exhausted, 1, { x: 0, y: 0 }, [machine()], null))
      .toBe(exhausted);
  });
});
