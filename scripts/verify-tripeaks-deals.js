/**
 * Re-verify every seed baked into play/tripeaks/index.html.
 *
 * The page promises "every deal is winnable". That promise is only as good as
 * the pool, and the pool is a bare list of integers that means nothing on its
 * own — a bad merge, a hand edit, or a change to deal() in either file would
 * break it silently and the page would keep making the claim.
 *
 * The solver also has to be solving the game the page really plays, so this runs
 * the page's own deal(), COVERS and draw against the solver's before it trusts
 * the pool. A page that drew from the wrong end of the stock once dealt 220 of
 * 1,200 "verified" boards that could not be cleared.
 *
 * Exits non-zero if any seed fails, so it can gate a release.
 *
 * Usage:
 *   node scripts/verify-tripeaks-deals.js
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { COVERS, deal, isSolvable } = require("./tripeaks-solver.js");

const pagePath = path.join("play", "tripeaks", "index.html");
const page = fs.readFileSync(pagePath, "utf8");

const match = page.match(/var VERIFIED = \[([^\]]*)\];/);
if (!match) {
  console.error(`Could not find the VERIFIED pool in ${pagePath}.`);
  process.exit(1);
}

const seeds = match[1].split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n));
if (!seeds.length) {
  console.error("The VERIFIED pool is empty.");
  process.exit(1);
}

// Cuts one function out of the page by matching braces, so the real code runs.
function pageFunction(name) {
  const start = page.indexOf(`function ${name}(`);
  if (start < 0) {
    console.error(`Could not find ${name}() in ${pagePath}.`);
    process.exit(1);
  }
  let depth = 0;
  for (let i = page.indexOf("{", start); i < page.length; i++) {
    if (page[i] === "{") depth++;
    if (page[i] === "}" && --depth === 0) return page.slice(start, i + 1);
  }
  console.error(`Unbalanced braces in ${name}() in ${pagePath}.`);
  process.exit(1);
}

function checkPageMatchesSolver() {
  const pageDeal = new Function(`${pageFunction("mulberry32")}\n${pageFunction("deal")}\nreturn deal;`)();
  const layout = page.match(/var COVERS = \[\];[\s\S]*?COVERS\[18 \+ b\] = \[\];/);
  const pageCovers = layout ? new Function(`${layout[0]}\nreturn COVERS;`)() : null;
  if (JSON.stringify(pageCovers) !== JSON.stringify(COVERS)) {
    return "the page's COVERS layout differs from the solver's";
  }

  // draw() run for real, with the page's globals stubbed, so that any way of
  // taking the wrong card fails here and not only one spelling of it.
  const drawNext = (stock) => {
    const state = { phase: "playing", stock: stock.slice(), waste: [], streak: 0, moves: 0 };
    new Function("state", "snapshot", "isStuck", "render", "hintIdx", "window", `${pageFunction("draw")}\ndraw();`)(
      state, () => {}, () => false, () => {}, null, {}
    );
    return state.waste[state.waste.length - 1];
  };

  for (const seed of seeds) {
    const expected = deal(seed);
    const actual = pageDeal(seed);
    const waste = Array.isArray(actual.waste) ? actual.waste[0] : actual.waste;
    if (JSON.stringify(actual.tableau) !== JSON.stringify(expected.tableau)
      || JSON.stringify(waste) !== JSON.stringify(expected.waste)
      || JSON.stringify(actual.stock) !== JSON.stringify(expected.stock)) {
      return `the page's deal() differs from the solver's at seed ${seed}`;
    }
    if (drawNext(actual.stock) !== actual.stock[0]) {
      return "the page's draw() does not take the next stock card the solver plays";
    }
  }
  return null;
}

const mismatch = checkPageMatchesSolver();
if (mismatch) {
  console.error(`\nThe pool can't be trusted: ${mismatch}.`);
  process.exit(1);
}

const failures = [];
const started = Date.now();

seeds.forEach((seed, i) => {
  const board = deal(seed);
  // Both settings, for the reason the miner asserts both: the player can toggle
  // round-the-corner mid-deal, and a board only winnable under one of them
  // would break the promise the moment they switched.
  if (!isSolvable(board, false)) failures.push(`${seed} (standard)`);
  else if (!isSolvable(board, true)) failures.push(`${seed} (round the corner)`);
  if ((i + 1) % 200 === 0) process.stdout.write(`  checked ${i + 1}/${seeds.length}\n`);
});

const elapsed = ((Date.now() - started) / 1000).toFixed(1);

if (failures.length) {
  console.error(`\n${failures.length} of ${seeds.length} seeds are NOT winnable:\n`);
  for (const f of failures.slice(0, 25)) console.error(`  ${f}`);
  if (failures.length > 25) console.error(`  ...and ${failures.length - 25} more`);
  console.error("\nRegenerate: node scripts/gen-tripeaks-seeds.mjs");
  process.exit(1);
}

console.log(`\nAll ${seeds.length} TriPeaks deals verified winnable in ${elapsed}s.`);
