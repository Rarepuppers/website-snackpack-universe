import { describe, expect, it } from "vitest";
import {
  applyAimAssist,
  MAX_ASSIST_CONE_RADIANS,
  MAX_ASSIST_RANGE_METRES,
} from "./AimAssist";

const ORIGIN = { x: 0, y: 0 };
const EAST = { x: 1, y: 0 };

function angleOf(vector: { x: number; y: number }): number {
  return Math.atan2(vector.y, vector.x);
}

describe("applyAimAssist", () => {
  it("is a no-op at strength 0, so the default setting changes nothing", () => {
    const targets = [{ position: { x: 5, y: 1 } }];
    expect(applyAimAssist(EAST, ORIGIN, targets, 0)).toEqual(EAST);
  });

  it("returns the raw aim when there are no targets", () => {
    expect(applyAimAssist(EAST, ORIGIN, [], 1)).toEqual(EAST);
  });

  it("bends toward a target inside the cone", () => {
    const targets = [{ position: { x: 10, y: 1 } }];
    const assisted = applyAimAssist(EAST, ORIGIN, targets, 1);
    const targetAngle = Math.atan2(1, 10);
    expect(angleOf(assisted)).toBeGreaterThan(0);
    expect(angleOf(assisted)).toBeLessThan(targetAngle);
  });

  it("leaves the player some authority even at full strength", () => {
    const targets = [{ position: { x: 10, y: 1 } }];
    const assisted = applyAimAssist(EAST, ORIGIN, targets, 1);
    expect(angleOf(assisted)).not.toBeCloseTo(Math.atan2(1, 10), 6);
  });

  it("scales with strength", () => {
    const targets = [{ position: { x: 10, y: 1 } }];
    const weak = angleOf(applyAimAssist(EAST, ORIGIN, targets, 0.25));
    const strong = angleOf(applyAimAssist(EAST, ORIGIN, targets, 1));
    expect(weak).toBeGreaterThan(0);
    expect(weak).toBeLessThan(strong);
  });

  it("ignores targets outside the acquisition cone", () => {
    const wellOutside = Math.tan(MAX_ASSIST_CONE_RADIANS * 2) * 10;
    const targets = [{ position: { x: 10, y: wellOutside } }];
    expect(applyAimAssist(EAST, ORIGIN, targets, 1)).toEqual(EAST);
  });

  it("ignores targets beyond the assist range", () => {
    const targets = [{ position: { x: MAX_ASSIST_RANGE_METRES + 5, y: 0.1 } }];
    expect(applyAimAssist(EAST, ORIGIN, targets, 1)).toEqual(EAST);
  });

  it("prefers the target with the smallest angular offset, not the nearest", () => {
    const targets = [
      { position: { x: 3, y: 0.8 } },
      { position: { x: 12, y: 0.2 } },
    ];
    const assisted = angleOf(applyAimAssist(EAST, ORIGIN, targets, 1));
    // The distant, better-aligned target wins, so the bend stays small.
    expect(assisted).toBeLessThan(Math.atan2(0.2, 12));
  });

  it("takes the short way round the ±pi seam", () => {
    const west = { x: -1, y: 0 };
    // Just below the seam: assisting must rotate down, not the long way up.
    const targets = [{ position: { x: -10, y: -0.5 } }];
    const assisted = applyAimAssist(west, ORIGIN, targets, 1);
    expect(assisted.y).toBeLessThan(0);
    expect(assisted.x).toBeLessThan(0);
  });

  it("returns a normalized vector", () => {
    const targets = [{ position: { x: 10, y: 1 } }];
    const assisted = applyAimAssist(EAST, ORIGIN, targets, 0.6);
    expect(Math.hypot(assisted.x, assisted.y)).toBeCloseTo(1, 6);
  });

  it("leaves a zero aim vector alone", () => {
    const targets = [{ position: { x: 5, y: 0 } }];
    expect(applyAimAssist({ x: 0, y: 0 }, ORIGIN, targets, 1)).toEqual({ x: 0, y: 0 });
  });
});
