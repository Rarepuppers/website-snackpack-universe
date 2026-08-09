import { describe, expect, it } from "vitest";
import { stepNestPodBehavior } from "./NestPodBehavior";
import { createNestPod, NEST_POD_HATCH_SECONDS } from "./NestWeaverLifecycle";

function pod() {
  return createNestPod(4, 2, { x: 3, y: 5 }, {
    immediatePodThreat: 2,
    reservedHatchlingSlots: 3,
    reservedHatchlingThreat: 3,
  });
}

describe("NestPodBehavior", () => {
  it("keeps counting without a world action before the hatch threshold", () => {
    const result = stepNestPodBehavior(pod(), NEST_POD_HATCH_SECONDS - 0.01);
    expect(result.pod.status).toBe("counting");
    expect(result.pod.remainingSeconds).toBeCloseTo(0.01);
    expect(result.action).toBeNull();
  });

  it("emits the authored offsets and reservation release exactly once", () => {
    const result = stepNestPodBehavior(pod(), NEST_POD_HATCH_SECONDS);
    expect(result.action).toEqual({
      kind: "hatch",
      offsets: [{ x: -0.48, y: 0.12 }, { x: 0.48, y: 0.12 }, { x: 0, y: -0.46 }],
      consumedReservedSlots: 3,
      consumedReservedThreat: 3,
    });
    expect(stepNestPodBehavior(result.pod, 10).action).toBeNull();
  });
});
