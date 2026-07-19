import { describe, expect, it } from "vitest";
import {
  findMergeIndex,
  findRecycleIndex,
  MAX_ACTIVE_NUMBERS,
  MERGE_WINDOW_MS,
  playerDamageLabel,
  type MergeableNumber,
} from "./FloatingDamageNumbers";

describe("findMergeIndex", () => {
  it("formats player damage as a distinct leading-minus label", () => {
    expect(playerDamageLabel(2.5)).toBe("−2.5");
  });
  const active: MergeableNumber[] = [
    { enemyId: 1, spawnedAtMs: 1000 },
    { enemyId: 2, spawnedAtMs: 1040 },
    { enemyId: 1, spawnedAtMs: 1050 },
  ];

  it("merges into the most recent young number for the same enemy", () => {
    // Both index 0 and 2 are enemy 1; the newer one (index 2) wins.
    expect(findMergeIndex(active, 1, 1080)).toBe(2);
  });

  it("does not merge across different enemies", () => {
    expect(findMergeIndex(active, 2, 1080)).toBe(1);
    expect(findMergeIndex(active, 3, 1080)).toBe(-1);
  });

  it("starts a fresh number once every candidate has aged past the window", () => {
    const now = 1050 + MERGE_WINDOW_MS + 1;
    expect(findMergeIndex(active, 1, now)).toBe(-1);
  });

  it("treats the window edge as still mergeable", () => {
    expect(findMergeIndex([{ enemyId: 7, spawnedAtMs: 500 }], 7, 500 + MERGE_WINDOW_MS)).toBe(0);
  });

  it("returns -1 for an empty set", () => {
    expect(findMergeIndex([], 1, 0)).toBe(-1);
  });
});

describe("damage-number density", () => {
  const active: MergeableNumber[] = [
    { enemyId: -2, spawnedAtMs: 100 },
    { enemyId: 7, spawnedAtMs: 200 },
    { enemyId: -1, spawnedAtMs: 50 },
    { enemyId: 8, spawnedAtMs: 150 },
  ];

  it("uses a readable 24-label ceiling", () => {
    expect(MAX_ACTIVE_NUMBERS).toBe(24);
  });

  it("recycles the oldest ordinary enemy number before priority feedback", () => {
    expect(findRecycleIndex(active, false)).toBe(3);
  });

  it("can select priority feedback only when a priority label must be admitted", () => {
    expect(findRecycleIndex(active, true)).toBe(2);
    expect(findRecycleIndex(active.filter((entry) => entry.enemyId < 0), false)).toBe(-1);
  });
});
