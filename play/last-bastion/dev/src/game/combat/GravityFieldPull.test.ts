import { describe, expect, it } from "vitest";
import { planGravityFieldPull } from "./GravityFieldPull";

describe("GravityFieldPull", () => {
  it("pulls an in-range enemy toward the centre by the frame travel distance", () => {
    expect(planGravityFieldPull({
      enemyPosition: { x: 0, y: 0 },
      enemyDead: false,
      fieldPosition: { x: 3, y: 4 },
      pullRadiusMetres: 5,
      pullStrengthMetresPerSecond: 2,
      deltaSeconds: 0.5,
    })).toEqual({ destination: { x: 0.6, y: 0.8 }, travelMetres: 1 });
  });

  it("stops at the centre instead of overshooting it", () => {
    expect(planGravityFieldPull({
      enemyPosition: { x: 0, y: 0 },
      enemyDead: false,
      fieldPosition: { x: 0.3, y: 0.4 },
      pullRadiusMetres: 1,
      pullStrengthMetresPerSecond: 10,
      deltaSeconds: 1,
    })).toEqual({ destination: { x: 0.3, y: 0.4 }, travelMetres: 0.5 });
  });

  it("skips dead, centred, and beyond-radius enemies while including the radius edge", () => {
    const base = {
      enemyPosition: { x: 2, y: 0 },
      enemyDead: false,
      fieldPosition: { x: 0, y: 0 },
      pullRadiusMetres: 2,
      pullStrengthMetresPerSecond: 1,
      deltaSeconds: 1,
    };
    expect(planGravityFieldPull(base)).not.toBeNull();
    expect(planGravityFieldPull({ ...base, enemyDead: true })).toBeNull();
    expect(planGravityFieldPull({ ...base, enemyPosition: { x: 0, y: 0 } })).toBeNull();
    expect(planGravityFieldPull({ ...base, enemyPosition: { x: 2.001, y: 0 } })).toBeNull();
  });
});
