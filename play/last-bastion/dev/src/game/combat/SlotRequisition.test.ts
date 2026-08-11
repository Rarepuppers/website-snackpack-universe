import { describe, expect, it } from "vitest";
import {
  planSlotRequisitionChoice,
  planSlotRequisitionDecision,
  slotRequisitionRollCount,
} from "./SlotRequisition";

const capacities = { offensive: 2, defensive: 2, support: 1, scavenger: 1 } as const;
const used = { offensive: 1, defensive: 0, support: 1, scavenger: 0 } as const;
const labels = { offensive: "Offensive", defensive: "Defensive", support: "Support", scavenger: "Scavenger" } as const;

describe("slot requisition planning", () => {
  it("plans the exact seeded removal count and removes by supplied roll", () => {
    expect(slotRequisitionRollCount(4)).toBe(1);
    const decision = planSlotRequisitionDecision({ capacities, used, labels, hardCap: 12, randomUnits: [0.5] });
    expect(decision?.options.map((option) => option.id)).toEqual([
      "slot-offensive",
      "slot-defensive",
      "slot-scavenger",
    ]);
  });

  it("returns no decision at the shared hard cap", () => {
    expect(planSlotRequisitionDecision({ capacities, used, labels, hardCap: 6, randomUnits: [0.5] })).toBeNull();
  });

  it("plans valid capacity growth and rejects invalid or capped choices", () => {
    expect(planSlotRequisitionChoice({ optionId: "slot-support", capacities, hardCap: 12 })).toEqual({
      ok: true,
      category: "support",
      nextCapacity: 2,
    });
    expect(planSlotRequisitionChoice({ optionId: "slot-missing", capacities, hardCap: 12 })).toEqual({ ok: false });
    expect(planSlotRequisitionChoice({ optionId: "slot-support", capacities, hardCap: 6 })).toEqual({ ok: false });
  });
});
