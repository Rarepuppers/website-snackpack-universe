import { expect, it } from "vitest";
import { affinityHudModel } from "./AffinityHudModel";
import { applyTransformationChoice, createTransformationAffinityState } from "../transformations/TransformationAffinity";
import { CombatSimulation } from "../combat/CombatSimulation";
import { createBuildViewModel } from "../build/BuildViewModel";
import { buildOverlayModel, buildPages } from "./BuildOverlay";

it("warns before the real commitment boundary and follows committed progression", () => {
  let state = createTransformationAffinityState();
  expect(affinityHudModel(state)).toBeNull();
  for (let i = 0; i < 3; i++) {
    const result = applyTransformationChoice(state, "void-initiation", "gravity-adept");
    expect(result.ok).toBe(true);
    if (result.ok) state = result.state;
    if (i === 1) expect(affinityHudModel(state)?.detail).toContain("Next aligned choice commits");
  }
  expect(affinityHudModel(state)?.title).toBe("Void Initiation 3/5");
  expect(affinityHudModel(state)?.detail).toContain("Ascend at 5");
  const simulation = new CombatSimulation({ autoStartWaves: false, startingTransformation: state });
  const model = buildOverlayModel(createBuildViewModel(simulation.snapshot()));
  expect(model.affinityLines.join(" ")).toContain("Cost:");
  expect(model.affinityLines.join(" ")).toContain("Gravity Adept");
  const pages = buildPages(model);
  expect(pages.every(page => page.lines.length <= 6 && page.lines.every(line => line.length <= 62))).toBe(true);
});
