import { describe, expect, it } from "vitest";
import { blendSteering, ENEMY_STEERING_PROFILES, rangeBandIntent } from "./EnemySteeringProfiles";

describe("enemy steering profiles", () => {
  it("keeps standoff shooters inside their authored range band", () => {
    expect(rangeBandIntent(4.9, "standoffShooter")).toBe(-1);
    expect(rangeBandIntent(6.5, "standoffShooter")).toBe(0);
    expect(rangeBandIntent(8.1, "standoffShooter")).toBe(1);
  });

  it("keeps simple pursuers advancing until contact range", () => {
    expect(rangeBandIntent(0.5, "pursuer")).toBe(1);
    expect(rangeBandIntent(0.1, "pursuer")).toBe(0);
  });

  it("blends local separation without changing movement magnitude", () => {
    const direction = blendSteering({ x: 1, y: 0 }, { x: 0, y: 1 }, 0.25);
    expect(Math.hypot(direction.x, direction.y)).toBeCloseTo(1);
    expect(direction.x).toBeGreaterThan(direction.y);
    expect(direction.y).toBeGreaterThan(0);
  });

  it("defines all director profile families", () => {
    expect(Object.keys(ENEMY_STEERING_PROFILES)).toEqual([
      "pursuer", "rushPack", "chaseAndFire", "standoffShooter",
      "artillery", "flanker", "supportAnchor", "treasureFlee",
    ]);
  });
});
