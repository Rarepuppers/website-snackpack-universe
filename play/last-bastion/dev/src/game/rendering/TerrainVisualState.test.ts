import { describe, expect, it } from "vitest";
import { obstacleFrameIndex, terrainDamageState, terrainFrameIndex, worldObjectArtAssetId } from "./TerrainVisualState";

describe("TerrainVisualState", () => {
  it("locks the code-owned durability thresholds", () => {
    expect(terrainDamageState(100, 100)).toBe("intact");
    expect(terrainDamageState(75, 100)).toBe("intact");
    expect(terrainDamageState(74.99, 100)).toBe("damaged");
    expect(terrainDamageState(35, 100)).toBe("damaged");
    expect(terrainDamageState(34.99, 100)).toBe("critical");
    expect(terrainDamageState(0, 100)).toBe("destroyed");
  });

  it("maps every terrain row to four stable contiguous frames", () => {
    const kinds = ["fence", "cargo-crate", "barricade", "boulder", "power-conduit", "reinforced-cover", "biomass"] as const;
    kinds.forEach((kind, row) => {
      expect([
        terrainFrameIndex(kind, 100, 100),
        terrainFrameIndex(kind, 60, 100),
        terrainFrameIndex(kind, 20, 100),
        terrainFrameIndex(kind, 0, 100),
      ]).toEqual([row * 4, row * 4 + 1, row * 4 + 2, row * 4 + 3]);
    });
  });

  it("uses themed O1 rows for furnished obstacles and preserves legacy fallback", () => {
    const furnished = { kind: "boulder", worldObjectId: "alien-crystal" } as const;
    expect(worldObjectArtAssetId(furnished)).toBe("world-objects-organic-v1");
    expect(obstacleFrameIndex(furnished, 100, 100)).toBe(12);
    expect(obstacleFrameIndex(furnished, 20, 100)).toBe(14);
    expect(obstacleFrameIndex({ kind: "boulder" }, 20, 100)).toBe(14);
  });
});
