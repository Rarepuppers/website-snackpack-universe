import { BrowserWindow, ipcMain, screen } from "electron";
import { DESKTOP_DISPLAY_CHANNELS, type DesktopDisplayRequest, type DesktopDisplaySnapshot } from "./BridgeContract.js";
import { planDesktopDisplayTransition, type DesktopDisplayInfo } from "./DesktopDisplayPolicy.js";

function displays(): DesktopDisplayInfo[] {
  return screen.getAllDisplays().map((display, index) => ({
    id: String(display.id),
    label: display.label || `Display ${index + 1}`,
    bounds: { ...display.bounds },
    workArea: { ...display.workArea },
    scaleFactor: display.scaleFactor,
  }));
}

function snapshot(window: BrowserWindow): DesktopDisplaySnapshot {
  const available = displays();
  const current = screen.getDisplayMatching(window.getBounds());
  return {
    displays: available,
    selectedDisplayId: String(current.id),
    fullscreenMode: window.isFullScreen() ? "borderless" : "windowed",
  };
}

async function leaveFullscreen(window: BrowserWindow): Promise<void> {
  if (!window.isFullScreen()) return;
  await new Promise<void>((resolve) => {
    const fallback = setTimeout(resolve, 2_000);
    window.once("leave-full-screen", () => { clearTimeout(fallback); resolve(); });
    window.setFullScreen(false);
  });
}

export function registerDesktopDisplayIpc(): void {
  ipcMain.handle(DESKTOP_DISPLAY_CHANNELS.getSnapshot, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) throw new Error("Display request has no owning window");
    return snapshot(window);
  });
  ipcMain.handle(DESKTOP_DISPLAY_CHANNELS.apply, async (event, request: unknown) => {
    if (!request || typeof request !== "object") throw new TypeError("Display request is invalid");
    const candidate = request as Partial<DesktopDisplayRequest>;
    if ((candidate.fullscreenMode !== "windowed" && candidate.fullscreenMode !== "borderless")
      || (candidate.selectedDisplayId !== null && typeof candidate.selectedDisplayId !== "string")) {
      throw new TypeError("Display request is invalid");
    }
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) throw new Error("Display request has no owning window");
    const current = screen.getDisplayMatching(window.getBounds());
    const plan = planDesktopDisplayTransition(
      candidate as DesktopDisplayRequest,
      displays(),
      String(current.id),
      window.getNormalBounds(),
    );
    if (!plan) return snapshot(window);
    await leaveFullscreen(window);
    window.setBounds(plan.windowedBounds);
    if (plan.fullscreen) window.setFullScreen(true);
    return {
      displays: displays(),
      selectedDisplayId: plan.display.id,
      fullscreenMode: candidate.fullscreenMode,
    } satisfies DesktopDisplaySnapshot;
  });
}
