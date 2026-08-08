import { controllerGlyphFamilyFromSteamType, setActiveControllerGlyphFamily } from "../input/ControllerGlyphs";
import type { SteamworksWindow } from "./HostPlatform";

/** Resolves presentation labels before Phaser constructs any HUD or shell text. */
export async function initializeSteamInputRuntime(host: SteamworksWindow): Promise<void> {
  try {
    const type = await host.steamworks?.getControllerType?.() ?? null;
    setActiveControllerGlyphFamily(controllerGlyphFamilyFromSteamType(type));
  } catch {
    // Input discovery is presentation-only; Steam/IPC downtime must never
    // prevent game boot or disable the already-working browser gamepad path.
    setActiveControllerGlyphFamily("generic");
  }
}
