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

export interface ArenaDefinition {
  id: string;
  widthMetres: number;
  heightMetres: number;
  tileSizeMetres: number;
  obstacles: readonly ArenaObstacle[];
}

export const BASTION_ARENA: Readonly<ArenaDefinition> = Object.freeze({
  id: "bastion-test-chamber",
  widthMetres: 30,
  heightMetres: 16.875,
  tileSizeMetres: 1,
  obstacles: Object.freeze([
    obstacle("west-barricade", "barricade", 6.2, 4.1, 2.8, 0.8),
    obstacle("east-crate", "cargo-crate", 22.2, 3.7, 1.7, 1.7),
    obstacle("south-conduit", "power-conduit", 7.1, 11.8, 1.2, 2.4),
    obstacle("east-biomass", "biomass", 21.3, 12.1, 2.6, 1.4),
  ]),
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
