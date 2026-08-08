import { describe, expect, it } from "vitest";
import {
  normalizeThreatTier,
  threatTierDefinition,
  unlockedThreatTiers,
} from "./ThreatTier";

describe("threat tiers", () => {
  it("normalizes edited and legacy values to the standard tier", () => {
    expect(normalizeThreatTier(0)).toBe(0);
    expect(normalizeThreatTier(2)).toBe(2);
    expect(normalizeThreatTier(3)).toBe(0);
    expect(normalizeThreatTier("2")).toBe(0);
  });

  it("keeps the prototype modifiers cumulative and budget-neutral", () => {
    expect(threatTierDefinition(0)).toMatchObject({ elitePatrols: false, spawnCadenceMultiplier: 1 });
    expect(threatTierDefinition(1)).toMatchObject({ elitePatrols: true, spawnCadenceMultiplier: 1 });
    expect(threatTierDefinition(2)).toMatchObject({ elitePatrols: true, spawnCadenceMultiplier: 1.2 });
  });

  it("unlocks each tier only after clearing the tier below", () => {
    expect(unlockedThreatTiers({ 0: 0, 1: 0, 2: 0 })).toEqual([0]);
    expect(unlockedThreatTiers({ 0: 1, 1: 0, 2: 0 })).toEqual([0, 1]);
    expect(unlockedThreatTiers({ 0: 4, 1: 1, 2: 0 })).toEqual([0, 1, 2]);
    expect(unlockedThreatTiers({ 0: 0, 1: 7, 2: 0 })).toEqual([0]);
  });
});
