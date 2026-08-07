import { describe, expect, it } from "vitest";
import { ENEMY_CATALOG, type EnemyType } from "./enemyCatalog";

/**
 * The corrupted-human family had no resistance profile at all until 7 Aug 2026,
 * which made damage type meaningless against a third of the roster — see
 * `last-bastion-content-design-plan-2026-08-07.md` P3. Flesh burns and is
 * already diseased: fire is a weakness, toxic is resisted. The apex
 * (`abomination-prime`) already shipped with `toxic: 0.65`, so this makes the
 * family read consistently from swarm to boss rather than only at the top.
 */
const CORRUPTED_HUMAN: readonly EnemyType[] = [
  "infected-survivor",
  "corrupted-marine",
  "abomination",
];

describe("corrupted-human resistance identity", () => {
  it("is weak to fire and resistant to toxic across the whole family", () => {
    for (const type of CORRUPTED_HUMAN) {
      const { resistances } = ENEMY_CATALOG[type];
      expect(resistances.fire, `${type} fire`).toBeGreaterThan(1);
      expect(resistances.toxic, `${type} toxic`).toBeLessThan(1);
    }
  });

  it("softens the fire weakness as the body gets bulkier", () => {
    const fire = CORRUPTED_HUMAN.map((type) => ENEMY_CATALOG[type].resistances.fire!);
    // infected-survivor > corrupted-marine > abomination
    expect(fire[0]).toBeGreaterThan(fire[1]!);
    expect(fire[1]).toBeGreaterThan(fire[2]!);
  });

  it("agrees with the apex that already shipped resisting toxic", () => {
    expect(ENEMY_CATALOG["abomination-prime"].resistances.toxic).toBeLessThan(1);
  });
});

describe("nest family resistance identity", () => {
  it("matches the pod's existing fire weakness across weaver and hatchling", () => {
    for (const type of ["nest-pod", "nest-weaver", "nest-hatchling"] as const) {
      expect(ENEMY_CATALOG[type].resistances.fire, `${type} fire`).toBeGreaterThan(1);
    }
  });
});

describe("deliberately neutral enemies", () => {
  /**
   * Not an oversight. Basic scuttlers are the tutorial enemy and should not
   * require a damage-type answer; the Aurum Hoarder is a treasure unit that
   * flees; Siege Crusher is a mini-boss left alone pending a balance pass. The
   * three alien beasts are open candidates, tracked in the content plan.
   */
  const NEUTRAL: readonly EnemyType[] = [
    "scuttler", "swarm-scuttler", "ripper", "quillback", "spinewheel",
    "aurum-hoarder", "siege-crusher",
  ];

  it("keeps an empty resistance profile", () => {
    for (const type of NEUTRAL) {
      expect(Object.keys(ENEMY_CATALOG[type].resistances), type).toHaveLength(0);
    }
  });
});
