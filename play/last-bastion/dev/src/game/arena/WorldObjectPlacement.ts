import type { ArenaHazard, ArenaObstacle } from "./ArenaDefinition";
import {
  isInteractionImplemented,
  worldObjectsForTheme,
  worldThemeFamilyForArenaTheme,
  type WorldObjectDefinition,
  type WorldThemeFamily,
} from "./WorldObjectCatalog";

/**
 * Deterministic world-object placement (26 July 2026).
 *
 * `WorldObjectCatalog` had been imported by nothing but its own test since it
 * was authored — 25 theme-filtered obstacles, hazards and interactables of
 * entirely dead data, against a stated design pillar. This is the layer that
 * puts them on the floor.
 *
 * Everything here is **seeded and pure**: the same theme, arena and seed always
 * furnish the same room, so a replay digest and an expedition node both stay
 * reproducible. Placement never calls the simulation's RNG.
 *
 * The density gates come straight from `world-object-production-plan.md`, and
 * they are enforced rather than documented — a room that cannot satisfy them
 * simply gets fewer objects. Under-furnishing is always safe; a blocked exit or
 * a hazard under the player's feet is not.
 */

/** Keep the player's spawn — arena centre — clear by this much. */
export const SPAWN_CLEARANCE_METRES = 4;
/** Minimum walkable gap between two placed objects, and from an object to a wall. */
export const MIN_LANE_WIDTH_METRES = 2.5;
/** Ceiling on how much ordinary combat floor world objects may occupy. */
export const MAX_FLOOR_COVERAGE = 0.2;
/** Hazards additionally stay this far from spawn — standing in acid on frame 0 is not a decision. */
export const HAZARD_SPAWN_CLEARANCE_METRES = 6;

export interface WorldObjectPlacementRequest {
  /** Presentation theme id, or a world family directly. */
  theme: string | WorldThemeFamily;
  widthMetres: number;
  heightMetres: number;
  seed: number;
  /** Points that must stay clear — player spawn and any exits. Defaults to arena centre. */
  keepClear?: readonly Readonly<{ x: number; y: number; radiusMetres: number }>[];
  /** Hard ceiling on placed objects regardless of catalogue caps. */
  maxObjects?: number;
}

export interface WorldObjectPlacementResult {
  obstacles: readonly ArenaObstacle[];
  hazards: readonly ArenaHazard[];
  /** Objects the gates rejected, for density-review tooling and tests. */
  rejectedCount: number;
  coverage: number;
}

const EMPTY: WorldObjectPlacementResult = Object.freeze({
  obstacles: Object.freeze([]),
  hazards: Object.freeze([]),
  rejectedCount: 0,
  coverage: 0,
});

export function placeWorldObjects(request: WorldObjectPlacementRequest): WorldObjectPlacementResult {
  const { widthMetres, heightMetres } = request;
  if (widthMetres <= 0 || heightMetres <= 0) return EMPTY;

  const family = isWorldThemeFamily(request.theme)
    ? request.theme
    : worldThemeFamilyForArenaTheme(request.theme);
  // Objective anchors are placed as of 31 July 2026, but only when combat can
  // honour their verb. The original blanket exclusion was right about the
  // danger and too broad about the remedy: a Stargate that does nothing is a
  // placebo, while a Supply Chest that opens is the feature. `isInteractionImplemented`
  // is the narrow version of that rule.
  const candidates = worldObjectsForTheme(family).filter(isInteractionImplemented);
  if (candidates.length === 0) return EMPTY;

  const keepClear = request.keepClear ?? [
    { x: widthMetres / 2, y: heightMetres / 2, radiusMetres: SPAWN_CLEARANCE_METRES },
  ];
  const floorArea = widthMetres * heightMetres;
  const coverageBudget = floorArea * MAX_FLOOR_COVERAGE;

  const random = seededRandom(request.seed);
  const placedPerObject = new Map<string, number>();
  const obstacles: ArenaObstacle[] = [];
  const hazards: ArenaHazard[] = [];
  const footprints: Rect[] = [];
  let coveredArea = 0;
  let rejectedCount = 0;

  // A fixed number of attempts rather than "until full": bounded work, and a
  // cramped room naturally ends up sparser than a large one.
  const attempts = Math.min(request.maxObjects ?? 64, Math.round(floorArea / 12) + 8);
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const definition = candidates[Math.floor(random() * candidates.length)]!;
    const placed = placedPerObject.get(definition.id) ?? 0;
    if (placed >= definition.maxPerRoom) continue;

    const { width, height } = definition.footprintMetres;
    const isHazard = definition.role === "hazard";
    if (!isHazard && coveredArea + width * height > coverageBudget) {
      rejectedCount += 1;
      continue;
    }

    const margin = MIN_LANE_WIDTH_METRES;
    const spanX = widthMetres - width - margin * 2;
    const spanY = heightMetres - height - margin * 2;
    if (spanX <= 0 || spanY <= 0) {
      rejectedCount += 1;
      continue;
    }
    const rect: Rect = {
      x: margin + random() * spanX,
      y: margin + random() * spanY,
      width,
      height,
    };

    const clearance = isHazard ? HAZARD_SPAWN_CLEARANCE_METRES : 0;
    if (violatesKeepClear(rect, keepClear, clearance)) {
      rejectedCount += 1;
      continue;
    }
    // Hazards may sit under solid cover in principle, but overlapping anything
    // makes both unreadable, so everything competes for the same free space.
    if (footprints.some((existing) => rectsWithinGap(existing, rect, MIN_LANE_WIDTH_METRES))) {
      rejectedCount += 1;
      continue;
    }

    footprints.push(rect);
    placedPerObject.set(definition.id, placed + 1);
    const id = `wo-${definition.id}-${obstacles.length + hazards.length}`;

    if (isHazard && definition.hazard) {
      hazards.push(Object.freeze({
        id,
        worldObjectId: definition.id,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        effect: definition.hazard,
      }));
      continue;
    }

    coveredArea += width * height;
    obstacles.push(Object.freeze({
      id,
      worldObjectId: definition.id,
      kind: definition.visualKind ?? "cargo-crate",
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      maxDurability: definition.durability ?? undefined,
    }));
  }

  return {
    obstacles: Object.freeze(obstacles),
    hazards: Object.freeze(hazards),
    rejectedCount,
    coverage: floorArea > 0 ? coveredArea / floorArea : 0,
  };
}

interface Rect { x: number; y: number; width: number; height: number }

function violatesKeepClear(
  rect: Rect,
  keepClear: readonly Readonly<{ x: number; y: number; radiusMetres: number }>[],
  extraMetres: number,
): boolean {
  return keepClear.some((zone) => {
    const closestX = Math.max(rect.x, Math.min(zone.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(zone.y, rect.y + rect.height));
    return Math.hypot(closestX - zone.x, closestY - zone.y) < zone.radiusMetres + extraMetres;
  });
}

/** True when two rects overlap or leave a gap too narrow to walk through. */
function rectsWithinGap(left: Rect, right: Rect, gapMetres: number): boolean {
  const horizontalGap = Math.max(left.x - (right.x + right.width), right.x - (left.x + left.width));
  const verticalGap = Math.max(left.y - (right.y + right.height), right.y - (left.y + left.height));
  const separation = Math.max(horizontalGap, verticalGap);
  return separation < gapMetres;
}

/**
 * The same LCG the simulation uses, kept local so placement never advances the
 * simulation's stream — the RNG call order there is part of the replay digest.
 */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function isWorldThemeFamily(value: string): value is WorldThemeFamily {
  return WORLD_THEME_FAMILIES.includes(value as WorldThemeFamily);
}

const WORLD_THEME_FAMILIES: readonly WorldThemeFamily[] = Object.freeze([
  "bastion", "science", "logistics", "foundry", "hive",
  "surface", "starship", "containment", "underworld",
]);
