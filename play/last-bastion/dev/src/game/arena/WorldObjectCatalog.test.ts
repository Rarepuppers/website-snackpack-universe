import { describe, expect, it } from "vitest";
import { WORLD_OBJECT_CATALOG, worldObjectById, worldObjectsForTheme } from "./WorldObjectCatalog";

describe("WorldObjectCatalog", () => {
  it("uses unique ids and valid durability/placement limits", () => {
    expect(new Set(WORLD_OBJECT_CATALOG.map(({ id }) => id)).size).toBe(WORLD_OBJECT_CATALOG.length);
    for (const object of WORLD_OBJECT_CATALOG) {
      if (object.durability !== null) expect(object.durability).toBeGreaterThan(0);
      expect(object.maxPerRoom).toBeGreaterThan(0);
      expect(object.footprintMetres.width).toBeGreaterThan(0);
      expect(object.footprintMetres.height).toBeGreaterThan(0);
    }
  });

  it("locks the weapon-upgrade risk window to 45 seconds", () => {
    expect(worldObjectById("weapon-upgrade-station")?.interaction?.effect).toEqual({
      type: "upgrade-weapon",
      weaponDisabledSeconds: 45,
    });
  });

  it("provides hazards and tactical objects for every production family", () => {
    for (const theme of ["bastion", "science", "logistics", "foundry", "hive", "surface", "starship", "containment", "underworld"] as const) {
      const objects = worldObjectsForTheme(theme);
      expect(objects.length).toBeGreaterThanOrEqual(4);
      expect(objects.some(({ role }) => role === "obstacle" || role === "hybrid")).toBe(true);
    }
  });

  it("keeps teleporter, stargate, gate, cryo, turret, trap, and hazard effects code-owned", () => {
    for (const id of ["monster-teleporter", "stargate", "reinforced-gate", "cryogenic-tube", "turret-console", "trap-console", "slime-pool", "toxic-pool", "fire-patch", "lava-tile"]) {
      const object = worldObjectById(id);
      expect(object).not.toBeNull();
      expect(object?.interaction ?? object?.hazard).toBeDefined();
    }
  });

  it("binds all twelve Object Batch O1 rows without collisions", () => {
    const bindings = WORLD_OBJECT_CATALOG.flatMap((object) => object.art
      ? [`${object.art.assetId}:${object.art.row}`]
      : []);
    expect(bindings).toHaveLength(12);
    expect(new Set(bindings).size).toBe(12);
    for (const object of WORLD_OBJECT_CATALOG.filter(({ art }) => art)) {
      expect(object.art?.row).toBeGreaterThanOrEqual(0);
      expect(object.art?.row).toBeLessThan(4);
    }
  });
});
