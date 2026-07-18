import { describe, expect, it } from "vitest";
import {
  BEAM_TELL_SECONDS,
  buildRainOfSpinesTargets,
  createBeamTelegraph,
  limitMajorTelegraphs,
  MAX_RAIN_ARENA_COVERAGE,
  offscreenWarningPosition,
  pointInsideTelegraphedArc,
  rainCoverageFraction,
} from "./TelegraphRules";

describe("code-authoritative telegraph rules", () => {
  it("keeps rain-of-spines well below the traversable-space ceiling", () => {
    const targets = buildRainOfSpinesTargets({ x: 15, y: 8.5 }, 30, 17);
    expect(targets).toHaveLength(5);
    expect(rainCoverageFraction(targets.length, 30, 17)).toBeLessThanOrEqual(MAX_RAIN_ARENA_COVERAGE);
  });

  it("uses the same forward arc for warning and hit validation", () => {
    expect(pointInsideTelegraphedArc({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0.5 }, 3, Math.PI / 3)).toBe(true);
    expect(pointInsideTelegraphedArc({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }, 3, Math.PI / 3)).toBe(false);
  });

  it("defines a one-second code beam and admits at most two major groups", () => {
    const beams = [0, 1, 2].map((id) => createBeamTelegraph(`beam-${id}`, { x: id, y: 0 }, { x: 1, y: 0 }, 12));
    expect(beams[0]!.durationSeconds).toBe(BEAM_TELL_SECONDS);
    expect(limitMajorTelegraphs(beams)).toHaveLength(2);
  });

  it("clips warnings to an inset edge only while their source is off screen", () => {
    const viewport = { x: 0, y: 0, width: 10, height: 6 };
    expect(offscreenWarningPosition({ x: 4, y: 3 }, viewport)).toBeNull();
    expect(offscreenWarningPosition({ x: 14, y: -2 }, viewport)).toEqual({ x: 9.5, y: 0.5 });
  });
});
