import { describe, expect, it } from "vitest";
import { steerProjectileVelocity } from "./ProjectileHoming";

describe("ProjectileHoming", () => {
  it("turns toward the nearest live target by at most the frame turn allowance", () => {
    const velocity = steerProjectileVelocity({
      position: { x: 0, y: 0 },
      velocity: { x: 4, y: 0 },
      targets: [
        { position: { x: 0, y: -1 }, dead: true },
        { position: { x: 0, y: 2 }, dead: false },
        { position: { x: 4, y: 0 }, dead: false },
      ],
      turnRateRadiansPerSecond: 1,
      deltaSeconds: 0.25,
    });
    expect(Math.atan2(velocity.y, velocity.x)).toBeCloseTo(0.25);
    expect(Math.hypot(velocity.x, velocity.y)).toBeCloseTo(4);
  });

  it("keeps the earlier encounter entry on an exact-distance tie", () => {
    const velocity = steerProjectileVelocity({
      position: { x: 0, y: 0 },
      velocity: { x: 1, y: 0 },
      targets: [
        { position: { x: 0, y: 2 }, dead: false },
        { position: { x: 0, y: -2 }, dead: false },
      ],
      turnRateRadiansPerSecond: 10,
      deltaSeconds: 1,
    });
    expect(velocity.y).toBeGreaterThan(0);
  });

  it("returns the existing velocity when no steering can occur", () => {
    const velocity = { x: 0, y: 0 };
    expect(steerProjectileVelocity({
      position: { x: 1, y: 1 },
      velocity,
      targets: [{ position: { x: 2, y: 2 }, dead: false }],
      turnRateRadiansPerSecond: 2,
      deltaSeconds: 0.1,
    })).toBe(velocity);
  });
});
