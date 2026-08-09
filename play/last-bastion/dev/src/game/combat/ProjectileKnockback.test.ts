import { describe, expect, it } from "vitest";
import { planProjectileKnockback } from "./ProjectileKnockback";

describe("ProjectileKnockback", () => {
  it("displaces along normalized projectile travel", () => {
    expect(planProjectileKnockback({
      enemyPosition: { x: 2, y: 3 },
      enemyDead: false,
      projectileVelocity: { x: 3, y: 4 },
      knockbackMetres: 2.5,
    })).toEqual({ x: 3.5, y: 5 });
  });

  it("returns the same desired position for zero-speed travel", () => {
    expect(planProjectileKnockback({
      enemyPosition: { x: 2, y: 3 },
      enemyDead: false,
      projectileVelocity: { x: 0, y: 0 },
      knockbackMetres: 1,
    })).toEqual({ x: 2, y: 3 });
  });

  it("skips exhausted knockback and dead enemies", () => {
    const input = {
      enemyPosition: { x: 2, y: 3 },
      enemyDead: false,
      projectileVelocity: { x: 1, y: 0 },
      knockbackMetres: 0,
    };
    expect(planProjectileKnockback(input)).toBeNull();
    expect(planProjectileKnockback({ ...input, knockbackMetres: 1, enemyDead: true })).toBeNull();
  });
});
