import { describe, expect, it } from "vitest";
import {
  angleToward,
  brainBlobFrame,
  cardinalFacingColumn,
  eggClusterFrame,
  offsetGaitRow,
} from "./EnemyVisualState";

describe("EnemyVisualState", () => {
  it("maps cardinal directions to the shared sheet column order", () => {
    const origin = { x: 0, y: 0 };
    expect(cardinalFacingColumn(origin, { x: 0, y: 1 })).toBe(0);
    expect(cardinalFacingColumn(origin, { x: 0, y: -1 })).toBe(1);
    expect(cardinalFacingColumn(origin, { x: 1, y: 0 })).toBe(2);
    expect(cardinalFacingColumn(origin, { x: -1, y: 0 })).toBe(3);
  });

  it("offsets gait rows by stable entity id", () => {
    expect(offsetGaitRow(0, 1)).not.toBe(offsetGaitRow(0, 2));
    expect(offsetGaitRow(140, 1)).not.toBe(offsetGaitRow(0, 1));
  });

  it("maps hatch progress to increasingly urgent egg frames", () => {
    expect([0, 0.35, 0.72, 0.94].map(eggClusterFrame)).toEqual([0, 1, 2, 3]);
  });

  it("maps every Brain Blob phase to its authored frame", () => {
    expect(["drift", "windup", "lunge", "recover"].map((phase) => (
      brainBlobFrame(phase as "drift" | "windup" | "lunge" | "recover")
    ))).toEqual([0, 1, 2, 3]);
  });

  it("calculates rotation for an east-authored directional sprite", () => {
    expect(angleToward({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(Math.PI / 2);
  });
});
