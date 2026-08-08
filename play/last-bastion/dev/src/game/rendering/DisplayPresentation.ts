import { BASE_HEIGHT, BASE_WIDTH, planDisplayScale } from "./DisplayScaling";

const MAX_DEVICE_SCALE = 8;
const EXPANDED_ASPECT_DIFFERENCE = 0.05;

export type RequestedPresentationMode = "auto" | PresentationMode;
export type PresentationMode = "crisp" | "fill" | "expanded-frame";

export interface DisplayRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface DisplayInsets {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export interface DisplayPresentationPlan {
  readonly requestedMode: RequestedPresentationMode;
  readonly mode: PresentationMode;
  /** Whole physical pixels per simulation texel in the offscreen world render. */
  readonly renderDeviceScale: number;
  readonly renderWidth: number;
  readonly renderHeight: number;
  /** Full-window compositor backing size in physical pixels. */
  readonly presentationWidth: number;
  readonly presentationHeight: number;
  /** Aspect-preserving destination in window/CSS pixels. */
  readonly worldRect: DisplayRect;
  /** worldRect snapped to physical compositor pixel boundaries. */
  readonly physicalWorldRect: DisplayRect;
  /** Space outside worldRect available to letterbox or authored frame UI. */
  readonly frameInsets: DisplayInsets;
  readonly sampling: "nearest" | "linear";
  readonly cropped: false;
}

export interface DisplayPresentationInput {
  readonly windowWidth: number;
  readonly windowHeight: number;
  readonly devicePixelRatio: number;
  readonly requestedMode?: RequestedPresentationMode;
  readonly expandedFrameAvailable?: boolean;
  readonly sizeMultiplier?: number;
}

/**
 * Plans rendering and presentation without touching Phaser, DOM fullscreen, or
 * Electron. Every mode preserves the 960x540 world aspect and reports the
 * unused frame explicitly, so Deck/ultrawide handling cannot silently crop or
 * stretch gameplay information.
 */
export function planDisplayPresentation(
  input: DisplayPresentationInput,
): DisplayPresentationPlan {
  const windowWidth = Math.max(1, input.windowWidth);
  const windowHeight = Math.max(1, input.windowHeight);
  const dpr = input.devicePixelRatio > 0 ? input.devicePixelRatio : 1;
  const sizeMultiplier = Math.max(0.1, input.sizeMultiplier ?? 1);
  const requestedMode = input.requestedMode ?? "auto";
  const presentationWidth = Math.max(1, Math.round(windowWidth * dpr));
  const presentationHeight = Math.max(1, Math.round(windowHeight * dpr));
  const fitted = fittedWorldRect(windowWidth, windowHeight, Math.min(1, sizeMultiplier));
  const aspectDifference = Math.abs(
    windowWidth / windowHeight / (BASE_WIDTH / BASE_HEIGHT) - 1,
  );
  const exactPhysicalScale = fitted.width * dpr / BASE_WIDTH;
  const exactIntegerFit = nearlyInteger(exactPhysicalScale)
    && nearlyEqual(fitted.width, windowWidth)
    && nearlyEqual(fitted.height, windowHeight);

  let mode: PresentationMode;
  if (requestedMode === "auto") {
    mode = exactIntegerFit
      ? "crisp"
      : aspectDifference > EXPANDED_ASPECT_DIFFERENCE && input.expandedFrameAvailable
        ? "expanded-frame"
        : "fill";
  } else if (requestedMode === "expanded-frame" && !input.expandedFrameAvailable) {
    mode = "fill";
  } else {
    mode = requestedMode;
  }

  if (mode === "crisp") {
    // Presentation modes never crop the world. The legacy display-size slider
    // may request values above 100%, but this contract caps them at the window;
    // a future settings migration can relabel that preference explicitly.
    const scale = planDisplayScale(windowWidth, windowHeight, dpr, Math.min(1, sizeMultiplier));
    const width = BASE_WIDTH * scale.zoom;
    const height = BASE_HEIGHT * scale.zoom;
    const worldRect = centredRect(windowWidth, windowHeight, width, height);
    return {
      requestedMode,
      mode,
      renderDeviceScale: scale.deviceScale,
      renderWidth: BASE_WIDTH * scale.deviceScale,
      renderHeight: BASE_HEIGHT * scale.deviceScale,
      presentationWidth,
      presentationHeight,
      worldRect,
      physicalWorldRect: physicalRect(worldRect, dpr),
      frameInsets: insetsFor(windowWidth, windowHeight, worldRect),
      sampling: "nearest",
      cropped: false,
    };
  }

  const requiredDeviceScale = Math.min(
    MAX_DEVICE_SCALE,
    Math.max(1, Math.ceil(fitted.width * dpr / BASE_WIDTH - Number.EPSILON)),
  );
  return {
    requestedMode,
    mode,
    renderDeviceScale: requiredDeviceScale,
    renderWidth: BASE_WIDTH * requiredDeviceScale,
    renderHeight: BASE_HEIGHT * requiredDeviceScale,
    presentationWidth,
    presentationHeight,
    worldRect: fitted,
    physicalWorldRect: physicalRect(fitted, dpr),
    frameInsets: insetsFor(windowWidth, windowHeight, fitted),
    sampling: nearlyInteger(fitted.width * dpr / BASE_WIDTH) ? "nearest" : "linear",
    cropped: false,
  };
}

function physicalRect(rect: DisplayRect, devicePixelRatio: number): DisplayRect {
  const left = Math.round(rect.x * devicePixelRatio);
  const top = Math.round(rect.y * devicePixelRatio);
  return {
    x: left,
    y: top,
    width: Math.max(1, Math.round(rect.width * devicePixelRatio)),
    height: Math.max(1, Math.round(rect.height * devicePixelRatio)),
  };
}

function fittedWorldRect(
  windowWidth: number,
  windowHeight: number,
  sizeMultiplier: number,
): DisplayRect {
  const scale = Math.min(windowWidth / BASE_WIDTH, windowHeight / BASE_HEIGHT) * sizeMultiplier;
  return centredRect(windowWidth, windowHeight, BASE_WIDTH * scale, BASE_HEIGHT * scale);
}

function centredRect(
  windowWidth: number,
  windowHeight: number,
  width: number,
  height: number,
): DisplayRect {
  return {
    x: (windowWidth - width) / 2,
    y: (windowHeight - height) / 2,
    width,
    height,
  };
}

function insetsFor(
  windowWidth: number,
  windowHeight: number,
  rect: DisplayRect,
): DisplayInsets {
  return {
    left: rect.x,
    top: rect.y,
    right: windowWidth - rect.x - rect.width,
    bottom: windowHeight - rect.y - rect.height,
  };
}

function nearlyInteger(value: number): boolean {
  return nearlyEqual(value, Math.round(value));
}

function nearlyEqual(first: number, second: number): boolean {
  return Math.abs(first - second) <= 1e-7;
}
