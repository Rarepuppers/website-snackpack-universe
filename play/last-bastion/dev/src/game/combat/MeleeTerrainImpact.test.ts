import { describe, expect, it, vi } from "vitest";
import { planMeleeTerrainImpact } from "./MeleeTerrainImpact";

const obstacles = [
  { id: "first", x: 3, y: 4, width: 2, height: 4 },
  { id: "second", x: 7, y: 8, width: 1, height: 1 },
];

describe("MeleeTerrainImpact", () => {
  it("uses the first intersecting obstacle and plans its centre impact", () => {
    const intersects = vi.fn((_from, _to, obstacle: (typeof obstacles)[number]) => obstacle.id !== "none");
    const result = planMeleeTerrainImpact({
      obstacles,
      anchor: { x: 1, y: 2 },
      facing: { x: 1, y: 0 },
      reachMetres: 5,
      projectileDamage: 10,
      weaponDamageMultiplier: () => 1.5,
      powerupDamageMultiplier: () => 2,
      terrainDamageMultiplier: 3,
      relicTerrainDamageMultiplier: 4,
      intersects,
    });

    expect(result).toEqual({
      obstacle: obstacles[0],
      damage: 360,
      impactPosition: { x: 4, y: 6 },
    });
    expect(intersects).toHaveBeenCalledTimes(1);
    expect(intersects).toHaveBeenCalledWith({ x: 1, y: 2 }, { x: 6, y: 2 }, obstacles[0]);
  });

  it("returns no impact when the sweep misses every obstacle", () => {
    const weaponDamageMultiplier = vi.fn(() => 1);
    const powerupDamageMultiplier = vi.fn(() => 1);
    expect(planMeleeTerrainImpact({
      obstacles,
      anchor: { x: 0, y: 0 },
      facing: { x: 0, y: 1 },
      reachMetres: 2,
      projectileDamage: 1,
      weaponDamageMultiplier,
      powerupDamageMultiplier,
      terrainDamageMultiplier: 1,
      relicTerrainDamageMultiplier: 1,
      intersects: () => false,
    })).toBeNull();
    expect(weaponDamageMultiplier).not.toHaveBeenCalled();
    expect(powerupDamageMultiplier).not.toHaveBeenCalled();
  });
});
