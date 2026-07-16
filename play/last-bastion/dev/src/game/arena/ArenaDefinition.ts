import type { Vector2Data } from "../math/Vector2Data";

export type ArenaObstacleKind = "barricade" | "cargo-crate" | "power-conduit" | "biomass";

export interface ArenaObstacle {
  id: string;
  kind: ArenaObstacleKind;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Signature battlefield interaction: a switch that energizes a fence line. */
export interface ArenaFenceDefinition {
  switchPosition: Vector2Data;
  from: Vector2Data;
  to: Vector2Data;
}

export interface ArenaDefinition {
  id: string;
  widthMetres: number;
  heightMetres: number;
  tileSizeMetres: number;
  obstacles: readonly ArenaObstacle[];
  fence?: ArenaFenceDefinition;
}

export const BASTION_ARENA: Readonly<ArenaDefinition> = Object.freeze({
  id: "bastion-outer-yard",
  widthMetres: 45,
  heightMetres: 25.3125,
  tileSizeMetres: 1,
  obstacles: Object.freeze([
    obstacle("west-barricade", "barricade", 7.2, 5.1, 3.2, 0.8),
    obstacle("north-crate", "cargo-crate", 20.1, 4.2, 1.7, 1.7),
    obstacle("east-crate", "cargo-crate", 35.4, 6.3, 1.8, 1.8),
    obstacle("south-conduit", "power-conduit", 9.4, 18.2, 1.2, 2.6),
    obstacle("east-biomass", "biomass", 32.6, 17.4, 2.8, 1.5),
    obstacle("centre-barricade", "barricade", 25.8, 9.1, 3.4, 0.8),
    obstacle("west-biomass", "biomass", 13.8, 12.7, 2.4, 1.4),
    obstacle("south-crate", "cargo-crate", 24.2, 20.8, 1.7, 1.7),
  ]),
  fence: Object.freeze({
    switchPosition: Object.freeze({ x: 22.5, y: 19.8 }),
    from: Object.freeze({ x: 17.5, y: 18.6 }),
    to: Object.freeze({ x: 27.5, y: 18.6 }),
  }),
});

export function resolveCircleMovement(
  previous: Vector2Data,
  desired: Vector2Data,
  radius: number,
  arena: ArenaDefinition,
): Vector2Data {
  const bounded = {
    x: clamp(desired.x, radius, arena.widthMetres - radius),
    y: clamp(desired.y, radius, arena.heightMetres - radius),
  };

  if (!collidesWithObstacle(bounded, radius, arena.obstacles)) {
    return bounded;
  }

  const xOnly = { x: bounded.x, y: previous.y };
  if (!collidesWithObstacle(xOnly, radius, arena.obstacles)) {
    return xOnly;
  }

  const yOnly = { x: previous.x, y: bounded.y };
  if (!collidesWithObstacle(yOnly, radius, arena.obstacles)) {
    return yOnly;
  }

  return { ...previous };
}

export function pointHitsObstacle(
  point: Vector2Data,
  obstacles: readonly ArenaObstacle[],
): boolean {
  return obstacles.some((obstacle) => (
    point.x >= obstacle.x
    && point.x <= obstacle.x + obstacle.width
    && point.y >= obstacle.y
    && point.y <= obstacle.y + obstacle.height
  ));
}

export function collidesWithObstacle(
  centre: Vector2Data,
  radius: number,
  obstacles: readonly ArenaObstacle[],
): boolean {
  return obstacles.some((obstacle) => (
    centre.x + radius > obstacle.x
    && centre.x - radius < obstacle.x + obstacle.width
    && centre.y + radius > obstacle.y
    && centre.y - radius < obstacle.y + obstacle.height
  ));
}

function obstacle(
  id: string,
  kind: ArenaObstacleKind,
  x: number,
  y: number,
  width: number,
  height: number,
): ArenaObstacle {
  return Object.freeze({ id, kind, x, y, width, height });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
