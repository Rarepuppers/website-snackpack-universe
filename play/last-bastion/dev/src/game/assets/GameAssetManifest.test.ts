import { describe, expect, it } from "vitest";
import { GAME_ASSET_MANIFEST, GAME_ASSETS } from "./GameAssetManifest";

describe("GameAssetManifest", () => {
  it("uses unique stable asset ids", () => {
    const ids = GAME_ASSET_MANIFEST.map((asset) => asset.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("records valid pivots and logical dimensions", () => {
    expect(GAME_ASSET_MANIFEST.every((asset) => (
      asset.logicalWidth > 0
      && asset.logicalHeight > 0
      && asset.pivot.x >= 0
      && asset.pivot.x <= 1
      && asset.pivot.y >= 0
      && asset.pivot.y <= 1
    ))).toBe(true);
  });

  it("keeps body and helmet frame contracts aligned", () => {
    const body = GAME_ASSETS["marine-base-v1"];
    const helmet = GAME_ASSETS["marine-helmet-v1"];
    expect(body.kind).toBe("spritesheet");
    expect(helmet.kind).toBe("spritesheet");
    expect(helmet.logicalWidth).toBe(body.logicalWidth);
    expect(helmet.logicalHeight).toBe(body.logicalHeight);
    if (body.kind === "spritesheet" && helmet.kind === "spritesheet") {
      expect(helmet.frameCount).toBe(body.frameCount);
    }
  });

  it("locks Production Batch A frame contracts", () => {
    const expectedFrames = {
      "arena-floor-v1": 6,
      "arena-boundary-v1": 8,
      "arena-obstacle-v1": 8,
      "combat-effects-v1": 20,
      "pickups-v1": 4,
      "hud-panels-v1": 6,
    } as const;
    expect(GAME_ASSET_MANIFEST).toHaveLength(12);
    for (const [id, frameCount] of Object.entries(expectedFrames)) {
      const asset = GAME_ASSETS[id as keyof typeof GAME_ASSETS];
      expect(asset.kind).toBe("spritesheet");
      if (asset.kind === "spritesheet") expect(asset.frameCount).toBe(frameCount);
    }
  });
});
