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
    expect(TRANSFORMATION_CHOICE_CATALOG).toHaveLength(18);
    expect(new Set(TRANSFORMATION_CHOICE_CATALOG.map(({ id }) => id)).size).toBe(18);
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

  it("keeps the future Church path out of all active choices", () => {
    for (const choice of TRANSFORMATION_CHOICE_CATALOG) {
      const searchable = `${choice.id} ${choice.pathId} ${choice.branch} ${choice.boon.name} ${choice.scar.name}`.toLowerCase();
      expect(searchable).not.toContain("zealot");
      expect(searchable).not.toContain("cultist");
      expect(searchable).not.toContain("church");
    }
  });

  it("locks representative numeric contracts", () => {
    expect(transformationChoiceById("regenerative-glands").boon.effects[0]?.values)
      .toEqual([0.12, 0.18, 0.24]);
    expect(transformationChoiceById("targeting-suite").boon.effects).toHaveLength(2);
    expect(transformationChoiceById("rift-step").scar.effects[0]?.values).toEqual([6, 9, 12]);
    expect(transformationChoiceById("psionic-sniper").boon.effects[0]?.rule).toContain("8 metres");
  });
});

