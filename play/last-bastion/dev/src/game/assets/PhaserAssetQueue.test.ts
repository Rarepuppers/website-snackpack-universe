import type Phaser from "phaser";
import { describe, expect, it } from "vitest";
import type { GameAssetDefinition } from "./GameAssetManifest";
import { areGameAssetsLoaded, queueGameAssets } from "./PhaserAssetQueue";

const assets: readonly GameAssetDefinition[] = [
  {
    kind: "image",
    id: "bastion-logistics-map-backdrop-v1",
    url: "backdrop.webp",
    logicalWidth: 1536,
    logicalHeight: 1024,
    pivot: { x: 0.5, y: 0.5 },
  },
  {
    kind: "spritesheet",
    id: "canonical-perk-tiles-v2",
    url: "perks.png",
    logicalWidth: 128,
    logicalHeight: 128,
    pivot: { x: 0.5, y: 0.5 },
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 8,
  },
];

describe("PhaserAssetQueue", () => {
  it("queues image and spritesheet metadata without loading existing textures twice", () => {
    const images: string[] = [];
    const sheets: { id: string; frameWidth: number; frameHeight: number }[] = [];
    const scene = {
      textures: { exists: (id: string) => id === "bastion-logistics-map-backdrop-v1" },
      load: {
        image: (id: string) => images.push(id),
        spritesheet: (
          id: string,
          _url: string,
          frames: { frameWidth: number; frameHeight: number },
        ) => sheets.push({ id, ...frames }),
      },
    } as unknown as Phaser.Scene;

    expect(queueGameAssets(scene, assets)).toBe(1);
    expect(images).toEqual([]);
    expect(sheets).toEqual([
      { id: "canonical-perk-tiles-v2", frameWidth: 128, frameHeight: 128 },
    ]);
  });

  it("reports whether every manifest entry already has a texture", () => {
    const loaded = {
      textures: { exists: () => true },
    } as unknown as Phaser.Scene;
    const partial = {
      textures: { exists: (id: string) => id === assets[0]!.id },
    } as unknown as Phaser.Scene;
    expect(areGameAssetsLoaded(loaded, assets)).toBe(true);
    expect(areGameAssetsLoaded(partial, assets)).toBe(false);
  });
});
