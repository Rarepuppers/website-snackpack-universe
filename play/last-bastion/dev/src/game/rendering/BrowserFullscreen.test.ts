import { describe, expect, it, vi } from "vitest";
import { applyBrowserFullscreen, currentBrowserFullscreenMode } from "./BrowserFullscreen";

describe("browser fullscreen", () => {
  it("enters borderless fullscreen through the document element", async () => {
    const requestFullscreen = vi.fn(async () => undefined);
    expect(await applyBrowserFullscreen({
      fullscreenElement: null,
      documentElement: { requestFullscreen },
    }, "borderless")).toBe(true);
    expect(requestFullscreen).toHaveBeenCalledOnce();
  });

  it("exits fullscreen and treats an already-resolved mode as success", async () => {
    const exitFullscreen = vi.fn(async () => undefined);
    expect(await applyBrowserFullscreen({
      fullscreenElement: {}, documentElement: {}, exitFullscreen,
    }, "windowed")).toBe(true);
    expect(exitFullscreen).toHaveBeenCalledOnce();
    expect(await applyBrowserFullscreen({
      fullscreenElement: null, documentElement: {}, exitFullscreen,
    }, "windowed")).toBe(true);
  });

  it("reports unavailable or rejected requests without throwing", async () => {
    expect(await applyBrowserFullscreen({
      fullscreenElement: null, documentElement: {},
    }, "borderless")).toBe(false);
    expect(await applyBrowserFullscreen({
      fullscreenElement: null,
      documentElement: { requestFullscreen: vi.fn(async () => { throw new Error("denied"); }) },
    }, "borderless")).toBe(false);
  });

  it("derives the current mode from the live browser state", () => {
    expect(currentBrowserFullscreenMode({ fullscreenElement: null })).toBe("windowed");
    expect(currentBrowserFullscreenMode({ fullscreenElement: {} })).toBe("borderless");
  });
});
