import type Phaser from "phaser";
import { describe, expect, it } from "vitest";
import type { GameAssetId } from "./GameAssetManifest";
import { loadGameAssetIds } from "./PhaserAssetLoader";

describe("loadGameAssetIds", () => {
  it("queues only requested assets and skips existing textures", () => {
    const images: string[] = [];
    const sheets: string[] = [];
    const scene = {
      textures: { exists: (id: string) => id === "marine-select-portrait-v1" },
      load: {
        image: (id: string) => images.push(id),
        spritesheet: (id: string) => sheets.push(id),
      },
    } as unknown as Phaser.Scene;

    expect(loadGameAssetIds(scene, [
      "bastion-logistics-map-backdrop-v1",
      "marine-select-portrait-v1",
    ])).toBe(1);
    expect(images).toEqual(["bastion-logistics-map-backdrop-v1"]);
    expect(sheets).toEqual([]);
  });

  it("fails fast when an invalid runtime id bypasses TypeScript", () => {
    const scene = {
      textures: { exists: () => false },
      load: { image: () => undefined, spritesheet: () => undefined },
    } as unknown as Phaser.Scene;
    expect(() => loadGameAssetIds(scene, ["missing-asset" as GameAssetId]))
      .toThrow("Unknown game asset id: missing-asset");
  });
});
