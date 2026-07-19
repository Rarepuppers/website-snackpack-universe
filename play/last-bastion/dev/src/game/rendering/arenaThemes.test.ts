import { describe, expect, it } from "vitest";
import { ARENA_THEMES, arenaThemeById, arenaThemeVariant, pickArenaTheme } from "./arenaThemes";

describe("arenaThemes", () => {
  it("offers a pool of distinct themes with the standard look first", () => {
    expect(ARENA_THEMES.length).toBeGreaterThanOrEqual(4);
    expect(ARENA_THEMES[0]!.id).toBe("bastion-standard");
    expect(new Set(ARENA_THEMES.map((theme) => theme.id)).size).toBe(ARENA_THEMES.length);
  });

  it("resolves themes by id and rejects unknown ids", () => {
    expect(arenaThemeById("emberfall")?.name).toBe("Emberfall Ruin");
    expect(arenaThemeById("not-a-theme")).toBeNull();
    expect(arenaThemeById(null)).toBeNull();
  });

  it("picks deterministically from any seed", () => {
    for (const seed of [0, 1, 7, 1023, -5]) {
      expect(pickArenaTheme(seed)).toBe(pickArenaTheme(seed));
    }
    const picks = new Set([0, 1, 2, 3, 4].map((seed) => pickArenaTheme(seed).id));
    expect(picks.size).toBe(ARENA_THEMES.length);
  });

  it("promotes an authored terrain family for every non-standard world", () => {
    for (const theme of ARENA_THEMES) {
      expect(theme.floorTexture).toBe(theme.id === "bastion-standard" ? "arena-floor-v1" : `${theme.id}-floor-v1`);
      expect(theme.boundaryTexture).toBe(theme.id === "bastion-standard" ? "arena-boundary-v1" : `${theme.id}-boundary-v1`);
      expect(theme.obstacleTexture).toBe(theme.id === "bastion-standard" ? "arena-obstacle-v1" : `${theme.id}-obstacles-v1`);
      expect(theme.decalTexture).toBe(theme.id === "bastion-standard" ? null : `${theme.id}-decals-v1`);
      expect(theme.readabilityWashAlpha).toBeGreaterThanOrEqual(0);
      expect(theme.readabilityWashAlpha).toBeLessThanOrEqual(0.2);
    }
  });

  it("produces deterministic restrained lighting variants without changing assets", () => {
    const theme = arenaThemeById("arctic-relay")!;
    const variant = arenaThemeVariant(theme, 2026);
    expect(variant).toEqual(arenaThemeVariant(theme, 2026));
    expect(variant.floorTexture).toBe(theme.floorTexture);
    expect(variant.floorTint).not.toBe(theme.floorTint);
  });
});
