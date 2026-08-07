import { describe, expect, it } from "vitest";
import { CombatSimulation, upgradeScanOffsets } from "./CombatSimulation";
import { UPGRADE_CATALOG, UPGRADE_ORDER, type UpgradeId } from "../content/upgradeCatalog";

/**
 * The eight upgrades added on 7 Aug 2026 (content plan P5). These tests exist
 * because the `applyUpgrade` switch had no exhaustiveness guard: a new
 * `UpgradeId` compiled cleanly and silently did nothing, which is precisely
 * what happened on the first attempt. The guard is now in place; this proves
 * the effects are real rather than merely present.
 */
const ADDED: readonly UpgradeId[] = [
  "corrosive-rounds", "catalyst-array", "marksman-barrels", "reactive-plating",
  "kinetic-buffer", "capacitor-array", "field-transfusion", "salvage-drones",
];

function simulation(): CombatSimulation {
  return new CombatSimulation({ autoStartWaves: false });
}

/**
 * Levels up until the target upgrade is offered, then takes it. `chooseUpgrade`
 * is a no-op unless an upgrade decision is already queued — calling it directly
 * returns false and changes nothing, which is how the first draft of these
 * tests managed to assert against an unmodified simulation.
 */
function takeUpgrade(run: CombatSimulation, targetId: UpgradeId, maxLevels = 24): boolean {
  for (let attempt = 0; attempt < maxLevels; attempt += 1) {
    const snapshot = run.snapshot();
    if (snapshot.pendingDecision?.kind !== "upgrade") {
      run.addExperience(snapshot.experienceForNextLevel);
      continue;
    }
    const options = snapshot.pendingDecision.options;
    if (options.some((option) => option.id === targetId)) {
      run.chooseOption(targetId);
      return true;
    }
    // Filler must be the stat card, never another upgrade: upgrades consume a
    // limited per-category slot, and taking a rival elemental path would
    // permanently exclude the target. Picking options[0] made these tests
    // unwinnable for anything late in the rotation.
    const statCard = options.find((option) => option.id.startsWith("lvl-"));
    run.chooseOption((statCard ?? options[0]!).id);
  }
  return false;
}

describe("upgrade catalogue expansion", () => {
  it("registers all eight in the catalogue and the offer order", () => {
    for (const id of ADDED) {
      expect(UPGRADE_CATALOG[id], id).toBeDefined();
      expect(UPGRADE_ORDER, id).toContain(id);
    }
  });

  it("gives every upgrade a description for each of its levels", () => {
    for (const id of Object.keys(UPGRADE_CATALOG) as UpgradeId[]) {
      const definition = UPGRADE_CATALOG[id];
      expect(definition.levelDescriptions.length, id).toBe(definition.maxLevel);
    }
  });

  it("makes all three elemental conversion paths mutually exclusive", () => {
    const paths: UpgradeId[] = ["incendiary-rounds", "cryo-coating", "corrosive-rounds"];
    for (const id of paths) {
      const others = paths.filter((other) => other !== id);
      expect([...UPGRADE_CATALOG[id].excludes].sort(), id).toEqual(others.sort());
    }
  });

  it("closes the missing toxic path by converting weapon damage type", () => {
    const run = simulation();
    expect(takeUpgrade(run, "corrosive-rounds")).toBe(true);
    expect(run.snapshot().weapon.damageType).toBe("toxic");
  });

  it("extends weapon range and projectile reach together", () => {
    const before = simulation().snapshot().equippedWeapons[0]!.stats;
    const run = simulation();
    expect(takeUpgrade(run, "marksman-barrels")).toBe(true);
    const after = run.snapshot().equippedWeapons[0]!.stats;
    expect(after.rangeMetres).toBeGreaterThan(before.rangeMetres);
    expect(after.projectileLifetimeSeconds).toBeGreaterThan(before.projectileLifetimeSeconds);
  });

  it("rebalances the catalogue away from being nine-tenths offensive", () => {
    const byCategory = new Map<string, number>();
    for (const id of Object.keys(UPGRADE_CATALOG) as UpgradeId[]) {
      const category = UPGRADE_CATALOG[id].category;
      byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
    }
    // Was 9 offensive / 3 everything-else. Defensive should now be a real
    // branch rather than a token one.
    expect(byCategory.get("defensive")).toBeGreaterThanOrEqual(5);
    expect(byCategory.get("support")).toBeGreaterThanOrEqual(2);
    expect(byCategory.get("scavenger")).toBeGreaterThanOrEqual(2);
  });

  it("applies every upgrade in the catalogue without throwing", () => {
    // The exhaustiveness guard throws for an unwired id, so walking the whole
    // catalogue is a live regression net against adding an inert upgrade.
    for (const id of Object.keys(UPGRADE_CATALOG) as UpgradeId[]) {
      const run = simulation();
      expect(() => takeUpgrade(run, id), id).not.toThrow();
    }
  });
});

describe("upgradeScanOffsets", () => {
  it("covers every position in the rotation exactly once", () => {
    for (const length of [1, 4, 12, 20, 33]) {
      const offsets = upgradeScanOffsets(length);
      expect(offsets, `length ${length}`).toHaveLength(length);
      expect(new Set(offsets).size, `length ${length}`).toBe(length);
      expect(Math.max(...offsets), `length ${length}`).toBe(length - 1);
    }
  });

  it("keeps consecutive offers non-adjacent in the order", () => {
    // The original hand-written pattern's actual purpose: spread by two before
    // falling back to the odd positions.
    expect(upgradeScanOffsets(12)).toEqual([0, 2, 4, 6, 8, 10, 1, 3, 5, 7, 9, 11]);
  });

  it("handles a degenerate length without throwing", () => {
    expect(upgradeScanOffsets(0)).toEqual([]);
  });
});
