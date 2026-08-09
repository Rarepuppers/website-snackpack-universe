import { describe, expect, it, vi } from "vitest";
import { planProjectileWorldCollision } from "./ProjectileWorldCollision";

const chests = [
  { id: 1, variant: "armored", position: { x: 0.6, y: 0 }, resolved: false },
  { id: 2, variant: "armored", position: { x: 0.2, y: 0 }, resolved: false },
];

describe("ProjectileWorldCollision", () => {
  it("gives the first obstacle precedence over armored chests", () => {
    const obstacles = [{ id: "first" }, { id: "second" }];
    const hitsObstacle = vi.fn(() => true);
    expect(planProjectileWorldCollision({
      position: { x: 0, y: 0 },
      obstacles,
      chests,
      chestRadiusMetres: 0.6,
      hitsObstacle,
    })).toEqual({ kind: "obstacle", obstacle: obstacles[0] });
    expect(hitsObstacle).toHaveBeenCalledTimes(1);
  });

  it("selects the first eligible chest at the inclusive contact radius", () => {
    expect(planProjectileWorldCollision({
      position: { x: 0, y: 0 },
      obstacles: [],
      chests: [
        { ...chests[0]!, resolved: true },
        { ...chests[0]!, id: 3, variant: "standard" },
        ...chests,
      ],
      chestRadiusMetres: 0.6,
      hitsObstacle: () => false,
    })).toEqual({ kind: "armored-chest", chest: chests[0] });
  });

  it("returns no collision when every candidate is ineligible or missed", () => {
    expect(planProjectileWorldCollision({
      position: { x: 0, y: 0 },
      obstacles: [{ id: "cover" }],
      chests: [{ ...chests[0]!, position: { x: 0.60001, y: 0 } }],
      chestRadiusMetres: 0.6,
      hitsObstacle: () => false,
    })).toBeNull();
  });
});
