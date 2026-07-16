import { describe, expect, it } from "vitest";
import type { ArenaDefinition } from "../arena/ArenaDefinition";
import { stepSpinewheelReflection } from "./SpinewheelPhysics";

const EMPTY_ARENA: ArenaDefinition = {
  id: "reflection-test",
  widthMetres: 12,
  heightMetres: 8,
  tileSizeMetres: 1,
  obstacles: [],
};

describe("Spinewheel reflection physics", () => {
  it("reflects the locked heading from an arena wall without leaving bounds", () => {
    const step = stepSpinewheelReflection(
      { x: 11.2, y: 4 },
      { x: 1, y: 0 },
      0.3,
      0.68,
      EMPTY_ARENA,
    );

    expect(step.bounced).toBe(true);
    expect(step.hitAxis).toBe("x");
    expect(step.position).toEqual({ x: 11.2, y: 4 });
    expect(step.direction.x).toBeCloseTo(-1);
    expect(step.direction.y).toBeCloseTo(0);
  });

  it("reflects from cover on the collision axis", () => {
    const arena: ArenaDefinition = {
      ...EMPTY_ARENA,
      obstacles: [{ id: "cover", kind: "barricade", x: 5, y: 2, width: 1, height: 4 }],
    };
    const step = stepSpinewheelReflection(
      { x: 4, y: 4 },
      { x: 1, y: 0.1 },
      0.5,
      0.68,
      arena,
    );

    expect(step.bounced).toBe(true);
    expect(step.hitAxis).toBe("x");
    expect(step.direction.x).toBeLessThan(0);
    expect(step.direction.y).toBeGreaterThan(0);
  });
});
