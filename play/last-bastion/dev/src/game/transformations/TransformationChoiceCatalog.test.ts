import { describe, expect, it } from "vitest";
import {
  TRANSFORMATION_CHOICE_CATALOG,
  transformationChoiceById,
  transformationChoicesForPath,
  transformationEffectValue,
} from "./TransformationChoiceCatalog";
import { TRANSFORMATION_PATH_CATALOG } from "./TransformationPathCatalog";

describe("Transformation choice catalog", () => {
  it("supplies exactly three distinct paired choices for every active path", () => {
    expect(TRANSFORMATION_CHOICE_CATALOG).toHaveLength(21);
    expect(new Set(TRANSFORMATION_CHOICE_CATALOG.map(({ id }) => id)).size).toBe(21);
    for (const path of TRANSFORMATION_PATH_CATALOG) {
      const choices = transformationChoicesForPath(path.id);
      expect(choices).toHaveLength(3);
      expect(new Set(choices.map(({ branch }) => branch))).toEqual(new Set(path.branches));
    }
  });

  it("keeps every rank monotonic and uses replacement totals rather than compounding deltas", () => {
    for (const choice of TRANSFORMATION_CHOICE_CATALOG) {
      expect(choice.maxRank).toBe(3);
      for (const trait of [choice.boon, choice.scar]) {
        expect(trait.effects.length).toBeGreaterThan(0);
        for (const effect of trait.effects) {
          expect(effect.values).toHaveLength(3);
          expect(effect.values[0]).toBeGreaterThan(0);
          expect(effect.values[1]).toBeGreaterThan(effect.values[0]);
          expect(effect.values[2]).toBeGreaterThan(effect.values[1]);
          expect(transformationEffectValue(effect, 0)).toBe(effect.values[0]);
          expect(transformationEffectValue(effect, 99)).toBe(effect.values[2]);
        }
      }
    }
  });

  it("keeps rank-I boons meaningfully stronger than scars without making scars trivial", () => {
    for (const { balanceBudget, id } of TRANSFORMATION_CHOICE_CATALOG) {
      expect(balanceBudget.scar, `${id} scar`).toBeGreaterThanOrEqual(10);
      expect(balanceBudget.boon, `${id} boon`).toBeGreaterThan(balanceBudget.scar);
      expect(balanceBudget.boon / balanceBudget.scar, `${id} ratio`).toBeGreaterThanOrEqual(1.45);
      expect(balanceBudget.boon / balanceBudget.scar, `${id} ratio`).toBeLessThanOrEqual(2);
    }
  });

  it("gives the Church of the Designed Arrival its own three choices (24 July 2026: the formerly-excluded 7th path)", () => {
    const churchChoices = transformationChoicesForPath("cultist-doctrine");
    expect(churchChoices).toHaveLength(3);
    expect(new Set(churchChoices.map(({ branch }) => branch))).toEqual(new Set(["Zealot", "Martyr", "Oracle"]));
    expect(churchChoices.every(({ id }) => id.length > 0)).toBe(true);
  });

  it("locks representative numeric contracts", () => {
    expect(transformationChoiceById("regenerative-glands").boon.effects[0]?.values)
      .toEqual([0.12, 0.18, 0.24]);
    expect(transformationChoiceById("targeting-suite").boon.effects).toHaveLength(2);
    expect(transformationChoiceById("rift-step").scar.effects[0]?.values).toEqual([6, 9, 12]);
    expect(transformationChoiceById("psionic-sniper").boon.effects[0]?.rule).toContain("8 metres");
  });
});

