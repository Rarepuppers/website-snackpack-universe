import { describe, expect, it } from "vitest";
import { calculateWeaponRingLayout } from "./WeaponRingLayout";

describe("WeaponRingLayout", () => {
  it("returns no slots for an unarmed hero", () => {
    expect(calculateWeaponRingLayout(0)).toEqual([]);
  });

  it("places one weapon on the aimed side", () => {
    const [slot] = calculateWeaponRingLayout(1, Math.PI / 2);
    expect(slot!.x).toBeCloseTo(0);
    expect(slot!.y).toBeGreaterThan(0.8);
  });

  it.each([4, 6, 12])("evenly distributes %i weapons with front and rear depth", (count) => {
    const slots = calculateWeaponRingLayout(count);
    const radii = slots.map((slot) => Math.hypot(slot.x, slot.y));

    expect(slots).toHaveLength(count);
    expect(Math.max(...radii) - Math.min(...radii)).toBeLessThan(0.000001);
    expect(slots.some((slot) => slot.depthOffset === -1)).toBe(true);
    expect(slots.some((slot) => slot.depthOffset === 1)).toBe(true);
    expect(slots.every((slot) => Number.isFinite(slot.x) && Number.isFinite(slot.y))).toBe(true);
  });
});
