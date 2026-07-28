import { describe, expect, it } from "vitest";
import { CLOSED_PAUSE_MENU, PAUSE_CONFIRM_HOLD_SECONDS, pauseFromFocusLoss, stepPauseMenu } from "./PauseMenu";

describe("PauseMenu", () => {
  it("freezes simulation and unwinds one level with back", () => {
    let result = stepPauseMenu(CLOSED_PAUSE_MENU, "pause");
    expect(result.state.mode).toBe("root");
    expect(result.simulationFrozen).toBe(true);
    result = stepPauseMenu(result.state, "settings");
    const root = stepPauseMenu(result.state, "back");
    expect(root.state.mode).toBe("root");
    expect(stepPauseMenu(root.state, "back").simulationFrozen).toBe(false);
  });
  it("requires confirmation for restart and hold-to-confirm for abandon", () => {
    let state = stepPauseMenu(CLOSED_PAUSE_MENU, "pause").state;
    state = stepPauseMenu(state, "restart").state;
    expect(stepPauseMenu(state, "confirm").effect).toBe("restart-encounter");
    state = stepPauseMenu(CLOSED_PAUSE_MENU, "pause").state;
    state = stepPauseMenu(state, "abandon").state;
    expect(stepPauseMenu(state, "confirm", PAUSE_CONFIRM_HOLD_SECONDS, true).effect).toBe("abandon-run");
  });
  it("focus loss opens the pause root without advancing simulation", () => {
    expect(pauseFromFocusLoss(CLOSED_PAUSE_MENU).mode).toBe("root");
  });
});
