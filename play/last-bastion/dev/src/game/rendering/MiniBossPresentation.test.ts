import { describe, expect, it } from "vitest";
import { miniBossSpriteScale } from "./MiniBossPresentation";

describe("mini-boss gameplay silhouettes", () => {
  it("keeps all three authored bodies inside the approved 1.25–1.45 scale band", () => {
    for (const kind of ["siege-crusher", "brood-warden", "rift-stalker"] as const) {
      expect(miniBossSpriteScale(kind)).toBeGreaterThanOrEqual(1.25);
      expect(miniBossSpriteScale(kind)).toBeLessThanOrEqual(1.45);
    }
  });
});
