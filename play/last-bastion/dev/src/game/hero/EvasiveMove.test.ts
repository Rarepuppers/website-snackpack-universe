import { describe, expect, it } from "vitest";
import { resolveEvasiveMoveStats, validateEvasiveMoveStats } from "./EvasiveMove";

describe("evasive-move secondary stats", () => {
  const base = {
    durationSeconds: 0.55,
    distanceMetres: 4,
    invulnerabilitySeconds: 0.25,
  };

  it("applies additive and multiplicative modifiers without mutating the base stats", () => {
    const resolved = resolveEvasiveMoveStats(base, [
      { stat: "distanceMetres", add: 1 },
      { stat: "distanceMetres", multiply: 1.2 },
      { stat: "invulnerabilitySeconds", add: 0.05 },
    ]);

    expect(resolved.distanceMetres).toBe(6);
    expect(resolved.invulnerabilitySeconds).toBeCloseTo(0.3);
    expect(base.distanceMetres).toBe(4);
  });

  it("rejects invulnerability that exceeds total duration", () => {
    expect(() => validateEvasiveMoveStats({
      durationSeconds: 0.4,
      distanceMetres: 4,
      invulnerabilitySeconds: 0.5,
    })).toThrow(/cannot exceed/i);
  });
});
