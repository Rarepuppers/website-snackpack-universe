import { afterEach, describe, expect, it } from "vitest";
import { activeControllerGlyphFamily, setActiveControllerGlyphFamily } from "../input/ControllerGlyphs";
import { initializeSteamInputRuntime } from "./SteamInputRuntime";

afterEach(() => setActiveControllerGlyphFamily("generic"));

describe("Steam Input presentation bootstrap", () => {
  it("selects the connected Steam controller family before game boot", async () => {
    await initializeSteamInputRuntime({ steamworks: {
      getAchievement: () => false, setAchievement: () => undefined, storeStats: () => undefined,
      readCloudFile: () => null, writeCloudFile: () => undefined,
      getControllerType: () => "PS5Controller",
    } });
    expect(activeControllerGlyphFamily()).toBe("playstation");
  });

  it("keeps generic labels in browser hosts", async () => {
    setActiveControllerGlyphFamily("nintendo");
    await initializeSteamInputRuntime({});
    expect(activeControllerGlyphFamily()).toBe("generic");
  });

  it("fails open to generic labels when the native bridge rejects", async () => {
    setActiveControllerGlyphFamily("playstation");
    await initializeSteamInputRuntime({ steamworks: {
      getAchievement: () => false, setAchievement: () => undefined, storeStats: () => undefined,
      readCloudFile: () => null, writeCloudFile: () => undefined,
      getControllerType: () => Promise.reject(new Error("Steam down")),
    } });
    expect(activeControllerGlyphFamily()).toBe("generic");
  });
});
