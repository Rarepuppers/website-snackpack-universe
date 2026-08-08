import { describe, expect, it } from "vitest";
import type {
  DesktopDisplayBridge as DesktopHostDisplayBridge,
  DesktopSaveBridge as DesktopHostSaveBridge,
  SteamworksBridge as DesktopSteamworksBridge,
} from "../../../../desktop/src/BridgeContract";
import type { SteamworksBridge as RendererSteamworksBridge } from "./PlatformAdapter";
import type { DesktopSaveBridge as RendererDesktopSaveBridge } from "../save/SaveStorage";
import type { DesktopDisplayBridge as RendererDesktopDisplayBridge } from "../rendering/DesktopDisplayRuntime";

type Extends<Left, Right> = Left extends Right ? true : false;

const desktopImplementsRenderer: Extends<DesktopSteamworksBridge, RendererSteamworksBridge> = true;
const rendererImplementsDesktop: Extends<RendererSteamworksBridge, DesktopSteamworksBridge> = true;
const desktopSaveImplementsRenderer: Extends<DesktopHostSaveBridge, RendererDesktopSaveBridge> = true;
const rendererSaveImplementsDesktop: Extends<RendererDesktopSaveBridge, DesktopHostSaveBridge> = true;
const desktopDisplayImplementsRenderer: Extends<DesktopHostDisplayBridge, RendererDesktopDisplayBridge> = true;
const rendererDisplayImplementsDesktop: Extends<RendererDesktopDisplayBridge, DesktopHostDisplayBridge> = true;

describe("desktop bridge contract parity", () => {
  it("keeps the preload surface exactly aligned with the renderer contract", () => {
    expect(desktopImplementsRenderer).toBe(true);
    expect(rendererImplementsDesktop).toBe(true);
    expect(desktopSaveImplementsRenderer).toBe(true);
    expect(rendererSaveImplementsDesktop).toBe(true);
    expect(desktopDisplayImplementsRenderer).toBe(true);
    expect(rendererDisplayImplementsDesktop).toBe(true);
  });
});
