import type { Vector2Data } from "../math/Vector2Data";

export type EscortObjectiveStatus = "active" | "complete" | "failed";

export interface EscortObjectiveState {
  readonly route: readonly Vector2Data[];
  position: Vector2Data;
  waypointIndex: number;
  health: number;
  maxHealth: number;
  status: EscortObjectiveStatus;
  underAttack: boolean;
  progress: number;
}

export interface EscortObjectiveSnapshot {
  position: Vector2Data;
  health: number;
  maxHealth: number;
  status: EscortObjectiveStatus;
  underAttack: boolean;
  progress: number;
}

export const ESCORT_DRONE_SPEED_METRES_PER_SECOND = 1.35;
export const ESCORT_HOSTILE_DAMAGE_PER_SECOND = 2.5;
export const ESCORT_HOSTILE_RADIUS_METRES = 1.75;

function routeLength(route: readonly Vector2Data[]): number {
  let total = 0;
  for (let index = 1; index < route.length; index += 1) {
    total += Math.hypot(route[index]!.x - route[index - 1]!.x, route[index]!.y - route[index - 1]!.y);
  }
  return total;
}

function travelledLength(state: EscortObjectiveState): number {
  let total = 0;
  for (let index = 1; index < state.waypointIndex; index += 1) {
    total += Math.hypot(
      state.route[index]!.x - state.route[index - 1]!.x,
      state.route[index]!.y - state.route[index - 1]!.y,
    );
  }
  const from = state.route[Math.max(0, state.waypointIndex - 1)]!;
  total += Math.hypot(state.position.x - from.x, state.position.y - from.y);
  return total;
}

export function createEscortObjective(route: readonly Vector2Data[], maxHealth = 30): EscortObjectiveState {
  if (route.length < 2) throw new Error("Escort routes need at least two waypoints.");
  return {
    route: route.map((point) => ({ ...point })),
    position: { ...route[0]! },
    waypointIndex: 1,
    health: maxHealth,
    maxHealth,
    status: "active",
    underAttack: false,
    progress: 0,
  };
}

/** Hostiles stop and damage the drone; clearing its immediate lane restarts it. */
export function stepEscortObjective(
  state: EscortObjectiveState,
  input: { deltaSeconds: number; nearbyHostiles: number },
): EscortObjectiveState {
  if (state.status !== "active") return state;
  const delta = Math.max(0, input.deltaSeconds);
  const nearbyHostiles = Math.max(0, Math.floor(input.nearbyHostiles));
  const next: EscortObjectiveState = {
    ...state,
    position: { ...state.position },
    underAttack: nearbyHostiles > 0,
  };
  if (nearbyHostiles > 0) {
    next.health = Math.max(0, next.health - nearbyHostiles * ESCORT_HOSTILE_DAMAGE_PER_SECOND * delta);
    if (next.health === 0) next.status = "failed";
    return next;
  }

  let remaining = ESCORT_DRONE_SPEED_METRES_PER_SECOND * delta;
  while (remaining > 0 && next.waypointIndex < next.route.length) {
    const target = next.route[next.waypointIndex]!;
    const dx = target.x - next.position.x;
    const dy = target.y - next.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= remaining) {
      next.position = { ...target };
      next.waypointIndex += 1;
      remaining -= distance;
    } else {
      next.position = {
        x: next.position.x + dx / distance * remaining,
        y: next.position.y + dy / distance * remaining,
      };
      remaining = 0;
    }
  }
  const total = routeLength(next.route);
  next.progress = total > 0 ? Math.min(1, travelledLength(next) / total) : 1;
  if (next.waypointIndex >= next.route.length) {
    next.status = "complete";
    next.progress = 1;
  }
  return next;
}

export function escortObjectiveSnapshot(state: EscortObjectiveState): EscortObjectiveSnapshot {
  return {
    position: { ...state.position },
    health: state.health,
    maxHealth: state.maxHealth,
    status: state.status,
    underAttack: state.underAttack,
    progress: state.progress,
  };
}
