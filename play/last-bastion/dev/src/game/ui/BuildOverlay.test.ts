import { expect, it } from "vitest";
import { CombatSimulation } from "../combat/CombatSimulation";
import { createBuildViewModel } from "../build/BuildViewModel";
import { buildOverlayModel, buildPages } from "./BuildOverlay";

it("retains all build rows across readable pages", () => {
  const model = buildOverlayModel(createBuildViewModel(new CombatSimulation({ autoStartWaves: false }).snapshot()));
  const relics = Array.from({ length: 19 }, (_, i) => `Relic ${i}`);
  const pages = buildPages({ ...model, relicLines: relics });
  expect(pages.flatMap(page => page.lines).filter(line => line.startsWith("Relic "))).toEqual(relics);
  expect(pages.every(page => page.lines.length <= 6)).toBe(true);
  expect(model.heroLine).not.toContain("perk-");
  expect(model.affinityLines.join(" ")).toContain("Commit 3 / Ascend 5 / Apex 7");
});
