import type { FullscreenMode } from "./DisplayCapabilities";

export interface BrowserFullscreenDocument {
  readonly fullscreenElement: unknown;
  readonly documentElement: { requestFullscreen?: () => Promise<void> };
  exitFullscreen?: () => Promise<void>;
}

/**
 * Applies the browser's supported windowed/borderless contract. Rejections
 * are expected when the host revokes permission or the call loses its user
 * gesture, so callers receive false instead of an unhandled promise rejection.
 */
export async function applyBrowserFullscreen(
  documentLike: BrowserFullscreenDocument,
  mode: FullscreenMode,
): Promise<boolean> {
  try {
    if (mode === "borderless") {
      if (!documentLike.fullscreenElement) {
        if (!documentLike.documentElement.requestFullscreen) return false;
        await documentLike.documentElement.requestFullscreen();
      }
      return true;
    }
    if (documentLike.fullscreenElement) {
      if (!documentLike.exitFullscreen) return false;
      await documentLike.exitFullscreen();
    }
    return true;
  } catch {
    return false;
  }
}

export function currentBrowserFullscreenMode(
  documentLike: Pick<BrowserFullscreenDocument, "fullscreenElement">,
): FullscreenMode {
  return documentLike.fullscreenElement ? "borderless" : "windowed";
}
