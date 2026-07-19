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
    expect(GAME_ASSET_MANIFEST).toHaveLength(102);
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

  it("locks the held Event Horizon art-preflight contracts", () => {
    const weapon = GAME_ASSETS["event-horizon-v1"];
    const effects = GAME_ASSETS["event-horizon-effects-v1"];
    const tile = GAME_ASSETS["event-horizon-tile-v1"];
    expect(weapon.kind).toBe("spritesheet");
    expect(effects.kind).toBe("spritesheet");
    expect(tile.kind).toBe("image");
    if (weapon.kind === "spritesheet") expect(weapon.frameCount).toBe(4);
    if (effects.kind === "spritesheet") expect(effects.frameCount).toBe(8);
    expect(tile.logicalWidth).toBe(64);
    expect(tile.logicalHeight).toBe(64);
  });

  it("locks the held Batch M Corrupted Human outbreak preflight contracts", () => {
    const survivor = GAME_ASSETS["corrupted-survivor-v1"];
    const marine = GAME_ASSETS["corrupted-marine-v1"];
    const abomination = GAME_ASSETS["abomination-v1"];
    const effects = GAME_ASSETS["corrupted-marine-effects-v1"];
    for (const asset of [survivor, marine, abomination, effects]) expect(asset.kind).toBe("spritesheet");
    if (survivor.kind === "spritesheet") expect(survivor.frameCount).toBe(8);
    if (marine.kind === "spritesheet") expect(marine.frameCount).toBe(12);
    if (abomination.kind === "spritesheet") {
      expect(abomination.frameCount).toBe(12);
      expect(abomination.logicalWidth).toBe(128);
    }
    if (effects.kind === "spritesheet") expect(effects.frameCount).toBe(8);
  });

  it("locks the held Batch H Emberfall world-theme contracts", () => {
    const floor = GAME_ASSETS["emberfall-floor-v1"];
    const boundary = GAME_ASSETS["emberfall-boundary-v1"];
    const obstacles = GAME_ASSETS["emberfall-obstacles-v1"];
    const decals = GAME_ASSETS["emberfall-decals-v1"];
    for (const asset of [floor, boundary, obstacles, decals]) expect(asset.kind).toBe("spritesheet");
    if (floor.kind === "spritesheet") expect(floor.frameCount).toBe(6);
    if (boundary.kind === "spritesheet") expect(boundary.frameCount).toBe(8);
    if (obstacles.kind === "spritesheet") {
      expect(obstacles.frameCount).toBe(4);
      expect(obstacles.logicalWidth).toBe(96);
    }
    if (decals.kind === "spritesheet") expect(decals.frameCount).toBe(6);
  });

  it("locks the held Toxic Bloom Batch H variant contracts", () => {
    const floor = GAME_ASSETS["toxic-bloom-floor-v1"];
    const boundary = GAME_ASSETS["toxic-bloom-boundary-v1"];
    const obstacles = GAME_ASSETS["toxic-bloom-obstacles-v1"];
    const decals = GAME_ASSETS["toxic-bloom-decals-v1"];
    for (const asset of [floor, boundary, obstacles, decals]) expect(asset.kind).toBe("spritesheet");
    if (floor.kind === "spritesheet") expect(floor.frameCount).toBe(6);
    if (boundary.kind === "spritesheet") expect(boundary.frameCount).toBe(8);
    if (obstacles.kind === "spritesheet") expect(obstacles.frameCount).toBe(4);
    if (decals.kind === "spritesheet") expect(decals.frameCount).toBe(6);
  });

  it("locks the held Void Approach Batch H variant contracts", () => {
    expect(GAME_ASSETS["void-approach-floor-v1"].kind).toBe("spritesheet");
    expect(GAME_ASSETS["void-approach-boundary-v1"].kind).toBe("spritesheet");
    expect(GAME_ASSETS["void-approach-obstacles-v1"].kind).toBe("spritesheet");
    expect(GAME_ASSETS["void-approach-decals-v1"].kind).toBe("spritesheet");
  });

  it("locks the held Arctic Relay Batch H variant contracts", () => {
    expect(GAME_ASSETS["arctic-relay-floor-v1"].kind).toBe("spritesheet");
    expect(GAME_ASSETS["arctic-relay-boundary-v1"].kind).toBe("spritesheet");
    expect(GAME_ASSETS["arctic-relay-obstacles-v1"].kind).toBe("spritesheet");
    expect(GAME_ASSETS["arctic-relay-decals-v1"].kind).toBe("spritesheet");
  });

  it("locks Task 36 Aurum and 128 px tile contracts", () => {
    const body = GAME_ASSETS["aurum-hoarder-v1"];
    const effects = GAME_ASSETS["aurum-hoarder-effects-v1"];
    const tiles = GAME_ASSETS["aurum-tiles-v1"];
    for (const asset of [body, effects, tiles]) expect(asset.kind).toBe("spritesheet");
    if (body.kind === "spritesheet") expect(body.frameCount).toBe(12);
    if (effects.kind === "spritesheet") expect(effects.frameCount).toBe(8);
    if (tiles.kind === "spritesheet") {
      expect(tiles.frameCount).toBe(8);
      expect(tiles.logicalWidth).toBe(128);
      expect(tiles.logicalHeight).toBe(128);
    }
  });

  it("locks Production Batch O Rift Stalker contracts", () => {
    const body = GAME_ASSETS["rift-stalker-v1"];
    const effects = GAME_ASSETS["rift-stalker-effects-v1"];
    const portrait = GAME_ASSETS["rift-stalker-portrait-v1"];
    expect(body.kind).toBe("spritesheet");
    expect(effects.kind).toBe("spritesheet");
    expect(portrait.kind).toBe("image");
    if (body.kind === "spritesheet") {
      expect(body.frameCount).toBe(16);
      expect(body.logicalWidth).toBe(128);
    }
    if (effects.kind === "spritesheet") expect(effects.frameCount).toBe(8);
  });

  it("locks the production Scrap Shop Batch N2 contracts", () => {
    const offers = GAME_ASSETS["scrap-shop-offer-tiles-v1"];
    const hud = GAME_ASSETS["scrap-shop-hud-v1"];
    const panel = GAME_ASSETS["scrap-shop-panel-v1"];
    expect(offers.kind).toBe("spritesheet");
    expect(hud.kind).toBe("spritesheet");
    expect(panel.kind).toBe("image");
    if (offers.kind === "spritesheet") {
      expect(offers.frameCount).toBe(6);
      expect(offers.logicalWidth).toBe(128);
    }
    if (hud.kind === "spritesheet") expect(hud.frameCount).toBe(4);
    expect(panel.logicalWidth).toBe(1024);
    expect(panel.logicalHeight).toBe(576);
  });

  it("locks the Batch Q Quartermaster presentation contract", () => {
    const keeper = GAME_ASSETS["quartermaster-v1"];
    expect(keeper.kind).toBe("spritesheet");
    expect(keeper.logicalWidth).toBe(128);
    expect(keeper.logicalHeight).toBe(256);
    if (keeper.kind === "spritesheet") expect(keeper.frameCount).toBe(6);
  });

  it("locks the promoted Batch I 128 px tile contracts", () => {
    for (const id of ["batch-i-weapon-tiles-v1", "batch-i-perk-tiles-v1", "batch-i-hotkey-tiles-v1"] as const) {
      const asset = GAME_ASSETS[id];
      expect(asset.kind).toBe("spritesheet");
      if (asset.kind === "spritesheet") {
        expect(asset.frameCount).toBe(8);
        expect(asset.logicalWidth).toBe(128);
        expect(asset.logicalHeight).toBe(128);
      }
    }
  });

  it("locks the production Batch I2 and I3 contracts", () => {
    const slots = GAME_ASSETS["batch-i-slot-tier-ui-v1"];
    const glyphs = GAME_ASSETS["batch-i-shop-glyphs-v1"];
    expect(slots.kind).toBe("spritesheet");
    expect(glyphs.kind).toBe("spritesheet");
    if (slots.kind === "spritesheet") {
      expect(slots.frameCount).toBe(16);
      expect(slots.logicalWidth).toBe(128);
    }
    if (glyphs.kind === "spritesheet") expect(glyphs.frameCount).toBe(3);
    expect(GAME_ASSETS["batch-i-placement-modal-v1"].logicalWidth).toBe(900);
    expect(GAME_ASSETS["batch-i-placement-modal-v1"].logicalHeight).toBe(560);
    expect(GAME_ASSETS["batch-i-weapon-stat-card-v1"].logicalWidth).toBe(320);
    expect(GAME_ASSETS["batch-i-shop-counter-v1"].logicalWidth).toBe(1200);
  });

  it("locks the production Batch J1 and J2 contracts", () => {
    const expected = {
      "swarm-scuttler-v1": [64, 8],
      "razorlord-v1": [96, 16],
      "blightspitter-v1": [96, 12],
      "quillback-matriarch-v1": [128, 16],
      "telegraph-large-v1": [128, 8],
      "telegraph-small-v1": [64, 12],
      "telegraph-danger-fill-v1": [64, 4],
    } as const;
    for (const [id, [size, frames]] of Object.entries(expected)) {
      const asset = GAME_ASSETS[id as keyof typeof GAME_ASSETS];
      expect(asset.kind).toBe("spritesheet");
      if (asset.kind === "spritesheet") {
        expect(asset.logicalWidth).toBe(size);
        expect(asset.logicalHeight).toBe(size);
        expect(asset.frameCount).toBe(frames);
      }
    }
  });
});
