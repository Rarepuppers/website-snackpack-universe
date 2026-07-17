import { describe, expect, it } from "vitest";
import { ARENA_THEMES, arenaThemeById, pickArenaTheme } from "./arenaThemes";

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
});
