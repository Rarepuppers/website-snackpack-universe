import { describe, expect, it } from "vitest";
import {
  HAZARD_SPAWN_CLEARANCE_METRES,
  MAX_FLOOR_COVERAGE,
  MIN_LANE_WIDTH_METRES,
  placeWorldObjects,
  SPAWN_CLEARANCE_METRES,
} from "./WorldObjectPlacement";
import {
  ARENA_THEME_FAMILY_IDS,
  IMPLEMENTED_INTERACTION_EFFECTS,
  worldObjectById,
  worldThemeFamilyForArenaTheme,
  WORLD_OBJECT_CATALOG,
} from "./WorldObjectCatalog";

/**
 * `WorldObjectCatalog` was imported by nothing but its own test from the day it
 * was authored. These cover the layer that finally puts it on the floor — and
 * they assert the density gates from `world-object-production-plan.md` as
 * *behaviour*, because a gate that lives only in a document is a gate that gets
 * violated the first time someone tunes a number.
 */

const ARENA = { widthMetres: 45, heightMetres: 25.3125 };

describe("world object placement", () => {
  it("is deterministic for a theme, arena and seed", () => {
    const first = placeWorldObjects({ theme: "alien-hive", ...ARENA, seed: 4242 });
    const second = placeWorldObjects({ theme: "alien-hive", ...ARENA, seed: 4242 });
    expect(first).toEqual(second);
  });

  it("furnishes differently for different seeds and different themes", () => {
    const seedA = placeWorldObjects({ theme: "alien-hive", ...ARENA, seed: 1 });
    const seedB = placeWorldObjects({ theme: "alien-hive", ...ARENA, seed: 999_331 });
    expect(seedA.obstacles).not.toEqual(seedB.obstacles);

    const hive = new Set(placeWorldObjects({ theme: "alien-hive", ...ARENA, seed: 77 })
      .obstacles.map((obstacle) => obstacle.worldObjectId));
    const bastion = new Set(placeWorldObjects({ theme: "bastion-standard", ...ARENA, seed: 77 })
      .obstacles.map((obstacle) => obstacle.worldObjectId));
    expect(hive).not.toEqual(bastion);
  });

  it("only places objects the theme actually allows", () => {
    for (const themeId of ARENA_THEME_FAMILY_IDS) {
      const family = worldThemeFamilyForArenaTheme(themeId);
      const result = placeWorldObjects({ theme: themeId, ...ARENA, seed: 31 });
      for (const placed of [...result.obstacles, ...result.hazards]) {
        const definition = worldObjectById(placed.worldObjectId!)!;
        expect(definition, `${placed.worldObjectId} is not in the catalogue`).toBeTruthy();
        expect(definition.themes, `${definition.id} in ${themeId}`).toContain(family);
      }
    }
  });

  it("furnishes every arena theme with something", () => {
    for (const themeId of ARENA_THEME_FAMILY_IDS) {
      const result = placeWorldObjects({ theme: themeId, ...ARENA, seed: 8 });
      expect(result.obstacles.length + result.hazards.length, `${themeId} is empty`).toBeGreaterThan(0);
    }
  });

  it("respects each object's per-room cap", () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const result = placeWorldObjects({ theme: "surface-frontier", ...ARENA, seed });
      const counts = new Map<string, number>();
      for (const placed of [...result.obstacles, ...result.hazards]) {
        const id = placed.worldObjectId!;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      for (const [id, count] of counts) {
        expect(count, `${id} exceeded its cap`).toBeLessThanOrEqual(worldObjectById(id)!.maxPerRoom);
      }
    }
  });

  it("keeps the player's spawn clear, and hazards further still", () => {
    const centre = { x: ARENA.widthMetres / 2, y: ARENA.heightMetres / 2 };
    for (let seed = 1; seed <= 30; seed += 1) {
      for (const themeId of ["alien-hive", "machine-foundry", "emberfall"]) {
        const result = placeWorldObjects({ theme: themeId, ...ARENA, seed });
        for (const obstacle of result.obstacles) {
          expect(gapToPoint(obstacle, centre), `${themeId}/${seed}`).toBeGreaterThanOrEqual(SPAWN_CLEARANCE_METRES);
        }
        // Standing in acid on frame 0 is not a decision the player made.
        for (const hazard of result.hazards) {
          expect(gapToPoint(hazard, centre), `${themeId}/${seed}`)
            .toBeGreaterThanOrEqual(SPAWN_CLEARANCE_METRES + HAZARD_SPAWN_CLEARANCE_METRES);
        }
      }
    }
  });

  it("never leaves a gap too narrow to walk through", () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      const result = placeWorldObjects({ theme: "containment-underworld", ...ARENA, seed });
      const placed = [...result.obstacles, ...result.hazards];
      for (let left = 0; left < placed.length; left += 1) {
        for (let right = left + 1; right < placed.length; right += 1) {
          const gap = rectGap(placed[left]!, placed[right]!);
          expect(gap, `${placed[left]!.id} vs ${placed[right]!.id} on seed ${seed}`)
            .toBeGreaterThanOrEqual(MIN_LANE_WIDTH_METRES);
        }
      }
    }
  });

  it("stays under the floor-coverage ceiling", () => {
    for (let seed = 1; seed <= 30; seed += 1) {
      for (const themeId of ARENA_THEME_FAMILY_IDS) {
        const result = placeWorldObjects({ theme: themeId, ...ARENA, seed });
        expect(result.coverage, `${themeId}/${seed}`).toBeLessThanOrEqual(MAX_FLOOR_COVERAGE);
      }
    }
  });

  it("holds back only the interactables whose verb combat cannot honour", () => {
    // The rule narrowed on 31 July 2026. It used to exclude every anchor and
    // interactable; now it excludes exactly those whose effect is unimplemented,
    // because a Stargate that does nothing is a placebo while a Supply Chest
    // that opens is the feature.
    const unimplemented = WORLD_OBJECT_CATALOG
      .filter((object) => object.interaction
        && !IMPLEMENTED_INTERACTION_EFFECTS.includes(object.interaction.effect.type))
      .map((object) => object.id);
    expect(unimplemented.length).toBeGreaterThan(0);
    for (const themeId of ARENA_THEME_FAMILY_IDS) {
      for (let seed = 1; seed <= 10; seed += 1) {
        const result = placeWorldObjects({ theme: themeId, ...ARENA, seed });
        for (const placed of [...result.obstacles, ...result.hazards]) {
          expect(unimplemented).not.toContain(placed.worldObjectId);
        }
      }
    }
  });

  it("does place interactables whose verb exists, or the whole layer stays dead", () => {
    const placedIds = new Set<string>();
    for (const themeId of ARENA_THEME_FAMILY_IDS) {
      for (let seed = 1; seed <= 30; seed += 1) {
        for (const placed of placeWorldObjects({ theme: themeId, ...ARENA, seed }).obstacles) {
          if (placed.worldObjectId) placedIds.add(placed.worldObjectId);
        }
      }
    }
    // Supply Chest and Scrap Seam are the two anchors reachable in the widest
    // set of themes; if neither ever lands, placement is filtering them out.
    expect(placedIds.has("supply-chest") || placedIds.has("scrap-seam")).toBe(true);
  });

  it("degrades safely rather than cramming a room it cannot furnish", () => {
    expect(placeWorldObjects({ theme: "bastion-standard", widthMetres: 0, heightMetres: 0, seed: 1 }).obstacles).toEqual([]);
    // A room barely wider than the lane minimum simply gets nothing.
    const tiny = placeWorldObjects({ theme: "bastion-standard", widthMetres: 5, heightMetres: 5, seed: 1 });
    expect(tiny.obstacles.length + tiny.hazards.length).toBeLessThanOrEqual(1);
  });

  it("carries the catalogue's durability onto the placed obstacle", () => {
    const result = placeWorldObjects({ theme: "surface-frontier", ...ARENA, seed: 12 });
    for (const obstacle of result.obstacles) {
      const definition = worldObjectById(obstacle.worldObjectId!)!;
      if (definition.durability !== null) {
        expect(obstacle.maxDurability).toBe(definition.durability);
      }
    }
  });
});

function gapToPoint(
  rect: { x: number; y: number; width: number; height: number },
  point: { x: number; y: number },
): number {
  const closestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));
  return Math.hypot(closestX - point.x, closestY - point.y);
}

function rectGap(
  left: { x: number; y: number; width: number; height: number },
  right: { x: number; y: number; width: number; height: number },
): number {
  const horizontal = Math.max(left.x - (right.x + right.width), right.x - (left.x + left.width));
  const vertical = Math.max(left.y - (right.y + right.height), right.y - (left.y + left.height));
  return Math.max(horizontal, vertical);
}
