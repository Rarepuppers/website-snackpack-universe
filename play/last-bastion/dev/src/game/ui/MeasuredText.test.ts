import { describe, expect, it } from "vitest";
import { ellipsizeToFit, fitText, type MeasureText } from "./MeasuredText";

/**
 * A deliberately crude monospace model: every glyph is 0.6em wide, every line is
 * 1.3em tall, and wrapping breaks on whole words. It is not Phaser's renderer
 * and does not need to be — what is under test is the *rule* for choosing a
 * size, not the glyph metrics, and injecting the measurement is what makes that
 * separable.
 */
function monospaceMeasure(lineSpacing = 0): MeasureText {
  return (content, fontSizePx, wrapWidth) => {
    const charWidth = fontSizePx * 0.6;
    const lineHeight = fontSizePx * 1.3 + lineSpacing;
    const perLine = Math.max(1, Math.floor(wrapWidth / charWidth));
    let lines = 0;
    let widest = 0;
    for (const paragraph of content.split("\n")) {
      const words = paragraph.split(" ").filter(Boolean);
      if (words.length === 0) { lines += 1; continue; }
      let current = "";
      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length > perLine && current) {
          lines += 1;
          widest = Math.max(widest, current.length);
          current = word;
        } else {
          current = candidate;
        }
      }
      lines += 1;
      widest = Math.max(widest, current.length);
    }
    return { width: Math.min(widest * charWidth, wrapWidth), height: lines * lineHeight };
  };
}

/** The live level-up stat card: 344x116, from PrototypeScene. */
const STAT_CARD = { maxWidth: 344, maxHeight: 116, sizesPx: [15, 14, 13, 12, 11, 10] } as const;

describe("fitText", () => {
  it("keeps the largest size for content that already fits", () => {
    const result = fitText({ ...STAT_CARD, content: "1. VIGOUR\n\n+8 MAX HEALTH" }, monospaceMeasure(4));
    expect(result.fontSizePx).toBe(15);
    expect(result.overflowed).toBe(false);
  });

  it("shrinks rather than overflowing when the description is long", () => {
    // The LB-11 case: a long stat card description at a fixed 15px pushed
    // through the bottom of the card and into the hint line beneath it.
    const long = "9. ADAPTIVE PLATING MATRIX\n\n+12 ARMOUR AND +6 FLAT DAMAGE REDUCTION AGAINST REPEATED ELEMENTAL HITS";
    const fixed = monospaceMeasure(4)(long, 15, 328);
    expect(fixed.height, "precondition: this content overflows at 15px").toBeGreaterThan(100);

    const result = fitText({ ...STAT_CARD, content: long }, monospaceMeasure(4));
    expect(result.fontSizePx).toBeLessThan(15);
    expect(result.overflowed).toBe(false);
    expect(result.metrics.height).toBeLessThanOrEqual(116 - 16);
  });

  it("reports overflow instead of pretending, when nothing fits", () => {
    const absurd = Array.from({ length: 80 }, (_, i) => `WORD${i}`).join(" ");
    const result = fitText({ ...STAT_CARD, content: absurd }, monospaceMeasure(4));
    expect(result.overflowed).toBe(true);
    // And it hands back the smallest offered size, so the caller renders
    // something legible rather than nothing.
    expect(result.fontSizePx).toBe(10);
  });

  it("never returns a wrap width wider than the box", () => {
    const result = fitText({ ...STAT_CARD, content: "SHORT" }, monospaceMeasure());
    expect(result.wrapWidth).toBeLessThanOrEqual(344);
    expect(result.metrics.width).toBeLessThanOrEqual(result.wrapWidth);
  });

  it("honours padding on both axes", () => {
    const tight = fitText({ ...STAT_CARD, content: "SHORT", padding: 40 }, monospaceMeasure());
    expect(tight.wrapWidth).toBe(344 - 80);
  });

  it("tries sizes largest first regardless of the order given", () => {
    const shuffled = fitText(
      { ...STAT_CARD, sizesPx: [11, 15, 13, 10, 14, 12], content: "1. VIGOUR\n\n+8 MAX HEALTH" },
      monospaceMeasure(4),
    );
    expect(shuffled.fontSizePx).toBe(15);
  });

  it("does not throw when handed no usable sizes", () => {
    const result = fitText(
      { ...STAT_CARD, sizesPx: [0, Number.NaN, -3], content: "ANYTHING" },
      monospaceMeasure(),
    );
    expect(result.overflowed).toBe(true);
  });

  it("fits every plausible stat-card string at some offered size", () => {
    // The guard that matters in practice: content authors add cards, and this
    // says the layout will cope rather than clipping in a screenshot nobody takes.
    const samples = [
      "1. VIGOUR\n\n+8 MAX HEALTH",
      "2. RAPID CYCLING\n\n+12% FIRE RATE FOR EVERY WEAPON IN THE RACK",
      "3. SCAVENGER'S EYE\n\n+25% SCRAP FROM CRATES AND ELITE CACHES COMBINED",
      "9. ADAPTIVE PLATING\n\n+12 ARMOUR AND +6 FLAT REDUCTION AGAINST REPEATED HITS",
    ];
    for (const content of samples) {
      const result = fitText({ ...STAT_CARD, content }, monospaceMeasure(4));
      expect(result.overflowed, content).toBe(false);
    }
  });
});

describe("ellipsizeToFit", () => {
  it("returns the content untouched when it already fits", () => {
    expect(ellipsizeToFit("SHORT", 12, 300, 100, monospaceMeasure())).toBe("SHORT");
  });

  it("truncates on a word boundary, never mid-word", () => {
    const long = Array.from({ length: 40 }, (_, i) => `WORD${i}`).join(" ");
    const result = ellipsizeToFit(long, 12, 120, 40, monospaceMeasure());
    expect(result.endsWith("…")).toBe(true);
    expect(result.replace("…", "").trim()).toMatch(/WORD\d+$/);
  });

  it("degrades to an ellipsis rather than returning nothing", () => {
    expect(ellipsizeToFit("SUPERCALIFRAGILISTIC", 40, 20, 5, monospaceMeasure())).toBe("…");
  });
});
