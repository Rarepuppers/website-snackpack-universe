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
    expect(GAME_ASSET_MANIFEST).toHaveLength(30);
    for (const [id, frameCount] of Object.entries(expectedFrames)) {
      const asset = GAME_ASSETS[id as keyof typeof GAME_ASSETS];
      expect(asset.kind).toBe("spritesheet");
      if (asset.kind === "spritesheet") expect(asset.frameCount).toBe(frameCount);
    }
  });

  it("locks Production Batch B frame contracts", () => {
    const expectedFrames = {
      "slime-spitter-v1": 12,
      "carapace-scuttler-v1": 16,
      "siege-crusher-v1": 12,
      "batch-b-effects-v1": 20,
    } as const;
    for (const [id, frameCount] of Object.entries(expectedFrames)) {
      const asset = GAME_ASSETS[id as keyof typeof GAME_ASSETS];
      expect(asset.kind).toBe("spritesheet");
      if (asset.kind === "spritesheet") expect(asset.frameCount).toBe(frameCount);
    }
    expect(GAME_ASSETS["scattergun-v1"].kind).toBe("image");
    expect(GAME_ASSETS["arc-carbine-v1"].kind).toBe("image");
    expect(GAME_ASSETS["siege-crusher-portrait-v1"].kind).toBe("image");
  });

  it("locks the gameplay-critical Production Batch C contracts", () => {
    const expectedFrames = {
      "blast-mite-v1": 12,
      "warp-flanker-v1": 12,
      "batch-c-rewards-v1": 16,
      "batch-c-effects-v1": 20,
    } as const;
    for (const [id, frameCount] of Object.entries(expectedFrames)) {
      const asset = GAME_ASSETS[id as keyof typeof GAME_ASSETS];
      expect(asset.kind).toBe("spritesheet");
      if (asset.kind === "spritesheet") expect(asset.frameCount).toBe(frameCount);
    }
  });

  it("locks Production Batch D1 Brood Warden contracts", () => {
    const body = GAME_ASSETS["brood-warden-v1"];
    const effects = GAME_ASSETS["brood-warden-effects-v1"];
    expect(body.kind).toBe("spritesheet");
    expect(effects.kind).toBe("spritesheet");
    if (body.kind === "spritesheet") expect(body.frameCount).toBe(12);
    if (effects.kind === "spritesheet") expect(effects.frameCount).toBe(10);
    expect(GAME_ASSETS["brood-warden-portrait-v1"].kind).toBe("image");
  });

  it("locks Production Batch D2 Ripper contracts", () => {
    const body = GAME_ASSETS["ripper-v1"];
    const effects = GAME_ASSETS["ripper-effects-v1"];
    expect(body.kind).toBe("spritesheet");
    expect(effects.kind).toBe("spritesheet");
    if (body.kind === "spritesheet") expect(body.frameCount).toBe(16);
    if (effects.kind === "spritesheet") expect(effects.frameCount).toBe(8);
  });

  it("locks Production Batch E1 Quillback contracts", () => {
    const body = GAME_ASSETS["quillback-v1"];
    const effects = GAME_ASSETS["quillback-effects-v1"];
    expect(body.kind).toBe("spritesheet");
    expect(effects.kind).toBe("spritesheet");
    if (body.kind === "spritesheet") expect(body.frameCount).toBe(12);
    if (effects.kind === "spritesheet") expect(effects.frameCount).toBe(8);
  });
});
