import { describe, expect, it } from "vitest";
import { advanceOrbitBladeMotion } from "./OrbitBladeMotion";

describe("OrbitBladeMotion", () => {
  it("advances angle before resolving blade position and facing", () => {
    const result = advanceOrbitBladeMotion({
      currentAngleRadians: 0,
      angularSpeedRadiansPerSecond: Math.PI,
      deltaSeconds: 0.5,
      orbitRadiusMetres: 2,
      playerPosition: { x: 4, y: 5 },
    });
    expect(result.angleRadians).toBe(Math.PI / 2);
    expect(result.direction.x).toBeCloseTo(0);
    expect(result.direction.y).toBe(1);
    expect(result.bladePosition.x).toBeCloseTo(4);
    expect(result.bladePosition.y).toBe(7);
  });

  it("retains accumulated angles without wrapping", () => {
    const result = advanceOrbitBladeMotion({
      currentAngleRadians: Math.PI * 2,
      angularSpeedRadiansPerSecond: 2,
      deltaSeconds: 0.25,
      orbitRadiusMetres: 1,
      playerPosition: { x: 0, y: 0 },
    });
    expect(result.angleRadians).toBe(Math.PI * 2 + 0.5);
    expect(result.bladePosition).toEqual(result.direction);
  });
});
