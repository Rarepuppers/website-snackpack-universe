import { describe, expect, it } from "vitest";
import { terrainDamageState, terrainFrameIndex } from "./TerrainVisualState";

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
});
