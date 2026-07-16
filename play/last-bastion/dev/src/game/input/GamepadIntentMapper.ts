import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";
import type { PlayerIntent } from "./PlayerIntent";

/**
 * Device-independent snapshot of a twin-stick gamepad. The Phaser adapter
 * fills this in; the mapper below owns every gameplay decision so it can be
 * tested without a real controller.
 */
export interface GamepadStateSnapshot {
  connected: boolean;
  leftStick: Vector2Data;
  rightStick: Vector2Data;
  /** Right trigger or right shoulder held. */
  fireHeld: boolean;
  /** Bottom face button (A / Cross). */
  southPressed: boolean;
  /** Left face button (X / Square). */
  westPressed: boolean;
  /** Top face button (Y / Triangle). */
  northPressed: boolean;
  startPressed: boolean;
}

export const GAMEPAD_DEADZONE = 0.25;
/** Right-stick magnitude beyond which aiming also fires (twin-stick convention). */
export const GAMEPAD_FIRE_THRESHOLD = 0.5;

export const DISCONNECTED_GAMEPAD: Readonly<GamepadStateSnapshot> = Object.freeze({
  connected: false,
  leftStick: { x: 0, y: 0 },
  rightStick: { x: 0, y: 0 },
  fireHeld: false,
  southPressed: false,
  westPressed: false,
  northPressed: false,
  startPressed: false,
});

/** Scaled radial deadzone: dead centre is ignored, the rest rescales to 0..1. */
export function applyDeadzone(stick: Vector2Data, deadzone = GAMEPAD_DEADZONE): Vector2Data {
  const magnitude = Math.hypot(stick.x, stick.y);
  if (magnitude <= deadzone) {
    return { x: 0, y: 0 };
  }
  const scaled = Math.min((magnitude - deadzone) / (1 - deadzone), 1);
  return {
    x: (stick.x / magnitude) * scaled,
    y: (stick.y / magnitude) * scaled,
  };
}

/**
 * Converts raw pad state into PlayerIntent, tracking previous button state so
 * "pressed" intents fire on the edge only, matching keyboard JustDown.
 */
export class GamepadIntentMapper {
  private previousSouth = false;
  private previousWest = false;
  private previousNorth = false;
  private previousStart = false;

  update(state: GamepadStateSnapshot): PlayerIntent {
    const south = state.connected && state.southPressed;
    const west = state.connected && state.westPressed;
    const north = state.connected && state.northPressed;
    const start = state.connected && state.startPressed;
    const intent = buildIntent(state, {
      evasiveMovePressed: south && !this.previousSouth,
      interactPressed: west && !this.previousWest,
      ultimatePressed: north && !this.previousNorth,
      pausePressed: start && !this.previousStart,
      restartPressed: south && !this.previousSouth,
    });
    this.previousSouth = south;
    this.previousWest = west;
    this.previousNorth = north;
    this.previousStart = start;
    return intent;
  }
}

function buildIntent(
  state: GamepadStateSnapshot,
  pressed: Pick<PlayerIntent,
    "evasiveMovePressed" | "interactPressed" | "ultimatePressed" | "pausePressed" | "restartPressed">,
): PlayerIntent {
  if (!state.connected) {
    return {
      move: { x: 0, y: 0 },
      aim: { x: 0, y: 0 },
      fireHeld: false,
      evasiveMovePressed: false,
      interactPressed: false,
      ultimatePressed: false,
      pausePressed: false,
      restartPressed: false,
    };
  }

  const move = applyDeadzone(state.leftStick);
  const rawAimMagnitude = Math.hypot(state.rightStick.x, state.rightStick.y);
  const aimStick = applyDeadzone(state.rightStick);
  const aimMagnitude = Math.hypot(aimStick.x, aimStick.y);

  return {
    move,
    aim: aimMagnitude > 0 ? normalizeVector(aimStick) : { x: 0, y: 0 },
    fireHeld: state.fireHeld || rawAimMagnitude >= GAMEPAD_FIRE_THRESHOLD,
    ...pressed,
  };
}

/**
 * Merges keyboard/mouse and gamepad intents. Whichever device is actively
 * providing a vector wins; the gamepad takes priority when both move or aim.
 */
export function mergeIntents(keyboardMouse: PlayerIntent, gamepad: PlayerIntent): PlayerIntent {
  const gamepadMoving = gamepad.move.x !== 0 || gamepad.move.y !== 0;
  const gamepadAiming = gamepad.aim.x !== 0 || gamepad.aim.y !== 0;
  return {
    move: gamepadMoving ? gamepad.move : keyboardMouse.move,
    aim: gamepadAiming ? gamepad.aim : keyboardMouse.aim,
    fireHeld: keyboardMouse.fireHeld || gamepad.fireHeld,
    evasiveMovePressed: keyboardMouse.evasiveMovePressed || gamepad.evasiveMovePressed,
    interactPressed: keyboardMouse.interactPressed || gamepad.interactPressed,
    ultimatePressed: keyboardMouse.ultimatePressed || gamepad.ultimatePressed,
    pausePressed: keyboardMouse.pausePressed || gamepad.pausePressed,
    restartPressed: keyboardMouse.restartPressed || gamepad.restartPressed,
  };
}
