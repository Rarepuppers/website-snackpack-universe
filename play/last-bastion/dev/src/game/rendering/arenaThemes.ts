/**
 * Presentation-only arena themes: seeded tint/backdrop variations over the
 * shared floor, boundary, and obstacle atlases. This is the first step of the
 * expedition plan's half-procedural background variety — the map later hands
 * each node a world id whose theme pool this module resolves, and Codex
 * eventually supplies authored per-world floor sets that replace pure tints.
 * Themes never affect simulation state.
 */
export interface ArenaTheme {
  id: string;
  name: string;
  backdropColor: number;
  floorTint: number;
  boundaryTint: number;
  obstacleTint: number;
  floorTexture: string;
  boundaryTexture: string;
  obstacleTexture: string;
  decalTexture: string | null;
  /** Neutral veil above terrain/decal art and below gameplay actors. */
  readabilityWashAlpha: number;
}

export const ARENA_THEMES: readonly ArenaTheme[] = Object.freeze([
  Object.freeze({
    id: "bastion-standard",
    name: "Bastion Perimeter",
    backdropColor: 0x111a25,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xffffff,
    floorTexture: "arena-floor-v1",
    boundaryTexture: "arena-boundary-v1",
    obstacleTexture: "arena-obstacle-v1",
    decalTexture: null,
    readabilityWashAlpha: 0,
  }),
  Object.freeze({
    id: "emberfall",
    name: "Emberfall Ruin",
    backdropColor: 0x1c120e,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xffffff,
    floorTexture: "emberfall-floor-v1",
    boundaryTexture: "emberfall-boundary-v1",
    obstacleTexture: "emberfall-obstacles-v1",
    decalTexture: "emberfall-decals-v1",
    readabilityWashAlpha: 0.08,
  }),
  Object.freeze({
    id: "toxic-bloom",
    name: "Toxic Bloom",
    backdropColor: 0x0f1c12,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xffffff,
    floorTexture: "toxic-bloom-floor-v1",
    boundaryTexture: "toxic-bloom-boundary-v1",
    obstacleTexture: "toxic-bloom-obstacles-v1",
    decalTexture: "toxic-bloom-decals-v1",
    readabilityWashAlpha: 0.1,
  }),
  Object.freeze({
    id: "void-approach",
    name: "Void Approach",
    backdropColor: 0x150f23,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xffffff,
    floorTexture: "void-approach-floor-v1",
    boundaryTexture: "void-approach-boundary-v1",
    obstacleTexture: "void-approach-obstacles-v1",
    decalTexture: "void-approach-decals-v1",
    readabilityWashAlpha: 0.1,
  }),
  Object.freeze({
    id: "arctic-relay",
    name: "Arctic Relay",
    backdropColor: 0x0d1a23,
    floorTint: 0x9eb5c0,
    boundaryTint: 0xb3c8d1,
    obstacleTint: 0xa9bec8,
    floorTexture: "arctic-relay-floor-v1",
    boundaryTexture: "arctic-relay-boundary-v1",
    obstacleTexture: "arctic-relay-obstacles-v1",
    decalTexture: "arctic-relay-decals-v1",
    readabilityWashAlpha: 0.2,
  }),
]);

export function arenaThemeById(id: string | null | undefined): ArenaTheme | null {
  if (!id) {
    return null;
  }
  return ARENA_THEMES.find((theme) => theme.id === id) ?? null;
}

/** Three restrained lighting variants per world; collision art stays identical. */
export function arenaThemeVariant(theme: ArenaTheme, seed: number): ArenaTheme {
  const variant = Math.abs(Math.floor(seed)) % 3;
  if (variant === 0) return theme;
  const multiplier = variant === 1 ? 0.94 : 0.88;
  return {
    ...theme,
    floorTint: scaleRgb(theme.floorTint, multiplier),
    boundaryTint: scaleRgb(theme.boundaryTint, Math.min(1, multiplier + 0.04)),
    obstacleTint: scaleRgb(theme.obstacleTint, Math.min(1, multiplier + 0.03)),
  };
}

/** Deterministic pick so a run seed (or future map node) always maps to one theme. */
export function pickArenaTheme(seed: number): ArenaTheme {
  const index = Math.abs(Math.floor(seed)) % ARENA_THEMES.length;
  return ARENA_THEMES[index]!;
}

function scaleRgb(color: number, multiplier: number): number {
  const red = Math.round(((color >>> 16) & 0xff) * multiplier);
  const green = Math.round(((color >>> 8) & 0xff) * multiplier);
  const blue = Math.round((color & 0xff) * multiplier);
  return (red << 16) | (green << 8) | blue;
}
