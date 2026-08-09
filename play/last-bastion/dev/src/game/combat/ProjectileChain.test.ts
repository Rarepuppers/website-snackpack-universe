import { describe, expect, it } from "vitest";
import { planProjectileChainHop } from "./ProjectileChain";

const candidate = (id: number, x: number, dead = false) => ({ id, position: { x, y: 0 }, dead });

describe("ProjectileChain", () => {
  it("selects inclusively and lets the later encounter entry win an exact-distance tie", () => {
    const targets = [candidate(1, -2), candidate(2, 2)];
    const result = planProjectileChainHop({
      targets,
      fromPosition: { x: 0, y: 0 },
      hitEnemyIds: new Set(),
      chainRemaining: 3,
      chainRadiusMetres: 2,
      completedHops: 0,
      baseDamage: 100,
    });
    expect(result).toEqual({ target: targets[1], hop: 1, damage: 70, chainRemaining: 2 });
  });

  it("skips dead and previously hit candidates while advancing falloff per hop", () => {
    const result = planProjectileChainHop({
      targets: [candidate(1, 1, true), candidate(2, 1), candidate(3, 1.5)],
      fromPosition: { x: 0, y: 0 },
      hitEnemyIds: new Set([2]),
      chainRemaining: 1,
      chainRadiusMetres: 2,
      completedHops: 1,
      baseDamage: 100,
    });
    expect(result).toMatchObject({ target: { id: 3 }, hop: 2, chainRemaining: 0 });
    expect(result?.damage).toBeCloseTo(49);
  });

  it("returns no hop without capacity or an eligible in-range target", () => {
    const input = {
      targets: [candidate(1, 3)],
      fromPosition: { x: 0, y: 0 },
      hitEnemyIds: new Set<number>(),
      chainRemaining: 1,
      chainRadiusMetres: 2,
      completedHops: 0,
      baseDamage: 10,
    };
    expect(planProjectileChainHop(input)).toBeNull();
    expect(planProjectileChainHop({ ...input, chainRemaining: 0, chainRadiusMetres: 4 })).toBeNull();
  });
});
