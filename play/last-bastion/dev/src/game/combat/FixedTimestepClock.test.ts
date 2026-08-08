import { describe, expect, it } from "vitest";
import { FIXED_STEP_SECONDS, MAX_STEPS_PER_FRAME, planFixedSteps } from "./FixedTimestepClock";

describe("planFixedSteps", () => {
  it("runs one step per frame at 1x when delta matches the fixed step", () => {
    let accumulator = 0;
    for (let frame = 0; frame < 5; frame += 1) {
      const plan = planFixedSteps(accumulator, FIXED_STEP_SECONDS, 1);
      expect(plan.steps).toBe(1);
      accumulator = plan.nextAccumulatorSeconds;
    }
  });

  it("banks sub-step deltas rather than dropping them", () => {
    // Ten frames at a third of a step should produce exactly three or four
    // steps total, never fewer — the remainder must survive across calls.
    let accumulator = 0;
    let totalSteps = 0;
    for (let frame = 0; frame < 10; frame += 1) {
      const plan = planFixedSteps(accumulator, FIXED_STEP_SECONDS / 3, 1);
      totalSteps += plan.steps;
      accumulator = plan.nextAccumulatorSeconds;
    }
    expect(totalSteps).toBeGreaterThanOrEqual(3);
    expect(totalSteps).toBeLessThanOrEqual(4);
  });

  it("produces two steps per frame at 2x speed with a matching delta", () => {
    const plan = planFixedSteps(0, FIXED_STEP_SECONDS, 2);
    expect(plan.steps).toBe(2);
    expect(plan.nextAccumulatorSeconds).toBeCloseTo(0, 10);
  });

  it("produces a step every other frame at 0.5x speed", () => {
    let accumulator = 0;
    const stepsPerFrame: number[] = [];
    for (let frame = 0; frame < 4; frame += 1) {
      const plan = planFixedSteps(accumulator, FIXED_STEP_SECONDS, 0.5);
      stepsPerFrame.push(plan.steps);
      accumulator = plan.nextAccumulatorSeconds;
    }
    expect(stepsPerFrame).toEqual([0, 1, 0, 1]);
  });

  it("lets a non-integer multiplier fall out of the accumulator's remainder", () => {
    // 1.25x over eight frames of one fixed step each simulates 8 * 1.25 = 10
    // steps worth of time. Ordinary binary-float rounding can land the count
    // one step either side of 10 depending on exactly where the remainder
    // sits, so the real invariant is that no simulated time is created or
    // destroyed: steps consumed plus what is left in the accumulator must
    // still equal the total time fed in.
    let accumulator = 0;
    let totalSteps = 0;
    for (let frame = 0; frame < 8; frame += 1) {
      const plan = planFixedSteps(accumulator, FIXED_STEP_SECONDS, 1.25);
      totalSteps += plan.steps;
      accumulator = plan.nextAccumulatorSeconds;
    }
    expect(totalSteps).toBeGreaterThanOrEqual(9);
    expect(totalSteps).toBeLessThanOrEqual(10);
    expect(totalSteps * FIXED_STEP_SECONDS + accumulator).toBeCloseTo(10 * FIXED_STEP_SECONDS, 9);
  });

  it("clamps to MAX_STEPS_PER_FRAME on a large delta instead of spiralling", () => {
    // A multi-second delta (e.g. returning from a backgrounded tab) should
    // never demand hundreds of steps in one call.
    const plan = planFixedSteps(0, 5, 1);
    expect(plan.steps).toBe(MAX_STEPS_PER_FRAME);
    expect(plan.clamped).toBe(true);
  });

  it("drops the remainder on a clamp rather than deferring a burst to next frame", () => {
    const plan = planFixedSteps(0, 5, 1);
    expect(plan.nextAccumulatorSeconds).toBe(0);
  });

  it("does not clamp when the frame lands exactly on the ceiling with nothing left over", () => {
    const plan = planFixedSteps(0, FIXED_STEP_SECONDS * MAX_STEPS_PER_FRAME, 1);
    expect(plan.steps).toBe(MAX_STEPS_PER_FRAME);
    expect(plan.clamped).toBe(false);
    expect(plan.nextAccumulatorSeconds).toBeCloseTo(0, 10);
  });

  it("treats a non-positive or non-finite multiplier as 1x rather than stalling or exploding", () => {
    expect(planFixedSteps(0, FIXED_STEP_SECONDS, 0).steps).toBe(1);
    expect(planFixedSteps(0, FIXED_STEP_SECONDS, -1).steps).toBe(1);
    expect(planFixedSteps(0, FIXED_STEP_SECONDS, Number.NaN).steps).toBe(1);
  });

  it("tolerates a negative or non-finite accumulator and delta", () => {
    expect(planFixedSteps(-5, FIXED_STEP_SECONDS, 1).steps).toBe(1);
    expect(planFixedSteps(Number.NaN, FIXED_STEP_SECONDS, 1).steps).toBe(1);
    expect(planFixedSteps(0, -1, 1).steps).toBe(0);
    expect(planFixedSteps(0, Number.NaN, 1).steps).toBe(0);
  });

  it("never returns a negative accumulator", () => {
    const plan = planFixedSteps(0, FIXED_STEP_SECONDS * 0.4, 1);
    expect(plan.nextAccumulatorSeconds).toBeGreaterThanOrEqual(0);
  });
});
