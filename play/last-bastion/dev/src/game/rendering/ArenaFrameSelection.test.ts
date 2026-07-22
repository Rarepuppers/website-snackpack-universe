import { describe, expect, it } from "vitest";
import { arenaThemeById, surfaceFrontierTheme, SURFACE_BIOMES } from "./arenaThemes";
import { authoredDecalFrame, authoredFloorFrame, authoredFloorTransform } from "./ArenaFrameSelection";

describe("ArenaFrameSelection", () => {
  it("keeps every Surface Frontier room on one named terrain frame", () => {
    const base = arenaThemeById("surface-frontier")!;
    for (const [index, biome] of SURFACE_BIOMES.entries()) {
      const theme = surfaceFrontierTheme(base, index, biome.id);
      const frames = new Set<number>();
      for (let row = 0; row < 20; row += 1) {
        for (let column = 0; column < 30; column += 1) frames.add(authoredFloorFrame(theme, column, row));
      }
      expect(frames).toEqual(new Set([index]));
    }
  });

  it("uses only the selected biome's restrained decal pool", () => {
    const base = arenaThemeById("surface-frontier")!;
    for (const biome of SURFACE_BIOMES) {
      const theme = surfaceFrontierTheme(base, 0, biome.id);
      const frames = new Set<number>();
      for (let row = 1; row < 20; row += 1) {
        for (let column = 1; column < 30; column += 1) {
          const frame = authoredDecalFrame(theme, column, row);
          if (frame !== null) frames.add(frame);
        }
      }
      expect([...frames].every((frame) => biome.decalFrames.includes(frame))).toBe(true);
    }
  });
});

describe("authoredFloorTransform", () => {
  it("is deterministic and distributes rotations and mirroring", () => {
    const transforms = Array.from({ length: 8 }, (_, row) =>
      Array.from({ length: 8 }, (_, column) => authoredFloorTransform(column, row)),
    ).flat();
    expect(authoredFloorTransform(3, 5)).toEqual(authoredFloorTransform(3, 5));
    expect(new Set(transforms.map(({ angle }) => angle))).toEqual(new Set([0, 90, 180, 270]));
    expect(new Set(transforms.map(({ flipX }) => flipX))).toEqual(new Set([false, true]));
  });
});
