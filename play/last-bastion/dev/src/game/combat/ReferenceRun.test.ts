import { describe, expect, it } from "vitest";
import { measureReferenceRun } from "./ReferenceRun";

describe("measured ten-wave reference run", () => {
  it("lands inside the authored level 9-12 finish window", () => {
    const run = measureReferenceRun();
    expect(run.waves).toHaveLength(10);
    expect(run.finalLevel).toBeGreaterThanOrEqual(9);
    expect(run.finalLevel).toBeLessThanOrEqual(12);
    expect(run.totalSecuredExperience).toBeLessThan(run.totalAvailableExperience);
  });

  it("records a reproducible per-wave trace", () => {
    expect(measureReferenceRun()).toEqual(measureReferenceRun());
  });
});
