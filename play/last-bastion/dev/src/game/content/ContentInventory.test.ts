import { describe, expect, it } from "vitest";
import { BOSS_KINDS, MINI_BOSS_KINDS } from "../combat/CombatSimulation";
import { ELITE_KINDS } from "../combat/EliteCadence";
import { CONTENT_INVENTORY, formatContentInventory, SUPPORT_ENEMY_TYPES } from "./ContentInventory";
import { ENEMY_CATALOG } from "./enemyCatalog";

describe("generated content inventory", () => {
  it(formatContentInventory(), () => {
    expect(CONTENT_INVENTORY).toEqual({
      heroes: 5,
      weaponsTotal: 34,
      weaponsDraftable: 31,
      weaponsUnique: 1,
      weaponsHeroBound: 1,
      weaponsTransformationOnly: 1,
      enemyTypesTotal: 36,
      regularEnemyTypes: 20,
      supportEnemyTypes: 8,
      elites: 7,
      miniBosses: 7,
      bosses: 1,
      items: 47,
      relics: 14,
      artifacts: 12,
      upgrades: 20,
      levelStatCards: 16,
      worldObjects: 29,
      objectiveModes: 4,
    });
  });

  it("partitions every enemy catalogue entry exactly once", () => {
    const partitions = [...SUPPORT_ENEMY_TYPES, ...MINI_BOSS_KINDS, ...BOSS_KINDS];
    expect(new Set(partitions).size).toBe(partitions.length);
    for (const type of partitions) expect(ENEMY_CATALOG[type]).toBeDefined();
    expect(Object.keys(ENEMY_CATALOG).length - partitions.length).toBe(CONTENT_INVENTORY.regularEnemyTypes);
  });

  it("keeps elite and ranked-enemy identities unique", () => {
    expect(new Set(ELITE_KINDS).size).toBe(ELITE_KINDS.length);
    expect(new Set(MINI_BOSS_KINDS).size).toBe(MINI_BOSS_KINDS.length);
    expect(new Set(BOSS_KINDS).size).toBe(BOSS_KINDS.length);
  });
});
