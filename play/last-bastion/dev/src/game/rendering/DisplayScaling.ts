/**
 * Display scaling that snaps to whole PHYSICAL pixels.
 *
 * Snapping the Phaser zoom to a whole number is not enough: on a display with
 * a fractional devicePixelRatio (Windows at 125% scaling reports 1.25), a CSS
 * zoom of 2 becomes 2.5 device pixels per canvas texel, and the browser
 * resamples that last fraction — which softens both pixel art and text.
 *
 * Instead we choose a whole device-pixel scale N and derive the CSS zoom from
 * it (`zoom = N / dpr`), so one canvas texel always covers exactly N × N
 * physical pixels. Text is then generated at resolution N so its glyph texture
 * is authored at native device density rather than upscaled.
 */
export const BASE_WIDTH = 960;
export const BASE_HEIGHT = 540;

/** Beyond this the canvas is larger than any current display needs. */
const MAX_DEVICE_SCALE = 8;

export interface DisplayScalePlan {
  /** Phaser zoom in CSS pixels; usually fractional on HiDPI displays. */
  zoom: number;
  /** Whole physical pixels per canvas texel — also the ideal text resolution. */
  deviceScale: number;
}

/**
 * Largest whole device-pixel scale whose canvas still fits the window.
 * `sizeMultiplier` is the player's game-size preference (1 = fit the window);
 * values below 1 deliberately shrink the canvas for a smaller window.
 */
export function planDisplayScale(
  windowWidth: number,
  windowHeight: number,
  devicePixelRatio: number,
  sizeMultiplier = 1,
): DisplayScalePlan {
  const dpr = devicePixelRatio > 0 ? devicePixelRatio : 1;
  const budgetWidth = Math.max(windowWidth, 1) * Math.max(sizeMultiplier, 0.1);
  const budgetHeight = Math.max(windowHeight, 1) * Math.max(sizeMultiplier, 0.1);

  let deviceScale = 1;
  for (let candidate = 1; candidate <= MAX_DEVICE_SCALE; candidate += 1) {
    const cssWidth = (BASE_WIDTH * candidate) / dpr;
    const cssHeight = (BASE_HEIGHT * candidate) / dpr;
    if (cssWidth > budgetWidth || cssHeight > budgetHeight) {
      break;
    }
    deviceScale = candidate;
  }

  return { deviceScale, zoom: deviceScale / dpr };
}

let currentDeviceScale = 2;

export function setUiDeviceScale(deviceScale: number): void {
  currentDeviceScale = Math.max(1, Math.round(deviceScale));
}

/**
 * Resolution for dynamically generated text so glyphs are rasterised at
 * physical-pixel density instead of being upscaled with the pixel-art filter.
 */
export function uiTextResolution(): number {
  return currentDeviceScale;
}
