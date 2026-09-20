import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileEol, replaceMarkerBlock, withEol } from "./lib/marker-block.mjs";

/*
 * Publishes the Pinball scoring table into the game's "How to play" section,
 * read from `play/pinball/rules.js` rather than typed by hand.
 *
 * Every value here is a claim about the build. Hand-typed numbers drift from
 * the code they describe -- that has shipped in this portfolio more than once
 * -- so the page is generated from the same POINTS object the game scores
 * with, and `--check` fails if the published table no longer matches it.
 *
 * Run:   node scripts/build-pinball-scoring.mjs
 * Guard: node scripts/build-pinball-scoring.mjs --check
 */

const root = path.resolve(".");
const PAGE = path.join(root, "play", "pinball", "index.html");
const RULES = path.join(root, "play", "pinball", "rules.js");
const MARKER_OPEN = "<!-- pinball-scoring:generated -->";
const MARKER_CLOSE = "<!-- /pinball-scoring:generated -->";

/*
 * Which values reach the player, in the order they are worth learning, and what
 * to call them in plain language. This is deliberately a subset: the wizard-mode
 * values are a reward for getting there and listing them spoils it, and
 * `jackpotStep`/`skillShotMax` are modifiers rather than shots.
 *
 * The keys are checked against POINTS below, so renaming one in rules.js fails
 * the build instead of quietly dropping a row.
 */
const ROWS = [
  ["sling", "Slingshot", "Bounces off the kickers above the flippers."],
  ["bumper", "Bumper", "The three portholes at the top of the table."],
  ["spinner", "Spinner", "Per revolution, so speed through it is what pays."],
  ["spinnerLit", "Spinner (lit)", "Same shot, lit by the drop-target bank."],
  ["target", "Drop target", "Each target in the left-hand bank."],
  ["rollover", "Rollover lane", "The three lanes across the top arch."],
  ["orbit", "Left orbit", "The right flipper's shot."],
  ["kickback", "Kickback save", "Returns a ball from the left outlane."],
  ["ramp", "Right ramp", "The left flipper's shot."],
  ["saucer", "Saucer", "Starts a mission when lit."],
  ["bankClear", "Drop bank cleared", "All three targets down."],
  ["skillShot", "Skill shot", "The lit lane on the opening plunge."],
  ["jackpot", "Jackpot", "During multiball. Each one raises the next."],
  ["rankUp", "Rank up", "Awarded on every promotion."],
  ["superJackpot", "Super jackpot", "The multiball payoff shot."],
];

function formatPoints(n) {
  return n.toLocaleString("en-GB");
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildBlock(points) {
  const missing = ROWS.map(([key]) => key).filter((key) => !(key in points));
  if (missing.length) {
    throw new Error(
      `rules.js POINTS is missing: ${missing.join(", ")}. ` +
        "Update ROWS in scripts/build-pinball-scoring.mjs to match the ruleset."
    );
  }

  const rows = ROWS.map(([key, label, note]) =>
    "          <tr>\n" +
      `            <td>${escapeHtml(label)}</td>\n` +
      `            <td class="pb-score-value">${formatPoints(points[key])}</td>\n` +
      `            <td>${escapeHtml(note)}</td>\n` +
      "          </tr>"
  ).join("\n");

  return [
    MARKER_OPEN,
    "      <h3>What everything scores</h3>",
    "      <p>Generated from the game's own ruleset, so these are the numbers the",
    "         table actually awards. A ramp is worth thirty bumpers, which is the",
    "         whole reason to aim rather than flail.</p>",
    '      <div class="pb-score-table-wrap">',
    '        <table class="pb-score-table">',
    "          <thead>",
    "            <tr><th scope=\"col\">Shot</th><th scope=\"col\">Points</th><th scope=\"col\">Notes</th></tr>",
    "          </thead>",
    "          <tbody>",
    rows,
    "          </tbody>",
    "        </table>",
    "      </div>",
    "      <p>Consecutive lit shots build a combo multiplier, and missions and the",
    "         wizard mode pay far more than anything listed here — those are left",
    "         for you to find.</p>",
    MARKER_CLOSE,
  ].join("\n");
}

async function main() {
  const check = process.argv.includes("--check");
  const { POINTS } = await import(pathToFileURL(RULES).href);
  const block = buildBlock(POINTS);

  const html = await fs.readFile(PAGE, "utf8");
  const eol = fileEol(html);

  let next = replaceMarkerBlock(html, MARKER_OPEN, MARKER_CLOSE, block);
  if (next === null) {
    // First run: anchor immediately before the "Modes" heading, so scoring
    // reads after the shots are explained and before the mode list.
    const anchor = "      <h3>Modes</h3>";
    if (!html.includes(anchor)) {
      throw new Error(`Cannot find the anchor ${JSON.stringify(anchor)} in ${PAGE}`);
    }
    next = html.replace(anchor, withEol(block, eol) + eol + eol + anchor);
  }

  if (next === html) {
    console.log("Pinball scoring table is current.");
    return;
  }

  if (check) {
    console.error(
      "Pinball scoring table is stale: the published values no longer match " +
        "POINTS in play/pinball/rules.js.\n" +
        "Run: node scripts/build-pinball-scoring.mjs"
    );
    process.exit(1);
  }

  await fs.writeFile(PAGE, next, "utf8");
  console.log(`Pinball scoring table written (${ROWS.length} rows).`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
