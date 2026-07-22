export const KEYBOARD_BINDABLE_ACTIONS = [
  "moveUp", "moveDown", "moveLeft", "moveRight",
  "evade", "interact", "ultimate", "kit", "toggleFireMode", "pause",
] as const;

export const GAMEPAD_BINDABLE_ACTIONS = [
  "evade", "interact", "ultimate", "kit", "toggleFireMode", "pause",
] as const;

export type KeyboardBindableAction = typeof KEYBOARD_BINDABLE_ACTIONS[number];
export type GamepadBindableAction = typeof GAMEPAD_BINDABLE_ACTIONS[number];
export type GamepadButton = "south" | "east" | "west" | "north" | "start" | "rightStick";

export interface ControlBindings {
  keyboard: Record<KeyboardBindableAction, string>;
  gamepad: Record<GamepadBindableAction, GamepadButton>;
}

export const DEFAULT_CONTROL_BINDINGS: Readonly<ControlBindings> = Object.freeze({
  keyboard: Object.freeze({
    moveUp: "KeyW", moveDown: "KeyS", moveLeft: "KeyA", moveRight: "KeyD",
    evade: "Space", interact: "KeyE", ultimate: "KeyR", kit: "KeyQ",
    toggleFireMode: "KeyT", pause: "Escape",
  }),
  gamepad: Object.freeze({
    evade: "south", interact: "west", ultimate: "north", kit: "east",
    toggleFireMode: "rightStick", pause: "start",
  }),
});

const GAMEPAD_BUTTONS: readonly GamepadButton[] = ["south", "east", "west", "north", "start", "rightStick"];
const KEY_CODE_PATTERN = /^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|Arrow(?:Up|Down|Left|Right)|Space|Enter|Escape|Tab|Backspace|Shift(?:Left|Right)|Control(?:Left|Right)|Alt(?:Left|Right))$/;

export function isBindableKeyboardCode(code: string): boolean {
  return KEY_CODE_PATTERN.test(code);
}

export function normalizeControlBindings(value: unknown): ControlBindings {
  const candidate = typeof value === "object" && value !== null ? value as Partial<ControlBindings> : {};
  const keyboardCandidate: Partial<Record<KeyboardBindableAction, unknown>> = typeof candidate.keyboard === "object" && candidate.keyboard !== null ? candidate.keyboard : {};
  const gamepadCandidate: Partial<Record<GamepadBindableAction, unknown>> = typeof candidate.gamepad === "object" && candidate.gamepad !== null ? candidate.gamepad : {};
  const keyboard = { ...DEFAULT_CONTROL_BINDINGS.keyboard };
  const gamepad = { ...DEFAULT_CONTROL_BINDINGS.gamepad };
  for (const action of KEYBOARD_BINDABLE_ACTIONS) {
    const code = keyboardCandidate[action];
    if (typeof code === "string" && isBindableKeyboardCode(code)) keyboard[action] = code;
  }
  for (const action of GAMEPAD_BINDABLE_ACTIONS) {
    const button = gamepadCandidate[action];
    if (typeof button === "string" && GAMEPAD_BUTTONS.includes(button as GamepadButton)) {
      gamepad[action] = button as GamepadButton;
    }
  }
  return { keyboard, gamepad };
}

/** One physical input owns one action; assigning it swaps any collision. */
export function rebindKeyboard(
  bindings: ControlBindings,
  action: KeyboardBindableAction,
  code: string,
): ControlBindings {
  if (!isBindableKeyboardCode(code)) return normalizeControlBindings(bindings);
  const keyboard = { ...bindings.keyboard };
  const displaced = KEYBOARD_BINDABLE_ACTIONS.find((key) => key !== action && keyboard[key] === code);
  if (displaced) keyboard[displaced] = keyboard[action];
  keyboard[action] = code;
  return { keyboard, gamepad: { ...bindings.gamepad } };
}

export function rebindGamepad(
  bindings: ControlBindings,
  action: GamepadBindableAction,
  button: GamepadButton,
): ControlBindings {
  const gamepad = { ...bindings.gamepad };
  const displaced = GAMEPAD_BINDABLE_ACTIONS.find((key) => key !== action && gamepad[key] === button);
  if (displaced) gamepad[displaced] = gamepad[action];
  gamepad[action] = button;
  return { keyboard: { ...bindings.keyboard }, gamepad };
}

export function keyboardBindingLabel(code: string): string {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return ({ Space: "SPACE", Escape: "ESC", Enter: "ENTER", ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→" } as Record<string, string>)[code]
    ?? code.replace(/(Left|Right)$/, " $1").toUpperCase();
}

export function gamepadBindingLabel(button: GamepadButton): string {
  return ({ south: "A/×", east: "B/○", west: "X/□", north: "Y/△", start: "START", rightStick: "R3" })[button];
}

/** DOM KeyboardEvent.code to the numeric key codes Phaser accepts. */
export function keyboardCodeNumber(code: string): number {
  if (/^Key[A-Z]$/.test(code)) return code.charCodeAt(3);
  if (/^Digit[0-9]$/.test(code)) return code.charCodeAt(5);
  const fixed: Record<string, number> = {
    Space: 32, Enter: 13, Escape: 27, Tab: 9, Backspace: 8,
    ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40,
    ShiftLeft: 16, ShiftRight: 16, ControlLeft: 17, ControlRight: 17,
    AltLeft: 18, AltRight: 18,
  };
  if (/^Numpad[0-9]$/.test(code)) return 96 + Number(code.slice(6));
  return fixed[code] ?? 0;
}
