export type DisplayHost = "browser" | "desktop";
export type FullscreenMode = "windowed" | "borderless";
export type FrameCap = 60 | 120 | 144 | "display";

/**
 * Host capabilities are deliberately separate from saved preferences. A browser
 * must never advertise monitor selection, exclusive fullscreen, vsync control,
 * or an uncapped loop merely because a future Electron host can implement it.
 */
export interface DisplayCapabilities {
  readonly host: DisplayHost;
  readonly fullscreenModes: readonly FullscreenMode[];
  readonly canSelectDisplay: boolean;
  readonly frameCaps: readonly FrameCap[];
  readonly canControlVsync: false;
}

export interface BrowserDisplayCapabilityInput {
  readonly fullscreenApiAvailable: boolean;
}

export function browserDisplayCapabilities(
  input: BrowserDisplayCapabilityInput,
): DisplayCapabilities {
  return {
    host: "browser",
    fullscreenModes: input.fullscreenApiAvailable
      ? ["windowed", "borderless"]
      : ["windowed"],
    canSelectDisplay: false,
    frameCaps: [60, "display"],
    canControlVsync: false,
  };
}

/**
 * This is the proven minimum for the planned Electron host. Exclusive
 * fullscreen, uncapped rendering, and direct vsync control remain absent until
 * a host spike demonstrates that they work consistently across supported OSes.
 */
export function desktopDisplayCapabilities(): DisplayCapabilities {
  return {
    host: "desktop",
    fullscreenModes: ["windowed", "borderless"],
    canSelectDisplay: true,
    frameCaps: [60, 120, 144, "display"],
    canControlVsync: false,
  };
}
