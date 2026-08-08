import { afterEach, describe, expect, it } from "vitest";
import {
  controllerButtonLabel,
  controllerGlyphFamilyFromSteamType,
  setActiveControllerGlyphFamily,
} from "./ControllerGlyphs";

afterEach(() => setActiveControllerGlyphFamily("generic"));

describe("controller glyph labels", () => {
  it("maps Steam controller types to stable presentation families", () => {
    expect(controllerGlyphFamilyFromSteamType("SteamDeckController")).toBe("generic");
    expect(controllerGlyphFamilyFromSteamType("XBoxOneController")).toBe("generic");
    expect(controllerGlyphFamilyFromSteamType("PS5Controller")).toBe("playstation");
    expect(controllerGlyphFamilyFromSteamType("SwitchProController")).toBe("nintendo");
    expect(controllerGlyphFamilyFromSteamType("future-pad")).toBe("generic");
  });

  it("uses physical button position while rendering device-correct legends", () => {
    expect(controllerButtonLabel("south", "generic")).toBe("A");
    expect(controllerButtonLabel("south", "playstation")).toBe("CROSS");
    expect(controllerButtonLabel("south", "nintendo")).toBe("B");
    expect(controllerButtonLabel("east", "nintendo")).toBe("A");
    expect(controllerButtonLabel("rightStick", "playstation")).toBe("R3");
  });
});
