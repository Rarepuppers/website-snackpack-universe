import { describe, expect, it } from "vitest";
import { planDisplayCalibration } from "./DisplayCalibration";

describe("display calibration", () => {
  it("keeps defaults on the zero-cost identity path", () => {
    expect(planDisplayCalibration({ brightness: 1, gamma: 1 })).toEqual({
      brightness: 1, gamma: 1, exponent: 1, identity: true,
    });
  });

  it("converts player gamma into the transfer-function exponent", () => {
    const lighterMidtones = planDisplayCalibration({ brightness: 1.2, gamma: 2 });
    expect(lighterMidtones).toEqual({
      brightness: 1.2, gamma: 2, exponent: 0.5, identity: false,
    });
    expect(planDisplayCalibration({ brightness: 0.8, gamma: 0.5 }).exponent).toBe(2);
  });

  it("clamps edited or non-finite preferences", () => {
    expect(planDisplayCalibration({ brightness: -4, gamma: 8 })).toMatchObject({
      brightness: 0.5, gamma: 2,
    });
    expect(planDisplayCalibration({ brightness: Number.NaN, gamma: Number.POSITIVE_INFINITY }))
      .toEqual({ brightness: 1, gamma: 1, exponent: 1, identity: true });
  });
});
