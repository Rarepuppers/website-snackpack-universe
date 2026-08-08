import { applyBrowserFullscreen, currentBrowserFullscreenMode, type BrowserFullscreenDocument } from "./BrowserFullscreen";
import { browserDisplayCapabilities, desktopDisplayCapabilities, type DisplayCapabilities, type FullscreenMode } from "./DisplayCapabilities";

export interface DesktopDisplayInfo {
  id: string;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
}

export interface DesktopDisplayRequest {
  fullscreenMode: FullscreenMode;
  selectedDisplayId: string | null;
}

export interface DesktopDisplaySnapshot extends DesktopDisplayRequest {
  displays: readonly DesktopDisplayInfo[];
}

export interface DesktopDisplayBridge {
  getSnapshot(): Promise<DesktopDisplaySnapshot>;
  apply(request: DesktopDisplayRequest): Promise<DesktopDisplaySnapshot>;
}

export interface DesktopDisplayWindow {
  readonly desktopDisplay?: DesktopDisplayBridge;
}

let desktopBridge: DesktopDisplayBridge | null = null;
let desktopSnapshot: DesktopDisplaySnapshot | null = null;

export async function initializeDesktopDisplayRuntime(host: DesktopDisplayWindow): Promise<void> {
  desktopBridge = host.desktopDisplay ?? null;
  desktopSnapshot = null;
  if (!desktopBridge) return;
  try {
    desktopSnapshot = await desktopBridge.getSnapshot();
  } catch {
    desktopBridge = null;
  }
}

export function hostDisplayCapabilities(documentLike: { fullscreenEnabled?: boolean; documentElement: { requestFullscreen?: unknown } }): DisplayCapabilities {
  return desktopSnapshot
    ? desktopDisplayCapabilities(desktopSnapshot.displays.map(({ id, label }) => ({ id, label })))
    : browserDisplayCapabilities({
      fullscreenApiAvailable: documentLike.fullscreenEnabled === true
        && typeof documentLike.documentElement.requestFullscreen === "function",
    });
}

export function currentHostDisplaySelection(): DesktopDisplayRequest | null {
  return desktopSnapshot
    ? { fullscreenMode: desktopSnapshot.fullscreenMode, selectedDisplayId: desktopSnapshot.selectedDisplayId }
    : null;
}

export function displayLabelForId(id: unknown): string {
  return desktopSnapshot?.displays.find((display) => display.id === id)?.label ?? String(id ?? "AUTO").toUpperCase();
}

export async function applyHostDisplaySelection(
  documentLike: BrowserFullscreenDocument,
  request: DesktopDisplayRequest,
): Promise<DesktopDisplayRequest | null> {
  if (desktopBridge) {
    try {
      desktopSnapshot = await desktopBridge.apply(request);
      return currentHostDisplaySelection();
    } catch {
      return currentHostDisplaySelection();
    }
  }
  const applied = await applyBrowserFullscreen(documentLike, request.fullscreenMode);
  return applied
    ? { fullscreenMode: request.fullscreenMode, selectedDisplayId: null }
    : { fullscreenMode: currentBrowserFullscreenMode(documentLike), selectedDisplayId: null };
}
