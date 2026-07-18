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
    expect(GAME_ASSET_MANIFEST).toHaveLength(54);
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

  it("locks Production Batch D4 Razor Scuttler contracts", () => {
    const body = GAME_ASSETS["razor-scuttler-v1"];
    const effects = GAME_ASSETS["razor-scuttler-effects-v1"];
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

  it("locks Production Batch E2 Spinewheel contracts", () => {
    const body = GAME_ASSETS["spinewheel-v1"];
    const shell = GAME_ASSETS["spinewheel-shell-v1"];
    const effects = GAME_ASSETS["spinewheel-effects-v1"];
    expect(body.kind).toBe("spritesheet");
    expect(shell.kind).toBe("spritesheet");
    expect(effects.kind).toBe("spritesheet");
    if (body.kind === "spritesheet") expect(body.frameCount).toBe(12);
    if (shell.kind === "spritesheet") expect(shell.frameCount).toBe(4);
    if (effects.kind === "spritesheet") expect(effects.frameCount).toBe(8);
  });

  it("locks Production Batch E3 Tether Bloom contracts", () => {
    const body = GAME_ASSETS["tether-bloom-v1"];
    const effects = GAME_ASSETS["tether-bloom-effects-v1"];
    expect(body.kind).toBe("spritesheet");
    expect(effects.kind).toBe("spritesheet");
    if (body.kind === "spritesheet") expect(body.frameCount).toBe(16);
    if (effects.kind === "spritesheet") expect(effects.frameCount).toBe(8);
  });

  it("locks Production Batch D3 Bastion Eater contracts", () => {
    const body = GAME_ASSETS["bastion-eater-v1"];
    const nodes = GAME_ASSETS["bastion-eater-nodes-v1"];
    const effects = GAME_ASSETS["bastion-eater-effects-v1"];
    const environment = GAME_ASSETS["bastion-eater-environment-v1"];
    expect(body.kind).toBe("spritesheet");
    expect(nodes.kind).toBe("spritesheet");
    expect(effects.kind).toBe("spritesheet");
    expect(environment.kind).toBe("spritesheet");
    if (body.kind === "spritesheet") expect(body.frameCount).toBe(12);
    if (nodes.kind === "spritesheet") expect(nodes.frameCount).toBe(8);
    if (effects.kind === "spritesheet") expect(effects.frameCount).toBe(12);
    if (environment.kind === "spritesheet") expect(environment.frameCount).toBe(8);
    expect(GAME_ASSETS["bastion-eater-portrait-v1"].kind).toBe("image");
  });

  it("locks Production Batch F1 weapon and UI contracts", () => {
    const blade = GAME_ASSETS["patrol-blade-v1"];
    const effects = GAME_ASSETS["patrol-blade-effects-v1"];
    const tiles = GAME_ASSETS["action-tiles-v1"];
    expect(blade.kind).toBe("spritesheet");
    expect(effects.kind).toBe("spritesheet");
    expect(tiles.kind).toBe("spritesheet");
    if (blade.kind === "spritesheet") expect(blade.frameCount).toBe(4);
    if (effects.kind === "spritesheet") expect(effects.frameCount).toBe(6);
    if (tiles.kind === "spritesheet") expect(tiles.frameCount).toBe(6);
    expect(GAME_ASSETS["uranium-status-v1"].kind).toBe("image");
  });

  it("locks Production Batches F2-F4 weapon, projectile, and tile contracts", () => {
    for (const id of ["bolt-carbine-v1", "bulwark-rotary-cannon-v1", "grenade-tube-v1"] as const) {
      const asset = GAME_ASSETS[id];
      expect(asset.kind).toBe("spritesheet");
      if (asset.kind === "spritesheet") expect(asset.frameCount).toBe(4);
    }
    for (const id of ["bolt-carbine-effects-v1", "bulwark-rotary-effects-v1", "grenade-tube-effects-v1"] as const) {
      const asset = GAME_ASSETS[id];
      expect(asset.kind).toBe("spritesheet");
      if (asset.kind === "spritesheet") expect(asset.frameCount).toBe(8);
    }
    const tiles = GAME_ASSETS["weapon-tiles-v1"];
    expect(tiles.kind).toBe("spritesheet");
    if (tiles.kind === "spritesheet") expect(tiles.frameCount).toBe(3);
  });

  it("locks Production Batch K's shared status-overlay contract", () => {
    const overlays = GAME_ASSETS["status-overlays-v1"];
    expect(overlays.kind).toBe("spritesheet");
    expect(overlays.logicalWidth).toBe(48);
    expect(overlays.logicalHeight).toBe(48);
    if (overlays.kind === "spritesheet") expect(overlays.frameCount).toBe(16);
  });
});
