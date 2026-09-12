import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * QA-04b — the screenshot matrix.
 *
 * Several presentation defects cannot be judged from source at all. LB-05 (the
 * menu title sitting outside its plate) and LB-06 (character-select perk tiles
 * overflowing their container) are both "does this text fit that box", and the
 * only honest answer is a picture at the resolutions players actually use.
 *
 * This captures them automatically so the human review is *looking*, not
 * *producing*. It deliberately does not assert anything about appearance:
 * a screenshot diff would encode today's defects as the expected result. The
 * output is evidence for a person; the review verdict stays theirs.
 *
 * Sizes match the display plan's targets: the 960x540 authoring space, exact 2x
 * and 4x, and the Steam Deck panel, which is the one that is not an integer
 * multiple and so exercises the fill path.
 */
const VIEWPORTS = [
  { name: "960x540", width: 960, height: 540 },
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "3840x2160", width: 3840, height: 2160 },
  { name: "1280x800-deck", width: 1280, height: 800 },
];

/**
 * Each entry is a screen a defect has been filed against, or one a reviewer has
 * to sign off before release. Routes are URL-addressable by design — every
 * screen here boots from a single URL, which is what makes this cheap.
 */
const SCREENS = [
  { id: "title", route: "/play/last-bastion/", note: "LB-05 menu title inside its plate" },
  { id: "map", route: "/play/last-bastion/?screen=map", note: "LB-07 map quality, LB-08 armed route" },
  { id: "combat", route: "/play/last-bastion/?screen=game", note: "LB-01 projectiles, HUD safe area" },
  // ?summarydemo=1 populates a representative summary. Without it the debrief
  // renders its empty state, which is worth capturing but is not the screen the
  // defects live on.
  { id: "debrief", route: "/play/last-bastion/?screen=summary&summarydemo=1", note: "QA-09 run identity, debrief focus" },
  { id: "debrief-empty", route: "/play/last-bastion/?screen=summary", note: "empty-state debrief" },
  { id: "event", route: "/play/last-bastion/?screen=event-lab", note: "event copy layout" },
  // LB-06's screen. Character select is shell state rather than a URL, so it is
  // reached the way a player reaches it: Enter from the title, then Enter again
  // from the main menu's first entry.
  {
    id: "character-select",
    route: "/play/last-bastion/",
    keys: ["Enter", "Enter"],
    note: "LB-06 perk tiles inside their container",
  },
  // The locked Tactician: the longest dossier in the catalogue, and the case the
  // §5.4 overflow audit caught running 51px past the PERK heading.
  {
    id: "character-select-tactician",
    route: "/play/last-bastion/",
    keys: ["Enter", "Enter", "ArrowRight", "ArrowRight", "ArrowRight"],
    note: "longest hero dossier, locked",
  },
];

const OUT_ROOT = join(
  "play", "last-bastion", "playtest-evidence",
  `${new Date().toISOString().slice(0, 10)}-screens-auto`,
);

test.describe("Last Bastion screenshot matrix", () => {
  test.describe.configure({ mode: "serial" });

  for (const viewport of VIEWPORTS) {
    for (const screen of SCREENS) {
      test(`${screen.id} at ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(screen.route);
        await page.waitForSelector("#game-root canvas", { state: "visible", timeout: 60_000 });
        for (const key of screen.keys ?? []) {
          // Each press changes shell state and redraws; a short settle between
          // them keeps the capture off a half-built screen.
          await page.waitForTimeout(700);
          await page.keyboard.press(key);
        }
        // Settle: wait for the asset queue to go quiet rather than a fixed sleep,
        // so a heavy route is not photographed mid-load and a light one is not
        // padded with dead time.
        await page.evaluate(async () => {
          let last = performance.getEntriesByType("resource").length;
          let stableFor = 0;
          while (stableFor < 1500) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            const now = performance.getEntriesByType("resource").length;
            stableFor = now === last ? stableFor + 250 : 0;
            last = now;
          }
        });
        mkdirSync(OUT_ROOT, { recursive: true });
        await page.screenshot({
          path: join(OUT_ROOT, `${screen.id}-${viewport.name}.png`),
          // Full page would capture the letterbox as page background; the canvas
          // box is what a player sees and what a defect lives in.
          clip: await page.locator("#game-root canvas").boundingBox() ?? undefined,
        });
      });
    }
  }
});
