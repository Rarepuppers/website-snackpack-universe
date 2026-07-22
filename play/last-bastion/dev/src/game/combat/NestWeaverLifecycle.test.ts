import { describe, expect, it } from "vitest";
import {
  NEST_HATCHLING_PAYLOAD,
  NEST_POD_HATCH_SECONDS,
  NEST_POD_MAX_HEALTH,
  NEST_WEAVER_MAX_LIVE_PODS,
  createNestPod,
  damageNestPod,
  stepNestPod,
  tryReserveNestPod,
} from "./NestWeaverLifecycle";

const OPEN_CONTEXT = {
  activePodsForOwner: 0,
  ownerChargesRemaining: 3,
  liveUnits: 8,
  reservedLiveSlots: 0,
  liveCap: 18,
  remainingThreat: 20,
};

describe("Nest Weaver pod lifecycle", () => {
  it("reserves the entire hatch payload before accepting placement", () => {
    expect(tryReserveNestPod(OPEN_CONTEXT)).toEqual({
      accepted: true,
      reservation: { immediatePodThreat: 2, reservedHatchlingThreat: 3, reservedHatchlingSlots: 3 },
    });
    expect(tryReserveNestPod({ ...OPEN_CONTEXT, liveCap: 11 })).toEqual({ accepted: false, reason: "live-cap" });
    expect(tryReserveNestPod({ ...OPEN_CONTEXT, remainingThreat: 4 })).toEqual({ accepted: false, reason: "threat-budget" });
  });

  it("enforces finite charges and the two-pod per-owner cap", () => {
    expect(tryReserveNestPod({ ...OPEN_CONTEXT, ownerChargesRemaining: 0 })).toEqual({ accepted: false, reason: "charges" });
    expect(tryReserveNestPod({ ...OPEN_CONTEXT, activePodsForOwner: NEST_WEAVER_MAX_LIVE_PODS }))
      .toEqual({ accepted: false, reason: "owner-pod-cap" });
  });

  it("hatches exactly one non-summoning payload after the visible clock", () => {
    const accepted = tryReserveNestPod(OPEN_CONTEXT);
    if (!accepted.accepted) throw new Error("expected reservation");
    let pod = createNestPod(1, 7, { x: 4, y: 5 }, accepted.reservation);
    const counting = stepNestPod(pod, NEST_POD_HATCH_SECONDS - 0.01);
    expect(counting).toMatchObject({ pod: { status: "counting" }, hatchlingCount: 0 });
    expect(counting.pod.remainingSeconds).toBeCloseTo(0.01);
    pod = counting.pod;
    const hatched = stepNestPod(pod, 0.01);
    expect(hatched).toMatchObject({
      pod: { status: "hatched", remainingSeconds: 0 },
      hatchlingCount: 3,
      consumedReservedSlots: 3,
      consumedReservedThreat: 3,
    });
    expect(stepNestPod(hatched.pod, 10).hatchlingCount).toBe(0);
    expect(NEST_HATCHLING_PAYLOAD).toEqual({ type: "nest-hatchling", count: 3, canSummon: false });
  });

  it("releases all future reservations when the pod is destroyed in time", () => {
    const accepted = tryReserveNestPod(OPEN_CONTEXT);
    if (!accepted.accepted) throw new Error("expected reservation");
    const pod = createNestPod(2, 7, { x: 2, y: 3 }, accepted.reservation);
    const damaged = damageNestPod(pod, NEST_POD_MAX_HEALTH - 1);
    expect(damaged).toMatchObject({ pod: { health: 1, status: "counting" }, releasedReservedSlots: 0 });
    expect(damageNestPod(damaged.pod, 1)).toMatchObject({
      pod: { health: 0, status: "destroyed" },
      releasedReservedSlots: 3,
      releasedReservedThreat: 3,
    });
  });
});
