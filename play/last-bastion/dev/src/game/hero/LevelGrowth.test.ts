import { describe, expect, it } from "vitest";
import { experienceThreshold, marineGrowthAtLevel } from "./LevelGrowth";

describe("Marine level package", () => {
  it("matches the authored level-ten package exactly", () => {
    const growth = marineGrowthAtLevel(10);
    expect(growth).toMatchObject({
      maxHealthBonus: 9,
      armourBonus: 4.5,
      damageMultiplier: 1.18,
      speedMultiplier: 1.135,
      supportMultiplier: 1,
    });
    expect(growth.proficiencyMultiplier.light).toBeCloseTo(1.36);
    expect(growth.proficiencyMultiplier.medium).toBe(1);
    expect(growth.proficiencyMultiplier.heavy).toBe(1);
    expect(growth.proficiencyMultiplier.unique).toBe(1);
  });

  it("uses the quadratic XP threshold curve", () => {
    expect(experienceThreshold(1)).toBe(10);
    expect(experienceThreshold(5)).toBe(38);
    expect(experienceThreshold(10)).toBe(95);
  });
});
