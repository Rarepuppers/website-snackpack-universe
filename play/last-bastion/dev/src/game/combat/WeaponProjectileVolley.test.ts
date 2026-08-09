import { describe, expect, it } from "vitest";
import { planProjectileVolley } from "./WeaponProjectileVolley";

describe("WeaponProjectileVolley", () => {
  it("centres a single projectile on the aim vector", () => {
    expect(planProjectileVolley({
      anchor: { x: 2, y: 3 },
      aimDirection: { x: 1, y: 0 },
      projectileCount: 1,
      spreadRadians: 0.4,
    })).toEqual([{ direction: { x: 1, y: 0 }, muzzlePosition: { x: 2.55, y: 3 } }]);
  });

  it("builds a symmetric authored spread in stable index order", () => {
    const shots = planProjectileVolley({
      anchor: { x: 0, y: 0 },
      aimDirection: { x: 1, y: 0 },
      projectileCount: 3,
      spreadRadians: Math.PI / 4,
      muzzleOffsetMetres: 1,
    });
    expect(shots.map(({ direction }) => direction.x)).toEqual([
      Math.cos(-Math.PI / 4), 1, Math.cos(Math.PI / 4),
    ]);
    expect(shots[0]!.direction.y).toBeCloseTo(-Math.SQRT1_2);
    expect(shots[1]!.muzzlePosition).toEqual({ x: 1, y: 0 });
    expect(shots[2]!.direction.y).toBeCloseTo(Math.SQRT1_2);
  });
});
