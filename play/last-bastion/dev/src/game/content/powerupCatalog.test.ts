import { describe, expect, it } from "vitest";
import type { PowerupType } from "../combat/CombatSimulation";
import { POWERUP_CATALOG } from "./powerupCatalog";

const ALL_POWERUPS = [
  "overcharge", "aegis", "adrenaline", "magnet-pulse", "uranium-core-rounds", "medkit",
  "siege-loader", "phase-jacket", "hunter-optics", "last-stand-stimulant", "emp-charge", "butchers-serum",
] as const satisfies readonly PowerupType[];

describe("power-up catalog", () => {
  it("has inspect copy for every simulation power-up", () => {
    expect(Object.keys(POWERUP_CATALOG).sort()).toEqual([...ALL_POWERUPS].sort());
    for (const type of ALL_POWERUPS) {
      expect(POWERUP_CATALOG[type].displayName.length).toBeGreaterThan(2);
      expect(POWERUP_CATALOG[type].description).toMatch(/[.!?]$/);
    }
  });
});
