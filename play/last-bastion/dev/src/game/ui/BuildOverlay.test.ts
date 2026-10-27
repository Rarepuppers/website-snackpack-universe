import { ITEM_CATALOG } from "../content/itemCatalog";
import { RELIC_CATALOG, ARTIFACT_CATALOG } from "../content/relicCatalog";
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


it("shows every owned item trade-off and relic/artifact effect without losing text across pages", () => {
  const sim = new CombatSimulation({ autoStartWaves: false, startingBuild: {
    health: 10, shield: 0, level: 1, experience: 0, scrap: 0,
    weapons: [{ weaponId: "bastion-service-rifle", tier: 1 }], upgrades: [],
    ownedItemIds: [...ITEM_CATALOG.map(item => item.id), "whetstone"],
    relicIds: RELIC_CATALOG.map(relic => relic.id), equippedArtifactId: ARTIFACT_CATALOG[0]!.id,
  } });
  const view = createBuildViewModel(sim.snapshot());
  const model = buildOverlayModel(view);
  expect(model.itemLines.find(line => line.startsWith("Whetstone"))).toContain("x2 — Each: +8% damage.");
  expect(model.itemLines).toHaveLength(ITEM_CATALOG.length);
  const pages = buildPages(model);
  expect(pages.every(page => page.lines.length <= 6)).toBe(true);
  const text = pages.flatMap(page => page.lines).join(" ");
  for (const item of ITEM_CATALOG) expect(text).toContain(item.description);
  for (const relic of RELIC_CATALOG) expect(text).toContain(relic.description);
  for (const artifact of ARTIFACT_CATALOG) {
    const artifactModel = buildOverlayModel({ ...view, artifactId: artifact.id });
    expect(buildPages(artifactModel).flatMap(page => page.lines).join(" ")).toContain(artifact.description);
  }
  expect(sim.snapshot().ownedItemIds).toEqual(view.ownedItemIds);
});
