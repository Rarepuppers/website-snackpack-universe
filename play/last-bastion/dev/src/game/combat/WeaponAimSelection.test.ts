import { describe, expect, it } from "vitest";
import { selectWeaponAimDirection } from "./WeaponAimSelection";

const targets = [
  { id: 1, position: { x: 1, y: 0 }, dead: false },
  { id: 2, position: { x: 0, y: 3 }, dead: false },
  { id: 3, position: { x: -1, y: 0 }, dead: false },
];

describe("WeaponAimSelection", () => {
  it("returns cursor aim unchanged without consulting target designation", () => {
    let consulted = false;
    const cursor = { x: 0.25, y: -0.75 };
    expect(selectWeaponAimDirection({
      targetingMode: "cursor",
      cursorDirection: cursor,
      origin: { x: 0, y: 0 },
      rangeMetres: 10,
      targets,
      isDesignated: () => { consulted = true; return false; },
    })).toBe(cursor);
    expect(consulted).toBe(false);
  });

  it("prioritizes a designated in-range target over a closer ordinary target", () => {
    expect(selectWeaponAimDirection({
      targetingMode: "nearest-enemy",
      cursorDirection: { x: 1, y: 0 },
      origin: { x: 0, y: 0 },
      rangeMetres: 4,
      targets,
      isDesignated: (target) => target.id === 2,
    })).toEqual({ x: 0, y: 1 });
  });

  it("preserves later-entry ties and returns null without a live in-range target", () => {
    expect(selectWeaponAimDirection({
      targetingMode: "nearest-enemy",
      cursorDirection: { x: 0, y: 1 },
      origin: { x: 0, y: 0 },
      rangeMetres: 1,
      targets,
      isDesignated: () => false,
    })).toEqual({ x: -1, y: 0 });
    expect(selectWeaponAimDirection({
      targetingMode: "nearest-enemy",
      cursorDirection: { x: 0, y: 1 },
      origin: { x: 0, y: 0 },
      rangeMetres: 0.5,
      targets,
      isDesignated: () => false,
    })).toBeNull();
  });
});
