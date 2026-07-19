import type { Vector2Data } from "../math/Vector2Data";

export interface PlayerIntent {
  move: Vector2Data;
  aim: Vector2Data;
  fireHeld: boolean;
  /** Accessibility-mode toggle; T on keyboard or R3 on a standard gamepad. */
  toggleFireModePressed?: boolean;
  evasiveMovePressed: boolean;
  interactPressed: boolean;
  ultimatePressed: boolean;
  kitPressed: boolean;
  pausePressed: boolean;
  restartPressed: boolean;
}
