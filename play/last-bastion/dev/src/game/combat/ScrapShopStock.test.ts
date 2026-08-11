import { describe, expect, it } from "vitest";
import { rotatingWindow } from "./ScrapShopStock";

describe("ScrapShopStock", () => {
  it("selects and wraps a stable rotating stock window", () => {
    const entries = ["a", "b", "c", "d", "e"];
    expect(rotatingWindow(entries, 3, 1)).toEqual(["b", "c", "d"]);
    expect(rotatingWindow(entries, 3, 4)).toEqual(["e", "a", "b"]);
  });

  it("normalizes negative and oversized offsets", () => {
    const entries = ["a", "b", "c", "d", "e"];
    expect(rotatingWindow(entries, 3, -1)).toEqual(["e", "a", "b"]);
    expect(rotatingWindow(entries, 3, 12)).toEqual(["c", "d", "e"]);
  });

  it("preserves the source when it fits and handles empty or zero-sized windows", () => {
    const entries = ["a", "b"];
    expect(rotatingWindow(entries, 3, 1)).toBe(entries);
    expect(rotatingWindow([], 3, 0)).toEqual([]);
    expect(rotatingWindow(entries, 0, 0)).toEqual([]);
  });
});
