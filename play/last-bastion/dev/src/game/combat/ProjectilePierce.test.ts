import { describe, expect, it } from "vitest";
import { resolveProjectilePierceContinuation } from "./ProjectilePierce";

describe("ProjectilePierce", () => {
  it("consumes one available pierce and continues", () => {
    expect(resolveProjectilePierceContinuation(2)).toEqual({ pierceRemaining: 1, continues: true });
  });

  it("stops without changing an exhausted pierce value", () => {
    expect(resolveProjectilePierceContinuation(0)).toEqual({ pierceRemaining: 0, continues: false });
    expect(resolveProjectilePierceContinuation(-1)).toEqual({ pierceRemaining: -1, continues: false });
  });
});
