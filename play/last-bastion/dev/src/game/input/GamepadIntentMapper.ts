import type { Vector2Data } from "../math/Vector2Data";
import { normalizeVector } from "../math/Vector2Data";
import type { PlayerIntent } from "./PlayerIntent";
import {
  DEFAULT_CONTROL_BINDINGS,
  type GamepadButton,
  type GamepadBindableAction,
} from "./ControlBindings";

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
  /** Right face button (B / Circle). */
  eastPressed: boolean;
  startPressed: boolean;
  /** Right-stick click (R3), used for the fire-mode accessibility toggle. */
  rightStickPressed: boolean;
}

export const GAMEPAD_MOVE_DEADZONE = 0.18;
export const GAMEPAD_AIM_DEADZONE = 0.25;
/** Backward-compatible default for callers that do not distinguish the stick role. */
export const GAMEPAD_DEADZONE = GAMEPAD_AIM_DEADZONE;
export const DISCONNECTED_GAMEPAD: Readonly<GamepadStateSnapshot> = Object.freeze({
  connected: false,
  leftStick: { x: 0, y: 0 },
  rightStick: { x: 0, y: 0 },
  fireHeld: false,
  southPressed: false,
  westPressed: false,
  northPressed: false,
  eastPressed: false,
  startPressed: false,
  rightStickPressed: false,
});

/** Scaled radial deadzone: dead centre is ignored, the rest rescales to 0..1. */
export function applyDeadzone(stick: Vector2Data, deadzone = GAMEPAD_DEADZONE): Vector2Data {
  const safeDeadzone = Math.min(0.95, Math.max(0, deadzone));
  const magnitude = Math.hypot(stick.x, stick.y);
  if (magnitude <= safeDeadzone) {
    return { x: 0, y: 0 };
  }
  const scaled = Math.min((magnitude - safeDeadzone) / (1 - safeDeadzone), 1);
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
  private previous: Record<GamepadButton, boolean> = {
    south: false, east: false, west: false, north: false, start: false, rightStick: false,
  };

  constructor(
    private readonly bindings: Readonly<Record<GamepadBindableAction, GamepadButton>> = DEFAULT_CONTROL_BINDINGS.gamepad,
  ) {}

  update(state: GamepadStateSnapshot): PlayerIntent {
    const current: Record<GamepadButton, boolean> = {
      south: state.connected && state.southPressed,
      east: state.connected && state.eastPressed,
      west: state.connected && state.westPressed,
      north: state.connected && state.northPressed,
      start: state.connected && state.startPressed,
      rightStick: state.connected && state.rightStickPressed,
    };
    const pressed = (action: GamepadBindableAction): boolean => {
      const button = this.bindings[action];
      return current[button] && !this.previous[button];
    };
    const intent = buildIntent(state, {
      evasiveMovePressed: pressed("evade"),
      interactPressed: pressed("interact"),
      ultimatePressed: pressed("ultimate"),
      kitPressed: pressed("kit"),
      pausePressed: pressed("pause"),
      restartPressed: current.south && !this.previous.south,
      toggleFireModePressed: pressed("toggleFireMode"),
    });
    this.previous = current;
    return intent;
  }
}

function buildIntent(
  state: GamepadStateSnapshot,
  pressed: Pick<PlayerIntent,
    "evasiveMovePressed" | "interactPressed" | "ultimatePressed" | "kitPressed" | "pausePressed" | "restartPressed" | "toggleFireModePressed">,
): PlayerIntent {
  if (!state.connected) {
    return {
      move: { x: 0, y: 0 },
      aim: { x: 0, y: 0 },
      fireHeld: false,
      evasiveMovePressed: false,
      interactPressed: false,
      ultimatePressed: false,
      kitPressed: false,
      pausePressed: false,
      restartPressed: false,
    };
  }

  const move = applyDeadzone(state.leftStick, GAMEPAD_MOVE_DEADZONE);
  const aimStick = applyDeadzone(state.rightStick, GAMEPAD_AIM_DEADZONE);
  const aimMagnitude = Math.hypot(aimStick.x, aimStick.y);

  return {
    move,
    aim: aimMagnitude > 0 ? normalizeVector(aimStick) : { x: 0, y: 0 },
    // Aim and trigger remain independent. Auto-fire is a simulation setting;
    // Manual mode therefore requires RT/R1 even while the right stick aims.
    fireHeld: state.fireHeld,
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
    toggleFireModePressed: Boolean(keyboardMouse.toggleFireModePressed || gamepad.toggleFireModePressed),
    evasiveMovePressed: keyboardMouse.evasiveMovePressed || gamepad.evasiveMovePressed,
    interactPressed: keyboardMouse.interactPressed || gamepad.interactPressed,
    ultimatePressed: keyboardMouse.ultimatePressed || gamepad.ultimatePressed,
    kitPressed: keyboardMouse.kitPressed || gamepad.kitPressed,
    pausePressed: keyboardMouse.pausePressed || gamepad.pausePressed,
    restartPressed: keyboardMouse.restartPressed || gamepad.restartPressed,
  };
}
