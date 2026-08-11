import type { Vector2Data } from "../math/Vector2Data";

export type DenyObjectiveStatus = "active" | "complete" | "failed";

export interface DenyTerminalState {
  id: number;
  position: Vector2Data;
  active: boolean;
}

export interface DenyObjectiveState {
  terminals: DenyTerminalState[];
  corruption: number;
  status: DenyObjectiveStatus;
}

export interface DenyObjectiveSnapshot {
  terminals: readonly DenyTerminalState[];
  corruption: number;
  status: DenyObjectiveStatus;
}

export const DENY_CORRUPTION_PER_CHANNEL_PER_SECOND = 0.022;

export function createDenyObjective(
  terminals: readonly { id: number; position: Vector2Data }[],
): DenyObjectiveState {
  if (terminals.length === 0) throw new Error("Deny objectives need at least one channel terminal.");
  return {
    terminals: terminals.map((terminal) => ({ ...terminal, position: { ...terminal.position }, active: true })),
    corruption: 0,
    status: "active",
  };
}

/** Destroying every channel interrupts the ritual; leaving channels alive fills the shared failure meter. */
export function stepDenyObjective(
  state: DenyObjectiveState,
  input: { deltaSeconds: number; liveTerminalIds: ReadonlySet<number> },
): DenyObjectiveState {
  if (state.status !== "active") return state;
  const terminals = state.terminals.map((terminal) => ({
    ...terminal,
    position: { ...terminal.position },
    active: input.liveTerminalIds.has(terminal.id),
  }));
  const activeChannels = terminals.filter((terminal) => terminal.active).length;
  if (activeChannels === 0) return { terminals, corruption: state.corruption, status: "complete" };
  const corruption = Math.min(
    1,
    state.corruption + activeChannels * DENY_CORRUPTION_PER_CHANNEL_PER_SECOND * Math.max(0, input.deltaSeconds),
  );
  return { terminals, corruption, status: corruption >= 1 ? "failed" : "active" };
}

export function denyObjectiveSnapshot(state: DenyObjectiveState): DenyObjectiveSnapshot {
  return {
    terminals: state.terminals.map((terminal) => ({ ...terminal, position: { ...terminal.position } })),
    corruption: state.corruption,
    status: state.status,
  };
}
