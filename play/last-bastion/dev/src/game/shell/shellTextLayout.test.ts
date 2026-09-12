import { describe, expect, it } from "vitest";
import { HERO_CATALOG } from "../hero/HeroCatalog";
import { PERK_CATALOG } from "../perks/perkCatalog";
import { fitText, type MeasureText } from "../ui/MeasuredText";
import { perkGridLayout } from "./ScreenFlow";

/**
 * Presentation plan §5.4 — the overflow audit, aimed at the two blocks of
 * character-select copy that are still laid out by hand.
 *
 * LB-06 and LB-11 were the same mistake twice: text authored against the
 * shortest content in a catalogue, in a container nobody checked. Both are
 * fixed. These cases cover the sites that remain fixed-width — the hero dossier
 * and the perk description — so a longer hero blurb or a wordier perk cannot
 * quietly repeat it a third time.
 *
 * The model is a monospace approximation rather than Phaser's renderer, so this
 * cannot certify pixel-exact rendering; QA-04b's screenshot matrix is what does
 * that. What it catches is the case the defect actually arrives as — someone
 * writes a longer sentence — and it catches it in `verify` rather than in a
 * screenshot nobody happens to take.
 */

/** Consolas at the shell's sizes. 0.6em per glyph, 1.32em per line, no extra spacing. */
const measure: MeasureText = (content, fontSizePx, wrapWidth) => {
  const charWidth = fontSizePx * 0.6;
  const lineHeight = fontSizePx * 1.32;
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

/** Geometry read from `ShellScene.renderCharacterSelect`. */
const DOSSIER = { x: 470, top: 108, wrapWidth: 390, fontSizePx: 12 };
/** Mirrors the constants in ShellScene's fittedDossier. */
const DOSSIER_PADDING = 4;
// Derived from the perk layout, exactly as the scene does, so the test cannot
// drift from the thing it checks.
const PERK_LAYOUT = perkGridLayout(PERK_CATALOG.length);
const DOSSIER_HEADING_GAP = 8;
const DOSSIER_BOTTOM = PERK_LAYOUT.headingY - DOSSIER_HEADING_GAP;
const DOSSIER_SIZES = [12, 11, 10, 9];
/** The PERK heading is the first thing the dossier must not reach. */
const PERK_HEADING_Y = PERK_LAYOUT.headingY;
const PERK_DESCRIPTION = { top: PERK_LAYOUT.descriptionY, wrapWidth: 390, fontSizePx: 11 };
/** Where the perk rail begins; the description must stop above it. */
const PERK_GRID_TOP = PERK_LAYOUT.bounds.top;

/** Mirrors the dossier string ShellScene composes. */
function dossierText(heroId: keyof typeof HERO_CATALOG, unlocked: boolean): string {
  const definition = HERO_CATALOG[heroId];
  return [
    `ROLE  ${definition.role}`,
    "",
    `PASSIVE  ${definition.passive.name}`,
    definition.passive.description,
    "",
    `ULTIMATE  ${definition.ultimate.name}`,
    definition.ultimate.description,
    "",
    `STARTING WEAPON  ${definition.startingWeaponName}`,
    `PER LEVEL  ${definition.levelGrowthDescription}`,
    ...(!unlocked ? ["", definition.unlockText] : []),
  ].join("\n");
}

describe("character-select copy stays inside its panel", () => {
  const heroIds = Object.keys(HERO_CATALOG) as (keyof typeof HERO_CATALOG)[];

  it("covers every hero", () => {
    expect(heroIds.length).toBeGreaterThanOrEqual(5);
  });

  it("keeps every hero dossier clear of the PERK heading", () => {
    // The locked variant is the long one: it appends the unlock text, and a
    // locked hero is exactly who a new player is reading about.
    const overflowing: string[] = [];
    for (const heroId of heroIds) {
      for (const unlocked of [true, false]) {
        const content = dossierText(heroId, unlocked);
        // Through the same fitting rule the scene uses, not the raw 12px: what
        // has to be true is that the *rendered* block clears the heading.
        const fit = fitText({
          content,
          maxWidth: DOSSIER.wrapWidth + DOSSIER_PADDING * 2,
          maxHeight: DOSSIER_BOTTOM - DOSSIER.top + DOSSIER_PADDING * 2,
          sizesPx: DOSSIER_SIZES,
          padding: DOSSIER_PADDING,
        }, measure);
        const bottom = DOSSIER.top + fit.metrics.height;
        if (fit.overflowed || bottom > PERK_HEADING_Y) {
          overflowing.push(`${heroId}${unlocked ? "" : " (locked)"}: ends at ${Math.round(bottom)} at ${fit.fontSizePx}px, heading at ${PERK_HEADING_Y}`);
        }
      }
    }
    expect(overflowing, "hero dossiers running into the perk heading").toEqual([]);
  });

  it("keeps every perk description clear of the perk rail", () => {
    const overflowing: string[] = [];
    for (const perk of PERK_CATALOG) {
      for (const copy of [perk.description, perk.unlockText]) {
        const { height } = measure(copy, PERK_DESCRIPTION.fontSizePx, PERK_DESCRIPTION.wrapWidth);
        const bottom = PERK_DESCRIPTION.top + height;
        if (bottom > PERK_GRID_TOP) {
          overflowing.push(`${perk.id}: ends at ${Math.round(bottom)}, rail at ${PERK_GRID_TOP}`);
        }
      }
    }
    expect(overflowing, "perk copy running into the tile rail").toEqual([]);
  });

  it("actually rejects copy that would overflow — calibration, not decoration", () => {
    // A containment test is worthless until you have watched it go red.
    // Long enough that even the smallest offered size cannot save it. The first
    // version of this case was too short and passed, which is the whole reason
    // calibration cases exist.
    const absurd = Array.from({ length: 400 }, (_, i) => `WORD${i}`).join(" ");
    const fit = fitText({
      content: absurd,
      maxWidth: DOSSIER.wrapWidth + DOSSIER_PADDING * 2,
      maxHeight: DOSSIER_BOTTOM - DOSSIER.top + DOSSIER_PADDING * 2,
      sizesPx: DOSSIER_SIZES,
      padding: DOSSIER_PADDING,
    }, measure);
    expect(fit.overflowed).toBe(true);
  });
});
