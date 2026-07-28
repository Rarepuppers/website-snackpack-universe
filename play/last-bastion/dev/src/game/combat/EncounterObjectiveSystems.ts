export interface GateInteractionState { open: boolean; progressSeconds: number; }
export function stepGateInteraction(state: GateInteractionState, held: boolean, inRange: boolean, deltaSeconds: number): GateInteractionState {
  if (state.open) return state;
  const progressSeconds = held && inRange ? Math.min(0.75, state.progressSeconds + Math.max(0, deltaSeconds)) : 0;
  return { open: progressSeconds >= 0.75, progressSeconds };
}

export interface TargetCandidate { id: number; distanceMetres: number; visible: boolean; }
export function selectAlliedTurretTarget(candidates: readonly TargetCandidate[]): TargetCandidate | null {
  return candidates.filter((candidate) => candidate.visible && candidate.distanceMetres <= 12).sort((left, right) => left.distanceMetres - right.distanceMetres || left.id - right.id)[0] ?? null;
}

export interface ElectricTrapState { phase: "ready" | "telegraph" | "active" | "spent"; remainingSeconds: number; tickRemainingSeconds: number; }
export function stepElectricTrap(state: ElectricTrapState, activate: boolean, deltaSeconds: number): ElectricTrapState {
  if (state.phase === "spent") return state;
  const delta = Math.max(0, deltaSeconds);
  if (state.phase === "ready") return activate ? { phase: "telegraph", remainingSeconds: 6.75, tickRemainingSeconds: 0.25 } : state;
  if (state.phase === "telegraph") return state.remainingSeconds - delta > 6 ? { ...state, remainingSeconds: state.remainingSeconds - delta } : { phase: "active", remainingSeconds: 6, tickRemainingSeconds: 0.25 };
  const remainingSeconds = Math.max(0, state.remainingSeconds - delta);
  return remainingSeconds === 0 ? { phase: "spent", remainingSeconds: 0, tickRemainingSeconds: 0.25 } : { phase: "active", remainingSeconds, tickRemainingSeconds: Math.max(0, state.tickRemainingSeconds - delta) };
}
