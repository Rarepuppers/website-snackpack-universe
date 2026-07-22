import { describe, expect, it } from "vitest";
import { ARENA_THEMES, arenaThemeById, arenaThemeVariant, containmentUnderworldTheme, CONTAINMENT_ROOMS, pickArenaTheme, starshipTransitTheme, STARSHIP_ROOMS, surfaceFrontierTheme, SURFACE_BIOMES } from "./arenaThemes";

describe("arenaThemes", () => {
  it("offers a pool of distinct themes with the standard look first", () => {
    expect(ARENA_THEMES.length).toBeGreaterThanOrEqual(4);
    expect(ARENA_THEMES[0]!.id).toBe("bastion-standard");
    expect(new Set(ARENA_THEMES.map((theme) => theme.id)).size).toBe(ARENA_THEMES.length);
  });

  it("resolves themes by id and rejects unknown ids", () => {
    expect(arenaThemeById("emberfall")?.name).toBe("Emberfall Ruin");
    expect(arenaThemeById("science-wing")?.name).toBe("Bastion Science Wing");
    expect(arenaThemeById("bastion-logistics")?.name).toBe("Bastion Logistics");
    expect(arenaThemeById("machine-foundry")?.name).toBe("Machine Foundry");
    expect(arenaThemeById("alien-hive")?.name).toBe("Alien Hive");
    expect(arenaThemeById("surface-frontier")?.name).toBe("Surface Frontier — Cracked Earth");
    expect(arenaThemeById("starship-transit")?.name).toBe("Starship Transit - Clean Corridor");
    expect(arenaThemeById("containment-underworld")?.name).toBe("Containment - Institutional Wing");
    expect(arenaThemeById("not-a-theme")).toBeNull();
    expect(arenaThemeById(null)).toBeNull();
  });

  it("picks deterministically from any seed", () => {
    for (const seed of [0, 1, 7, 1023, -5]) {
      expect(pickArenaTheme(seed)).toBe(pickArenaTheme(seed));
    }
    const picks = new Set(ARENA_THEMES.map((_, seed) => pickArenaTheme(seed).id));
    expect(picks.size).toBe(ARENA_THEMES.length);
  });

  it("promotes an authored terrain family for every non-standard world", () => {
    for (const theme of ARENA_THEMES) {
      expect(theme.floorTexture).toBe(theme.id === "bastion-standard" ? "arena-floor-v1" : `${theme.id}-floor-v1`);
      expect(theme.boundaryTexture).toBe(theme.id === "bastion-standard" ? "arena-boundary-v1" : `${theme.id}-boundary-v1`);
      const expectedObstacles = theme.id === "bastion-standard"
        ? "arena-obstacle-v1"
        : theme.id === "science-wing" || theme.id === "bastion-logistics" || theme.id === "machine-foundry" || theme.id === "alien-hive" || theme.id === "surface-frontier" || theme.id === "starship-transit" || theme.id === "containment-underworld"
          ? `${theme.id}-fixtures-v1`
          : `${theme.id}-obstacles-v1`;
      expect(theme.obstacleTexture).toBe(expectedObstacles);
      expect(theme.decalTexture).toBe(theme.id === "bastion-standard" ? null : `${theme.id}-decals-v1`);
      expect(theme.readabilityWashAlpha).toBeGreaterThanOrEqual(0);
      expect(theme.readabilityWashAlpha).toBeLessThanOrEqual(0.2);
    }
  });

  it("keeps the Science Wing on high-resolution modular contracts", () => {
    const theme = arenaThemeById("science-wing")!;
    expect(theme.floorTexture).toBe("science-wing-floor-v1");
    expect(theme.boundaryTexture).toBe("science-wing-boundary-v1");
    expect(theme.obstacleTexture).toBe("science-wing-fixtures-v1");
    expect(theme.decalTexture).toBe("science-wing-decals-v1");
    expect(theme.readabilityWashAlpha).toBeLessThanOrEqual(0.1);
  });

  it("keeps Bastion Logistics on high-resolution modular contracts", () => {
    const theme = arenaThemeById("bastion-logistics")!;
    expect(theme.floorTexture).toBe("bastion-logistics-floor-v1");
    expect(theme.boundaryTexture).toBe("bastion-logistics-boundary-v1");
    expect(theme.obstacleTexture).toBe("bastion-logistics-fixtures-v1");
    expect(theme.decalTexture).toBe("bastion-logistics-decals-v1");
    expect(theme.readabilityWashAlpha).toBeLessThanOrEqual(0.1);
  });

  it("keeps Machine Foundry on high-resolution modular contracts", () => {
    const theme = arenaThemeById("machine-foundry")!;
    expect(theme.floorTexture).toBe("machine-foundry-floor-v1");
    expect(theme.boundaryTexture).toBe("machine-foundry-boundary-v1");
    expect(theme.obstacleTexture).toBe("machine-foundry-fixtures-v1");
    expect(theme.decalTexture).toBe("machine-foundry-decals-v1");
    expect(theme.readabilityWashAlpha).toBeLessThanOrEqual(0.1);
  });

  it("keeps Alien Hive on high-resolution modular contracts", () => {
    const theme = arenaThemeById("alien-hive")!;
    expect(theme.floorTexture).toBe("alien-hive-floor-v1");
    expect(theme.boundaryTexture).toBe("alien-hive-boundary-v1");
    expect(theme.obstacleTexture).toBe("alien-hive-fixtures-v1");
    expect(theme.decalTexture).toBe("alien-hive-decals-v1");
    expect(theme.readabilityWashAlpha).toBeLessThanOrEqual(0.12);
  });

  it("selects Surface Frontier biome rows deterministically or by explicit id", () => {
    const base = arenaThemeById("surface-frontier")!;
    for (const [index, biome] of SURFACE_BIOMES.entries()) {
      const seeded = surfaceFrontierTheme(base, index);
      const explicit = surfaceFrontierTheme(base, 999, biome.id);
      expect(seeded.floorFrameOffset).toBe(index);
      expect(explicit.floorFrameOffset).toBe(index);
      expect(explicit.floorFrameCount).toBe(1);
      expect(explicit.decalFrames).toEqual(biome.decalFrames);
    }
  });

  it("selects Starship Transit rooms deterministically or by explicit id", () => {
    const base = arenaThemeById("starship-transit")!;
    for (const [index, room] of STARSHIP_ROOMS.entries()) {
      const seeded = starshipTransitTheme(base, index);
      const explicit = starshipTransitTheme(base, 999, room.id);
      expect(seeded.floorFrameOffset).toBe(index * 4);
      expect(explicit.floorFrameOffset).toBe(index * 4);
      expect(explicit.floorFrameCount).toBe(4);
      expect(explicit.decalFrames).toEqual(room.decalFrames);
      expect(explicit.floorTransformMode).toBe("none");
    }
  });

  it("selects Containment and Underworld families deterministically or explicitly", () => {
    const base = arenaThemeById("containment-underworld")!;
    for (const [index, room] of CONTAINMENT_ROOMS.entries()) {
      const seeded = containmentUnderworldTheme(base, index);
      const explicit = containmentUnderworldTheme(base, 999, room.id);
      expect(seeded.floorFrameOffset).toBe(index * 4);
      expect(explicit.floorFrameOffset).toBe(index * 4);
      expect(explicit.floorFrameCount).toBe(4);
      expect(explicit.decalFrames).toEqual(room.decalFrames);
      expect(explicit.floorTransformMode).toBe("none");
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
