export type PauseMode = "closed" | "root" | "build" | "settings" | "controls" | "codex" | "confirm-restart" | "confirm-abandon";
export type PauseIntent = "pause" | "back" | "build" | "settings" | "controls" | "codex" | "restart" | "abandon" | "confirm" | "none";
export interface PauseMenuState { mode: PauseMode; abandonHoldSeconds: number; }
export interface PauseMenuStepResult { state: PauseMenuState; simulationFrozen: boolean; effect: "restart-encounter" | "abandon-run" | null; }

export const PAUSE_CONFIRM_HOLD_SECONDS = 0.75;
export const CLOSED_PAUSE_MENU: Readonly<PauseMenuState> = Object.freeze({ mode: "closed", abandonHoldSeconds: 0 });

export function stepPauseMenu(state: PauseMenuState, intent: PauseIntent, deltaSeconds = 0, abandonHeld = false): PauseMenuStepResult {
  const delta = Math.max(0, deltaSeconds);
  if (state.mode === "closed") {
    const next = intent === "pause" ? { mode: "root" as const, abandonHoldSeconds: 0 } : state;
    return { state: next, simulationFrozen: next.mode !== "closed", effect: null };
  }
  if (intent === "back" || intent === "pause") {
    const next = state.mode === "root" ? CLOSED_PAUSE_MENU : { mode: "root" as const, abandonHoldSeconds: 0 };
    return { state: next, simulationFrozen: next.mode !== "closed", effect: null };
  }
  if (state.mode === "root") {
    const nextMode: PauseMode = intent === "build" ? "build" : intent === "settings" ? "settings" : intent === "controls" ? "controls" : intent === "codex" ? "codex" : intent === "restart" ? "confirm-restart" : intent === "abandon" ? "confirm-abandon" : state.mode;
    const next = { mode: nextMode, abandonHoldSeconds: 0 };
    return { state: next, simulationFrozen: true, effect: null };
  }
  if (state.mode === "confirm-restart" && intent === "confirm") return { state: { mode: "closed", abandonHoldSeconds: 0 }, simulationFrozen: false, effect: "restart-encounter" };
  if (state.mode === "confirm-abandon") {
    const hold = abandonHeld ? state.abandonHoldSeconds + delta : 0;
    if (hold >= PAUSE_CONFIRM_HOLD_SECONDS && intent === "confirm") return { state: { mode: "closed", abandonHoldSeconds: 0 }, simulationFrozen: false, effect: "abandon-run" };
    return { state: { ...state, abandonHoldSeconds: hold }, simulationFrozen: true, effect: null };
  }
  return { state, simulationFrozen: true, effect: null };
}

export function pauseFromFocusLoss(state: PauseMenuState): PauseMenuState {
  return state.mode === "closed" ? { mode: "root", abandonHoldSeconds: 0 } : state;
}
