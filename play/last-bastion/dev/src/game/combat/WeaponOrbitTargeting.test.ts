import { describe, expect, it } from "vitest";
import { selectOrbitChainTarget, selectOrbitContactTargets } from "./WeaponOrbitTargeting";

const targets = [
  { id: 1, position: { x: 1, y: 0 }, dead: false },
  { id: 2, position: { x: -1, y: 0 }, dead: false },
  { id: 3, position: { x: 0.25, y: 0 }, dead: true },
];

describe("WeaponOrbitTargeting", () => {
  it("preserves inclusive range and later-entry tie resolution", () => {
    expect(selectOrbitChainTarget({
      targets,
      origin: { x: 0, y: 0 },
      maximumDistanceMetres: 1,
    })?.id).toBe(2);
    expect(selectOrbitChainTarget({
      targets,
      origin: { x: 0, y: 0 },
      maximumDistanceMetres: 1,
      excludedIds: new Set([2]),
    })?.id).toBe(1);
  });

  it("returns live blade contacts in encounter order with per-target reach", () => {
    const contacts = selectOrbitContactTargets({
      targets,
      bladePosition: { x: 0, y: 0 },
      contactReachMetres: (target) => target.id === 1 ? 1 : 0.9,
    });
    expect(contacts.map(({ id }) => id)).toEqual([1]);
  });
});
