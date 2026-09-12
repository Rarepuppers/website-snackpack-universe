import { describe, expect, it } from "vitest";
import { LEVEL_STAT_CARDS } from "./levelStatCatalog";
import { LEVEL_STAT_LABELS } from "./levelStatCatalog";
import { fitText, type MeasureText } from "../ui/MeasuredText";

/**
 * LB-11's regression guard, aimed at the thing that actually causes it: content.
 *
 * The card layout was fixed at 15px wrapped to 312px, authored against the
 * shortest entries in the catalogue. Nothing failed when a longer name shipped —
 * the text simply left the card and collided with the hint line. This runs every
 * real card through the same fitting rule the scene uses and asserts each one
 * lands inside its box.
 *
 * The measurement is a monospace approximation, not Phaser's renderer, so this
 * cannot certify pixel-exact rendering — that needs the QA-04b screenshot pass.
 * What it does catch is the case the defect actually arrives as: someone adds a
 * card whose copy is far longer than the rest.
 */
const STAT_CARD_WIDTH = 344;
const STAT_CARD_HEIGHT = 116;
const STAT_CARD_PADDING = 10;
const STAT_CARD_SIZES = [15, 14, 13, 12, 11, 10];

/** Consolas is monospace; 0.6em per glyph and 1.3em per line are close enough. */
const measure: MeasureText = (content, fontSizePx, wrapWidth) => {
  const charWidth = fontSizePx * 0.6;
  const lineHeight = fontSizePx * 1.3 + 4;
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

/** Mirrors how the decision overlay composes a stat card's copy. */
function cardContent(card: typeof LEVEL_STAT_CARDS[number], quickKeyIndex: number): string {
  const quickKey = quickKeyIndex < 9 ? `${quickKeyIndex + 1}. ` : "";
  const label = LEVEL_STAT_LABELS[card.statKey] ?? card.statKey;
  const value = card.unit === "percent" ? `+${card.amount}% ${label}` : `+${card.amount} ${label}`;
  return `${quickKey}${card.name}\n\n${value.toUpperCase()}`;
}

describe("level-up stat cards fit their card", () => {
  it("has cards to check", () => {
    expect(LEVEL_STAT_CARDS.length).toBeGreaterThan(10);
  });

  it("fits every catalogue card at one of the offered sizes", () => {
    const overflowing: string[] = [];
    for (const [index, card] of LEVEL_STAT_CARDS.entries()) {
      const fit = fitText({
        content: cardContent(card, index),
        maxWidth: STAT_CARD_WIDTH,
        maxHeight: STAT_CARD_HEIGHT,
        sizesPx: STAT_CARD_SIZES,
        padding: STAT_CARD_PADDING,
      }, measure);
      if (fit.overflowed) overflowing.push(`${card.id} (${card.name})`);
    }
    expect(overflowing, "cards whose copy cannot fit even at 10px").toEqual([]);
  });

  it("actually rejects copy that cannot fit — calibration, not decoration", () => {
    // A green guard proves nothing until you have seen it go red. This is the
    // shape of the card that would reintroduce LB-11.
    const NEWLINE = String.fromCharCode(10);
    const absurd = [
      "9. ADAPTIVE COUNTERMEASURE PLATING MATRIX MARK THREE",
      "",
      "+12% DAMAGE REDUCTION AGAINST REPEATED ELEMENTAL HITS OF THE SAME TYPE, "
        + "PLUS SIX FLAT ARMOUR AND A REBATE ON EVERY CACHE OPENED DURING THE "
        + "REMAINDER OF THIS EXPEDITION RUN",
    ].join(NEWLINE);
    const fit = fitText({
      content: absurd,
      maxWidth: STAT_CARD_WIDTH,
      maxHeight: STAT_CARD_HEIGHT,
      sizesPx: STAT_CARD_SIZES,
      padding: STAT_CARD_PADDING,
    }, measure);
    expect(fit.overflowed).toBe(true);
  });

  it("keeps most cards at a comfortable size rather than shrinking everything", () => {
    // If the whole catalogue had to drop to 11px the card is simply too small,
    // and the answer would be a bigger card rather than smaller type.
    const sizes = LEVEL_STAT_CARDS.map((card, index) => fitText({
      content: cardContent(card, index),
      maxWidth: STAT_CARD_WIDTH,
      maxHeight: STAT_CARD_HEIGHT,
      sizesPx: STAT_CARD_SIZES,
      padding: STAT_CARD_PADDING,
    }, measure).fontSizePx);
    const comfortable = sizes.filter((size) => size >= 13).length;
    expect(comfortable / sizes.length).toBeGreaterThan(0.8);
  });
});
