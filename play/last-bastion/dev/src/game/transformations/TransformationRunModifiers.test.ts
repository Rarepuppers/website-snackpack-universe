import { describe, expect, it } from "vitest";
import { applyTransformationChoice, createTransformationAffinityState, type TransformationAffinityState } from "./TransformationAffinity";
import { NO_TRANSFORMATION_MODIFIERS, resolveTransformationModifiers } from "./TransformationRunModifiers";

function pick(state: TransformationAffinityState, pathId: string, choiceId: string): TransformationAffinityState {
  const result = applyTransformationChoice(state, pathId as never, choiceId as never);
  if (!result.ok) throw new Error(`setup failed: ${result.reason}`);
  return result.state;
}

function commit(pathId: string, choiceId: string, times = 3): TransformationAffinityState {
  let state = createTransformationAffinityState();
  for (let i = 0; i < times; i += 1) {
    state = pick(state, pathId, choiceId);
  }
  return state;
}

describe("resolveTransformationModifiers", () => {
  it("returns neutral defaults with no committed path", () => {
    expect(resolveTransformationModifiers(createTransformationAffinityState())).toEqual(NO_TRANSFORMATION_MODIFIERS);
    expect(resolveTransformationModifiers(null)).toEqual(NO_TRANSFORMATION_MODIFIERS);
    expect(resolveTransformationModifiers(undefined)).toEqual(NO_TRANSFORMATION_MODIFIERS);
  });

  it("returns neutral defaults for uncommitted exposure (below 3 Affinity)", () => {
    const exposed = commit("mutagenic-evolution", "dense-tissue", 2);
    expect(resolveTransformationModifiers(exposed)).toEqual(NO_TRANSFORMATION_MODIFIERS);
  });

  it("resolves Dense Tissue's rank-III boon and scar once committed via three identical picks", () => {
    const state = commit("mutagenic-evolution", "dense-tissue", 3);
    const modifiers = resolveTransformationModifiers(state);
    expect(modifiers.committedPathId).toBe("mutagenic-evolution");
    // Three picks of the same choice commit at 3 Affinity AND put that choice at rank III (25%/8%).
    expect(modifiers.maxHealthMultiplier).toBeCloseTo(1.25);
    expect(modifiers.movementSpeedMultiplier).toBeCloseTo(0.92);
  });

  it("resolves rank-I values for three distinct single-picked choices on the same committed path", () => {
    let state = createTransformationAffinityState();
    state = pick(state, "bastion-super-soldier", "heavy-gunner");
    state = pick(state, "bastion-super-soldier", "vanguard-conditioning");
    state = pick(state, "bastion-super-soldier", "demolitions-doctrine");
    const modifiers = resolveTransformationModifiers(state);
    expect(modifiers.committedPathId).toBe("bastion-super-soldier");
    // Each of the three distinct choices contributes its rank-I value once.
    expect(modifiers.heavyWeaponDamageMultiplier).toBeCloseTo(1.12); // Heavy Gunner rank I
    expect(modifiers.armourBonus).toBeCloseTo(2); // Vanguard Conditioning rank I
    expect(modifiers.explosionRadiusMultiplier).toBeCloseTo(1.15); // Demolitions Doctrine rank I
    expect(modifiers.movementSpeedMultiplier).toBeCloseTo(0.96); // Heavy Gunner's scar
    expect(modifiers.fireRateMultiplier).toBeCloseTo(0.95); // Demolitions Doctrine's scar
  });

  it("resolves the new Church of the Designed Arrival path (Zealot fire-rate boon, armour scar)", () => {
    const state = commit("cultist-doctrine", "zealous-fervor", 3);
    const modifiers = resolveTransformationModifiers(state);
    expect(modifiers.committedPathId).toBe("cultist-doctrine");
    expect(modifiers.fireRateMultiplier).toBeCloseTo(1.14); // rank III
    expect(modifiers.armourBonus).toBeCloseTo(-3); // rank III
  });

  it("floors max health and fire rate multipliers so a stacked scar can never zero them out", () => {
    const state = commit("void-initiation", "rift-step", 3); // -12% max health at rank III
    const modifiers = resolveTransformationModifiers(state);
    expect(modifiers.maxHealthMultiplier).toBeGreaterThan(0);
    expect(modifiers.maxHealthMultiplier).toBeCloseTo(0.88);
  });
});
