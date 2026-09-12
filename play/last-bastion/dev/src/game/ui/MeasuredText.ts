/**
 * Measure-then-size: choose the largest type that actually fits a box.
 *
 * Presentation-defect plan §5.1. The defect class it closes is the one that
 * produced LB-06 and LB-11 independently — a fixed font size and a fixed
 * `wordWrap` width authored against the *shortest* content, which then clips or
 * collides the moment a longer name or description ships. The level-up stat
 * cards are the clearest case: a 344x116 card with 15px text wrapped at 312px,
 * where two extra words push the description through the bottom edge and into
 * the hint line underneath.
 *
 * The measurement function is injected. That keeps the layout decision pure and
 * testable without Phaser, a canvas or a font — and it means the production path
 * can hand in Phaser's real glyph metrics rather than an approximation.
 *
 * ## The contract that matters
 *
 * `fitText` never silently lies. If the content does not fit even at the
 * smallest offered size, it returns `overflowed: true` and the smallest size,
 * so the caller can ellipsize, re-author the copy, or fail a test. Quietly
 * returning an overflowing layout is how this defect class survives review.
 */

export interface TextMetrics {
  readonly width: number;
  readonly height: number;
}

/**
 * Measures `content` rendered at `fontSizePx`, wrapped at `wrapWidth`.
 * Implementations must account for wrapping and line spacing.
 */
export type MeasureText = (content: string, fontSizePx: number, wrapWidth: number) => TextMetrics;

export interface FitRequest {
  readonly content: string;
  /** Box the text must sit inside, before padding. */
  readonly maxWidth: number;
  readonly maxHeight: number;
  /** Candidate sizes. Order does not matter; they are tried largest first. */
  readonly sizesPx: readonly number[];
  /** Inset applied to all four sides. Defaults to a comfortable 8px. */
  readonly padding?: number;
}

export interface FitResult {
  readonly fontSizePx: number;
  /** Wrap width the caller should pass to the text object. */
  readonly wrapWidth: number;
  /** Measured size at the chosen font size. */
  readonly metrics: TextMetrics;
  /** True when even the smallest candidate overflows the box. */
  readonly overflowed: boolean;
}

export function fitText(request: FitRequest, measure: MeasureText): FitResult {
  const padding = request.padding ?? 8;
  const wrapWidth = Math.max(1, request.maxWidth - padding * 2);
  const availableHeight = Math.max(1, request.maxHeight - padding * 2);

  const candidates = [...new Set(request.sizesPx)]
    .filter((size) => Number.isFinite(size) && size > 0)
    .sort((left, right) => right - left);

  if (candidates.length === 0) {
    // A caller that offers no sizes has a bug; reporting overflow at a nominal
    // size is more useful than throwing inside a render path.
    return { fontSizePx: 1, wrapWidth, metrics: { width: 0, height: 0 }, overflowed: true };
  }

  let smallest: FitResult | null = null;
  for (const fontSizePx of candidates) {
    const metrics = measure(request.content, fontSizePx, wrapWidth);
    const fits = metrics.width <= wrapWidth && metrics.height <= availableHeight;
    const result: FitResult = { fontSizePx, wrapWidth, metrics, overflowed: !fits };
    if (fits) return result;
    smallest = result;
  }
  return smallest!;
}

/**
 * Trims `content` to the longest prefix that fits, with a single-character
 * ellipsis. Only for the genuinely-does-not-fit case: losing words is worse
 * than smaller type, so callers should exhaust `fitText` first.
 */
export function ellipsizeToFit(
  content: string,
  fontSizePx: number,
  wrapWidth: number,
  maxHeight: number,
  measure: MeasureText,
): string {
  if (measure(content, fontSizePx, wrapWidth).height <= maxHeight) return content;
  // Word boundaries, not characters: a truncation mid-word reads as corruption.
  const words = content.split(/\s+/).filter(Boolean);
  let best = "";
  for (let count = 1; count <= words.length; count += 1) {
    const candidate = `${words.slice(0, count).join(" ")}…`;
    if (measure(candidate, fontSizePx, wrapWidth).height > maxHeight) break;
    best = candidate;
  }
  return best || "…";
}

/**
 * Phaser's own measurement, for the production path. Kept here so the one place
 * that knows how to ask Phaser for glyph metrics is next to the rule that uses
 * the answer.
 */
export function phaserTextMeasure(
  scene: { make: { text(config: object, addToScene?: boolean): { width: number; height: number; destroy(): void } } },
  style: { fontFamily: string; lineSpacing?: number; align?: string },
): MeasureText {
  return (content, fontSizePx, wrapWidth) => {
    // `addToScene: false` builds the text object without displaying it, so
    // measuring never flickers a frame of unsized text on screen.
    const probe = scene.make.text({
      text: content,
      style: {
        ...style,
        fontSize: `${fontSizePx}px`,
        wordWrap: { width: wrapWidth },
      },
    }, false);
    const metrics = { width: probe.width, height: probe.height };
    probe.destroy();
    return metrics;
  };
}
