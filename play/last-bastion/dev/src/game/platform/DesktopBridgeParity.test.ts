import { describe, expect, it } from "vitest";
import type { SteamworksBridge as DesktopSteamworksBridge } from "../../../../desktop/src/BridgeContract";
import type { SteamworksBridge as RendererSteamworksBridge } from "./PlatformAdapter";

type Extends<Left, Right> = Left extends Right ? true : false;

const desktopImplementsRenderer: Extends<DesktopSteamworksBridge, RendererSteamworksBridge> = true;
const rendererImplementsDesktop: Extends<RendererSteamworksBridge, DesktopSteamworksBridge> = true;

describe("desktop bridge contract parity", () => {
  it("keeps the preload surface exactly aligned with the renderer contract", () => {
    expect(desktopImplementsRenderer).toBe(true);
    expect(rendererImplementsDesktop).toBe(true);
  });
});
