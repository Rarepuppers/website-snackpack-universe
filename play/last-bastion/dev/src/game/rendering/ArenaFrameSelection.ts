import type { ArenaTheme } from "./arenaThemes";

export function authoredFloorFrame(theme: ArenaTheme, column: number, row: number): number {
  const seed = (column * 17 + row * 31) % 23;
  const localFrame = seed === 0 ? 4 : seed === 1 ? 3 : seed < 6 ? 1 + (seed % 2) : 0;
  const count = theme.floorFrameCount ?? 5;
  const offset = theme.floorFrameOffset ?? 0;
  return offset + (localFrame % count);
}

export interface AuthoredFloorTransform {
  readonly angle: 0 | 90 | 180 | 270;
  readonly flipX: boolean;
}

/** Breaks up repeated single-frame terrain without changing its biome identity. */
export function authoredFloorTransform(column: number, row: number): AuthoredFloorTransform {
  const seed = Math.abs(column * 73 + row * 151 + column * row * 19);
  return {
    angle: ([0, 90, 180, 270] as const)[seed % 4]!,
    flipX: Math.floor(seed / 4) % 2 === 1,
  };
}

export function authoredDecalFrame(theme: ArenaTheme, column: number, row: number): number | null {
  const seed = (column * 37 + row * 53) % 29;
  if (seed > 3) return null;
  const frames = theme.decalFrames ?? [0, 1, 2, 3, 4, 5];
  return frames[seed % frames.length] ?? null;
}
