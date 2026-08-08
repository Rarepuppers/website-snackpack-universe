export interface DesktopRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DesktopDisplayInfo {
  id: string;
  label: string;
  bounds: DesktopRectangle;
  workArea: DesktopRectangle;
  scaleFactor: number;
}

export interface DesktopDisplayRequest {
  fullscreenMode: "windowed" | "borderless";
  selectedDisplayId: string | null;
}

export interface DesktopDisplayPlan {
  display: DesktopDisplayInfo;
  windowedBounds: DesktopRectangle;
  fullscreen: boolean;
}

export function planDesktopDisplayTransition(
  request: DesktopDisplayRequest,
  displays: readonly DesktopDisplayInfo[],
  currentDisplayId: string | null,
  normalBounds: DesktopRectangle,
): DesktopDisplayPlan | null {
  if (displays.length === 0) return null;
  const display = displays.find(({ id }) => id === request.selectedDisplayId)
    ?? displays.find(({ id }) => id === currentDisplayId)
    ?? displays[0]!;
  const width = Math.min(display.workArea.width, Math.max(960, normalBounds.width));
  const height = Math.min(display.workArea.height, Math.max(540, normalBounds.height));
  return {
    display,
    windowedBounds: {
      x: Math.round(display.workArea.x + (display.workArea.width - width) / 2),
      y: Math.round(display.workArea.y + (display.workArea.height - height) / 2),
      width,
      height,
    },
    fullscreen: request.fullscreenMode === "borderless",
  };
}
