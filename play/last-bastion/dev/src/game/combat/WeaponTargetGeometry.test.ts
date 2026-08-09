import { describe, expect, it } from "vitest";
import { pointInsideWeaponArc, selectForwardArcTargets } from "./WeaponTargetGeometry";

const targets = [
  { id: 1, position: { x: 2, y: 0 }, dead: false },
  { id: 2, position: { x: 2, y: 1 }, dead: false },
  { id: 3, position: { x: -1, y: 0 }, dead: false },
  { id: 4, position: { x: 1, y: 0 }, dead: true },
];

describe("WeaponTargetGeometry", () => {
  it("keeps the public arc predicate's inclusive reach and angle boundaries", () => {
    expect(pointInsideWeaponArc({ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, 3)).toBe(true);
    expect(pointInsideWeaponArc({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }, 0)).toBe(true);
    expect(pointInsideWeaponArc({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 0 }, 3)).toBe(false);
  });

  it("selects live, visible cone targets in stable encounter order", () => {
    const selected = selectForwardArcTargets({
      targets,
      origin: { x: 0, y: 0 },
      facing: { x: 1, y: 0 },
      reachMetres: 3,
      halfAngleRadians: Math.PI / 3,
      isPathBlocked: (target) => target.id === 2,
    });
    expect(selected.map(({ id }) => id)).toEqual([1]);
  });
});
