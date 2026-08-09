import { describe, expect, it } from "vitest";
import { stepProjectileKinematics } from "./ProjectileKinematics";

describe("ProjectileKinematics", () => {
  it("moves and decreases lifetime before reporting an active projectile", () => {
    expect(stepProjectileKinematics({
      position: { x: 1, y: 2 },
      velocity: { x: 4, y: -2 },
      remainingSeconds: 1,
      deltaSeconds: 0.25,
      widthMetres: 10,
      heightMetres: 8,
    })).toEqual({ position: { x: 2, y: 1.5 }, remainingSeconds: 0.75, outcome: "active" });
  });

  it("reports expiry before bounds when both occur in the same step", () => {
    expect(stepProjectileKinematics({
      position: { x: 9, y: 4 },
      velocity: { x: 10, y: 0 },
      remainingSeconds: 0.1,
      deltaSeconds: 0.1,
      widthMetres: 10,
      heightMetres: 8,
    }).outcome).toBe("expired");
  });

  it("keeps exact arena-edge positions active and rejects positions beyond them", () => {
    const base = {
      position: { x: 9, y: 8 },
      velocity: { x: 1, y: 0 },
      remainingSeconds: 2,
      deltaSeconds: 1,
      widthMetres: 10,
      heightMetres: 8,
    };
    expect(stepProjectileKinematics(base).outcome).toBe("active");
    expect(stepProjectileKinematics({ ...base, velocity: { x: 1.01, y: 0 } }).outcome).toBe("out-of-bounds");
  });
});
