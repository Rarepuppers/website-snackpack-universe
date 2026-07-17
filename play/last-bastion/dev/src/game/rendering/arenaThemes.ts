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
}

export const ARENA_THEMES: readonly ArenaTheme[] = Object.freeze([
  Object.freeze({
    id: "bastion-standard",
    name: "Bastion Perimeter",
    backdropColor: 0x111a25,
    floorTint: 0xffffff,
    boundaryTint: 0xffffff,
    obstacleTint: 0xffffff,
  }),
  Object.freeze({
    id: "emberfall",
    name: "Emberfall Ruin",
    backdropColor: 0x1c120e,
    floorTint: 0xffc9a0,
    boundaryTint: 0xffb489,
    obstacleTint: 0xffd9bb,
  }),
  Object.freeze({
    id: "toxic-bloom",
    name: "Toxic Bloom",
    backdropColor: 0x0f1c12,
    floorTint: 0xbfe8b0,
    boundaryTint: 0xa8d99a,
    obstacleTint: 0xd2f0c4,
  }),
  Object.freeze({
    id: "void-approach",
    name: "Void Approach",
    backdropColor: 0x150f23,
    floorTint: 0xccb8f2,
    boundaryTint: 0xb9a1e8,
    obstacleTint: 0xddccf7,
  }),
  Object.freeze({
    id: "arctic-relay",
    name: "Arctic Relay",
    backdropColor: 0x0d1a23,
    floorTint: 0xbfe2f5,
    boundaryTint: 0xa9d4ec,
    obstacleTint: 0xd3ecf9,
  }),
]);

export function arenaThemeById(id: string | null | undefined): ArenaTheme | null {
  if (!id) {
    return null;
  }
  return ARENA_THEMES.find((theme) => theme.id === id) ?? null;
}

/** Deterministic pick so a run seed (or future map node) always maps to one theme. */
export function pickArenaTheme(seed: number): ArenaTheme {
  const index = Math.abs(Math.floor(seed)) % ARENA_THEMES.length;
  return ARENA_THEMES[index]!;
}
