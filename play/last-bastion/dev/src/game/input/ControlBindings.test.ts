import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONTROL_BINDINGS,
  keyboardBindingLabel,
  keyboardCodeNumber,
  normalizeControlBindings,
  rebindGamepad,
  rebindKeyboard,
} from "./ControlBindings";

describe("control bindings", () => {
  it("normalizes partial or malformed saves onto accessible defaults", () => {
    const bindings = normalizeControlBindings({ keyboard: { evade: "KeyF", pause: "bad" }, gamepad: { kit: "north", evade: "invalid" } });
    expect(bindings.keyboard.evade).toBe("KeyF");
    expect(bindings.keyboard.pause).toBe("Escape");
    expect(bindings.gamepad.kit).toBe("north");
    expect(bindings.gamepad.evade).toBe("south");
  });

  it("swaps collisions so every input remains uniquely owned", () => {
    const keyboard = rebindKeyboard(normalizeControlBindings(DEFAULT_CONTROL_BINDINGS), "evade", "KeyE");
    expect(keyboard.keyboard.evade).toBe("KeyE");
    expect(keyboard.keyboard.interact).toBe("Space");
    const gamepad = rebindGamepad(keyboard, "ultimate", "south");
    expect(gamepad.gamepad.ultimate).toBe("south");
    expect(gamepad.gamepad.evade).toBe("north");
  });

  it("formats stable codes and converts them for Phaser", () => {
    expect(keyboardBindingLabel("KeyQ")).toBe("Q");
    expect(keyboardBindingLabel("ArrowUp")).toBe("↑");
    expect(keyboardCodeNumber("KeyW")).toBe(87);
    expect(keyboardCodeNumber("Numpad4")).toBe(100);
  });
});
