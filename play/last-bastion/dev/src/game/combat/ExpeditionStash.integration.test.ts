import { describe, expect, it } from "vitest";
import { CombatSimulation } from "./CombatSimulation";
import { expeditionBuildFromCombatSnapshot as capture } from "../expedition/ExpeditionBuildSnapshot";
import { completeCurrentNode, startExpeditionRun } from "../expedition/ExpeditionRun";
import { resolveEventChoice } from "../expedition/EncounterEventCatalog";
import { DEFAULT_SAVE, LocalSaveStore, SAVE_STORAGE_KEY } from "../save/LocalSaveStore";

function reload(build: ReturnType<typeof capture>) {
  const run = completeCurrentNode(startExpeditionRun(61061), build);
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); } };
  new LocalSaveStore(storage).saveExpedition({ ...run.state,
    clearedNodeIds: [...run.state.clearedNodeIds],
    build: { ...run.state.build!, weapons: [...build.weapons], upgrades: [...build.upgrades] } });
  return new LocalSaveStore(storage).load().expedition!.build!;
}
function stored() {
  const sim = new CombatSimulation({ scenario: "weapon-gate", seed: 61061 });
  expect(sim.chooseOption("place:inventory:0")).toBe(true);
  return capture(sim.snapshot());
}

describe("expedition stash persistence", () => {
  it("carries the accepted production stash choice through travel and disk reload without equipping it", () => {
    let build = stored();
    for (let trip = 0; trip < 3; trip++) {
      const sim = new CombatSimulation({ startingBuild: reload(build), autoStartWaves: false });
      expect(capture(sim.snapshot()).weaponStash).toEqual(build.weaponStash);
      expect(sim.snapshot().equippedWeapons.map((weapon) => weapon.weaponId)).toEqual(["bastion-service-rifle"]);
      const tiles = [...sim.snapshot().weaponInventory.rack.map((slot) => slot.tile),
        ...sim.snapshot().weaponInventory.stash].filter((tile) => tile !== null);
      expect(new Set(tiles.map((tile) => tile!.instanceId)).size).toBe(tiles.length);
      build = capture(sim.snapshot());
    }
  });

  it("merges a restored stash weapon, then sells it without resurrection or touching the active gun", () => {
    const merge = new CombatSimulation({ scenario: "weapon-gate", startingBuild: reload(stored()) });
    const option = merge.snapshot().pendingDecision!.options.find((option) => option.id.startsWith("place:merge:inventory:"));
    expect(option).toBeDefined();
    expect(merge.chooseOption(option!.id)).toBe(true);
    expect(merge.snapshot().weaponInventory.stash[0]?.tier).toBe(2);
    const shop = new CombatSimulation({ scenario: "scrap-shop", startingBuild: reload(capture(merge.snapshot())) });
    expect(shop.chooseOption("shop-manage")).toBe(true);
    expect(shop.chooseOption("shop-sell-menu")).toBe(true);
    const tile = shop.snapshot().weaponInventory.stash[0]!;
    expect(shop.chooseOption(`shop-sell:${tile.instanceId}`)).toBe(true);
    expect(new CombatSimulation({ startingBuild: reload(capture(shop.snapshot())) }).snapshot().weaponInventory.stash.every((tile) => tile === null)).toBe(true);
    expect(shop.snapshot().equippedWeapons).toHaveLength(1);
  });

  it.each([null, "perk-quartermaster", "perk-logistician"] as const)("preserves full stash with %s", (perkId) => {
    const capacity = perkId === null ? 4 : perkId === "perk-quartermaster" ? 6 : 7;
    const build = stored();
    build.weaponStash = Array.from({ length: capacity }, (_, index) => ({ weaponId: "scattergun", tier: index % 3 + 1 }));
    const sim = new CombatSimulation({ scenario: "weapon-gate", startingBuild: reload(build), perkId });
    expect(capture(sim.snapshot()).weaponStash).toEqual(build.weaponStash);
    expect(sim.snapshot().pendingDecision!.options.some((option) => option.id.startsWith("place:inventory:"))).toBe(false);
  });

  it("retains occupied bonus slots when the perk changes, but drops empty bonus capacity", () => {
    const build = stored();
    build.weaponStash = [null, null, null, null, null, null, { weaponId: "scattergun", tier: 3 }];
    expect(capture(new CombatSimulation({ startingBuild: reload(build) }).snapshot()).weaponStash).toEqual(build.weaponStash);
    build.weaponStash = [null, null, null, null, null, null, null];
    expect(new CombatSimulation({ startingBuild: reload(build) }).snapshot().weaponInventory.capacity).toBe(4);
  });

  it("keeps stash through an event weapon trade and a failed save followed by retry", () => {
    const build = stored();
    const result = resolveEventChoice(build, 10, {
      id: "trade", label: "Trade",
      outcomes: [{ type: "loseWeapon" }], resultText: "Traded",
    }, 0);
    expect(result.build.weaponStash).toEqual(build.weaponStash);
    const data = new Map<string, string>();
    let fail = true;
    const storage = { getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => { if (fail) throw new Error("quota"); data.set(key, value); } };
    const store = new LocalSaveStore(storage);
    const expedition = { ...startExpeditionRun(61061).state,
      clearedNodeIds: [0], build: { ...build, weapons: [...build.weapons], upgrades: [...build.upgrades] } };
    store.saveExpedition(expedition);
    expect(store.persistence()).toMatchObject({ kind: "failed", operation: "write" });
    expect(store.load().expedition!.build!.weaponStash).toEqual(build.weaponStash);
    fail = false;
    store.saveExpedition(expedition);
    expect(new LocalSaveStore(storage).load().expedition!.build!.weaponStash).toEqual(build.weaponStash);
  });

  it("reads legacy saves with an empty stash and rejects malformed stash entries without shifting slots", () => {
    const build = stored();
    delete build.weaponStash;
    const serialized = JSON.stringify({ ...DEFAULT_SAVE, version: 16,
      expedition: { ...startExpeditionRun(61061).state, build } });
    const save = new LocalSaveStore({ getItem: (key) => key === SAVE_STORAGE_KEY ? serialized : null, setItem: () => {} }).load();
    expect(new CombatSimulation({ startingBuild: save.expedition!.build }).snapshot().weaponInventory.stash).toEqual([null, null, null, null]);
    build.weaponStash = [{ weaponId: "__proto__", tier: 1 }, { weaponId: "scattergun", tier: 99 }, null, { weaponId: "scattergun", tier: 2 }];
    expect(reload(build).weaponStash).toEqual([null, null, null, { weaponId: "scattergun", tier: 2 }]);
  });
});
