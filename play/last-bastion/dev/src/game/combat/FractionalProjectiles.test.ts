import { describe, expect, it } from "vitest";
import { initialProjectileCarry, resolveFractionalProjectiles } from "./FractionalProjectiles";

function sequence(projectileCount: number, instanceId: number, shots: number): number[] {
  let carry = initialProjectileCarry(instanceId);
  return Array.from({ length: shots }, () => {
    const resolved = resolveFractionalProjectiles(projectileCount, carry);
    carry = resolved.carry;
    return resolved.count;
  });
}

describe("fractional projectile accumulator", () => {
  it("alternates 1.5 projectiles deterministically", () => {
    expect(sequence(1.5, 1, 4)).toEqual([1, 2, 1, 2]);
    expect(sequence(1.25, 1, 4)).toEqual([1, 1, 2, 1]);
    expect(sequence(2.75, 0, 4)).toEqual([2, 3, 3, 3]);
  });

  it("seeds each weapon instance independently", () => {
    expect(sequence(1.5, 1, 4)).not.toEqual(sequence(1.5, 2, 4));
    expect(sequence(1.5, 2, 4)).toEqual([2, 1, 2, 1]);
  });

  it("keeps positive weapons at one projectile unless skipping is explicit", () => {
    expect(sequence(0.6, 1, 4).every((count) => count >= 1)).toBe(true);
    expect(resolveFractionalProjectiles(0, 0.8).count).toBe(0);
  });
});
