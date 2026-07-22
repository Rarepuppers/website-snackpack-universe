import type { ArenaObstacle } from "../arena/ArenaDefinition";
import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";

export const ARC_WARDEN_CHARGE_SECONDS = 1.05;
export const ARC_WARDEN_DISCHARGE_SECONDS = 0.12;
export const ARC_WARDEN_RECOVERY_SECONDS = 0.85;
export const ARC_WARDEN_COOLDOWN_SECONDS = 2.4;
export const ARC_WARDEN_BEAM_LENGTH_METRES = 8.5;
export const ARC_WARDEN_BEAM_HALF_WIDTH_METRES = 0.24;
export const ARC_WARDEN_MIN_FIRE_RANGE_METRES = 3.4;
export const ARC_WARDEN_MAX_FIRE_RANGE_METRES = 9.5;

export type ArcWardenPhase = "reposition" | "charge" | "discharge" | "recovery";

export interface ArcWardenLane {
  readonly from: Vector2Data;
  readonly to: Vector2Data;
  readonly unclippedTo: Vector2Data;
  readonly direction: Vector2Data;
  readonly blockedByObstacleId?: string;
}

export interface ArcWardenState {
  readonly phase: ArcWardenPhase;
  readonly phaseRemainingSeconds: number;
  readonly cooldownSeconds: number;
  readonly lockedLane: ArcWardenLane | null;
}

export interface ArcWardenStepResult {
  readonly state: ArcWardenState;
  readonly discharged: boolean;
}

export function createArcWardenBehavior(): ArcWardenState {
  return {
    phase: "reposition",
    phaseRemainingSeconds: 0,
    cooldownSeconds: 0.5,
    lockedLane: null,
  };
}

/**
 * Locks one finite beam segment. The first intact cover intersection owns the
 * endpoint; no chain or continuation is represented after that point.
 */
export function lockArcWardenLane(
  origin: Readonly<Vector2Data>,
  target: Readonly<Vector2Data>,
  obstacles: readonly ArenaObstacle[],
): ArcWardenLane | null {
  const direction = normalizeVector({ x: target.x - origin.x, y: target.y - origin.y });
  if (direction.x === 0 && direction.y === 0) return null;
  const unclippedTo = {
    x: origin.x + direction.x * ARC_WARDEN_BEAM_LENGTH_METRES,
    y: origin.y + direction.y * ARC_WARDEN_BEAM_LENGTH_METRES,
  };
  const hit = firstObstacleEntry(origin, unclippedTo, obstacles);
  return {
    from: { ...origin },
    to: hit?.position ?? unclippedTo,
    unclippedTo,
    direction,
    ...(hit ? { blockedByObstacleId: hit.obstacle.id } : {}),
  };
}

export function stepArcWardenBehavior(
  state: ArcWardenState,
  deltaSeconds: number,
  position: Readonly<Vector2Data>,
  playerPosition: Readonly<Vector2Data>,
  obstacles: readonly ArenaObstacle[],
): ArcWardenStepResult {
  const delta = Math.max(0, deltaSeconds);
  const phaseRemainingSeconds = Math.max(0, state.phaseRemainingSeconds - delta);

  if (state.phase === "reposition") {
    const cooldownSeconds = Math.max(0, state.cooldownSeconds - delta);
    const distance = Math.hypot(playerPosition.x - position.x, playerPosition.y - position.y);
    if (
      cooldownSeconds <= 0
      && distance >= ARC_WARDEN_MIN_FIRE_RANGE_METRES
      && distance <= ARC_WARDEN_MAX_FIRE_RANGE_METRES
    ) {
      const lockedLane = lockArcWardenLane(position, playerPosition, obstacles);
      if (lockedLane) {
        return {
          state: {
            phase: "charge",
            phaseRemainingSeconds: ARC_WARDEN_CHARGE_SECONDS,
            cooldownSeconds: 0,
            lockedLane,
          },
          discharged: false,
        };
      }
    }
    return { state: { ...state, cooldownSeconds }, discharged: false };
  }

  if (phaseRemainingSeconds > 0) {
    return { state: { ...state, phaseRemainingSeconds }, discharged: false };
  }

  if (state.phase === "charge") {
    return {
      state: { ...state, phase: "discharge", phaseRemainingSeconds: ARC_WARDEN_DISCHARGE_SECONDS },
      discharged: true,
    };
  }
  if (state.phase === "discharge") {
    return {
      state: { ...state, phase: "recovery", phaseRemainingSeconds: ARC_WARDEN_RECOVERY_SECONDS },
      discharged: false,
    };
  }
  return {
    state: {
      phase: "reposition",
      phaseRemainingSeconds: 0,
      cooldownSeconds: ARC_WARDEN_COOLDOWN_SECONDS,
      lockedLane: null,
    },
    discharged: false,
  };
}

export function pointInsideArcWardenLane(
  point: Readonly<Vector2Data>,
  lane: Readonly<ArcWardenLane>,
  radiusMetres = 0,
): boolean {
  return distanceToSegment(point, lane.from, lane.to)
    <= ARC_WARDEN_BEAM_HALF_WIDTH_METRES + Math.max(0, radiusMetres);
}

function firstObstacleEntry(
  from: Readonly<Vector2Data>,
  to: Readonly<Vector2Data>,
  obstacles: readonly ArenaObstacle[],
): { obstacle: ArenaObstacle; position: Vector2Data; time: number } | null {
  let first: { obstacle: ArenaObstacle; position: Vector2Data; time: number } | null = null;
  for (const obstacle of obstacles) {
    const time = segmentRectangleEntryTime(from, to, obstacle);
    if (time === null || (first && time >= first.time)) continue;
    first = {
      obstacle,
      time,
      position: { x: from.x + (to.x - from.x) * time, y: from.y + (to.y - from.y) * time },
    };
  }
  return first;
}

function segmentRectangleEntryTime(
  from: Readonly<Vector2Data>,
  to: Readonly<Vector2Data>,
  obstacle: Readonly<ArenaObstacle>,
): number | null {
  const delta = { x: to.x - from.x, y: to.y - from.y };
  let near = 0;
  let far = 1;
  for (const [start, movement, minimum, maximum] of [
    [from.x, delta.x, obstacle.x, obstacle.x + obstacle.width],
    [from.y, delta.y, obstacle.y, obstacle.y + obstacle.height],
  ] as const) {
    if (Math.abs(movement) <= Number.EPSILON) {
      if (start < minimum || start > maximum) return null;
      continue;
    }
    const first = (minimum - start) / movement;
    const second = (maximum - start) / movement;
    near = Math.max(near, Math.min(first, second));
    far = Math.min(far, Math.max(first, second));
    if (near > far) return null;
  }
  return near >= 0 && near <= 1 ? near : null;
}

function distanceToSegment(
  point: Readonly<Vector2Data>,
  from: Readonly<Vector2Data>,
  to: Readonly<Vector2Data>,
): number {
  const delta = { x: to.x - from.x, y: to.y - from.y };
  const lengthSquared = delta.x * delta.x + delta.y * delta.y;
  if (lengthSquared <= Number.EPSILON) return Math.hypot(point.x - from.x, point.y - from.y);
  const projection = Math.max(0, Math.min(1, (
    (point.x - from.x) * delta.x + (point.y - from.y) * delta.y
  ) / lengthSquared));
  return Math.hypot(
    point.x - (from.x + delta.x * projection),
    point.y - (from.y + delta.y * projection),
  );
}
