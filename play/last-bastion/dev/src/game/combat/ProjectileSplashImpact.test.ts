import { describe, expect, it } from "vitest";
import { planProjectileSplashImpact } from "./ProjectileSplashImpact";

const candidate = { id: 2, position: { x: 2, y: 0 }, dead: false };

describe("ProjectileSplashImpact", () => {
  it("includes a live secondary target at the exact radius and composes damage", () => {
    expect(planProjectileSplashImpact({
      candidate,
      directEnemyId: 1,
      explosionPosition: { x: 0, y: 0 },
      explosionRadiusMetres: 2,
      projectileDamage: 20,
      splashDamageMultiplier: () => 0.6,
    })).toEqual({ target: candidate, damage: 12 });
  });

  it("excludes the direct target and targets killed by earlier effects", () => {
    const input = {
      candidate,
      directEnemyId: candidate.id,
      explosionPosition: { x: 0, y: 0 },
      explosionRadiusMetres: 3,
      projectileDamage: 20,
      splashDamageMultiplier: () => 1,
    };
    expect(planProjectileSplashImpact(input)).toBeNull();
    expect(planProjectileSplashImpact({
      ...input,
      candidate: { ...candidate, dead: true },
      directEnemyId: 1,
    })).toBeNull();
  });

  it("excludes a live secondary target beyond the radius", () => {
    expect(planProjectileSplashImpact({
      candidate,
      directEnemyId: 1,
      explosionPosition: { x: 0, y: 0 },
      explosionRadiusMetres: 1.999,
      projectileDamage: 20,
      splashDamageMultiplier: () => 1,
    })).toBeNull();
  });
});
