import type { GamepadButton } from "./ControlBindings";

export type ControllerGlyphFamily = "generic" | "playstation" | "nintendo";

let activeFamily: ControllerGlyphFamily = "generic";

export function controllerGlyphFamilyFromSteamType(value: unknown): ControllerGlyphFamily {
  if (value === "PS3Controller" || value === "PS4Controller" || value === "PS5Controller") return "playstation";
  if (value === "SwitchJoyConPair" || value === "SwitchJoyConSingle" || value === "SwitchProController") return "nintendo";
  return "generic";
}

export function setActiveControllerGlyphFamily(family: ControllerGlyphFamily): void {
  activeFamily = family;
}

export function activeControllerGlyphFamily(): ControllerGlyphFamily {
  return activeFamily;
}

/** Shape-position semantics stay stable while the printed face labels change. */
export function controllerButtonLabel(
  button: GamepadButton,
  family: ControllerGlyphFamily = activeFamily,
): string {
  if (button === "start") return "START";
  if (button === "rightStick") return "R3";
  if (family === "playstation") {
    return ({ south: "CROSS", east: "CIRCLE", west: "SQUARE", north: "TRIANGLE" } as const)[button];
  }
  if (family === "nintendo") {
    return ({ south: "B", east: "A", west: "Y", north: "X" } as const)[button];
  }
  return ({ south: "A", east: "B", west: "X", north: "Y" } as const)[button];
}
