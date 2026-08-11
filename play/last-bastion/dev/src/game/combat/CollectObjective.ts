import type { Vector2Data } from "../math/Vector2Data";

export type CollectObjectiveStatus = "active" | "complete" | "failed";

export interface CollectPickupState {
  id: number;
  position: Vector2Data;
  collected: boolean;
}

export interface CollectObjectiveState {
  pickups: CollectPickupState[];
  remainingSeconds: number;
  status: CollectObjectiveStatus;
}

export interface CollectObjectiveSnapshot {
  pickups: readonly CollectPickupState[];
  collected: number;
  total: number;
  remainingSeconds: number;
  status: CollectObjectiveStatus;
}

export const COLLECT_PICKUP_RADIUS_METRES = 0.9;
export const COLLECT_OBJECTIVE_SECONDS = 32;

export function createCollectObjective(
  positions: readonly Vector2Data[],
  durationSeconds = COLLECT_OBJECTIVE_SECONDS,
): CollectObjectiveState {
  if (positions.length === 0) throw new Error("Collect objectives need at least one pickup.");
  return {
    pickups: positions.map((position, index) => ({ id: index + 1, position: { ...position }, collected: false })),
    remainingSeconds: durationSeconds,
    status: "active",
  };
}

/** Crossing a pickup's radius banks it immediately; the timer keeps pressure on arena movement. */
export function stepCollectObjective(
  state: CollectObjectiveState,
  input: { deltaSeconds: number; playerPosition: Vector2Data },
): { state: CollectObjectiveState; collectedIds: readonly number[] } {
  if (state.status !== "active") return { state, collectedIds: [] };
  const collectedIds: number[] = [];
  const pickups = state.pickups.map((pickup) => {
    if (pickup.collected) return { ...pickup, position: { ...pickup.position } };
    const collected = Math.hypot(
      pickup.position.x - input.playerPosition.x,
      pickup.position.y - input.playerPosition.y,
    ) <= COLLECT_PICKUP_RADIUS_METRES;
    if (collected) collectedIds.push(pickup.id);
    return { ...pickup, position: { ...pickup.position }, collected };
  });
  if (pickups.every((pickup) => pickup.collected)) {
    return { state: { pickups, remainingSeconds: state.remainingSeconds, status: "complete" }, collectedIds };
  }
  const remainingSeconds = Math.max(0, state.remainingSeconds - Math.max(0, input.deltaSeconds));
  return {
    state: { pickups, remainingSeconds, status: remainingSeconds === 0 ? "failed" : "active" },
    collectedIds,
  };
}

export function collectObjectiveSnapshot(state: CollectObjectiveState): CollectObjectiveSnapshot {
  return {
    pickups: state.pickups.map((pickup) => ({ ...pickup, position: { ...pickup.position } })),
    collected: state.pickups.filter((pickup) => pickup.collected).length,
    total: state.pickups.length,
    remainingSeconds: state.remainingSeconds,
    status: state.status,
  };
}
