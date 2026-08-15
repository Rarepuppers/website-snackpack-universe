// Mine a pool of guaranteed-winnable TriPeaks deals and bake it into the page.
//
// Same approach as scripts/mine-solitaire-seeds.js: verify offline, ship the
// seeds, deal instantly in the browser. See scripts/tripeaks-solver.js for why
// a pool rather than an on-device solve.
//
// A seed is kept only if it is solvable under BOTH rule settings -- standard
// (Ace joins 2 only) and round-the-corner (King and Ace are neighbours). The
// player can toggle that mid-deal, and a pool verified under only the more
// forgiving rule would quietly break the promise the moment they turned it off.
// Standard is the strictly harder constraint, so in practice this is a
// standard-solvable pool, but asserting both is what makes the claim safe.
//
// Usage:
//   node scripts/gen-tripeaks-seeds.mjs [target] [maxAttempts]
//
// Rewrites the `var VERIFIED = [...]` line in play/tripeaks/index.html.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { deal, isSolvable } = require("./tripeaks-solver.js");

const target = Number(process.argv[2] || 1200);
const maxAttempts = Number(process.argv[3] || 60000);
const pagePath = path.join("play", "tripeaks", "index.html");

const seeds = [];
let attempts = 0;
let rejectedStandard = 0;
const started = Date.now();

// Seeds are plain increasing integers rather than random draws, so a rerun with
// the same target reproduces the same pool -- a regenerated pool that shuffled
// every deal would be an unreviewable diff.
for (let seed = 1; seeds.length < target && attempts < maxAttempts; seed++) {
  attempts++;
  const board = deal(seed);
  if (!isSolvable(board, false)) { rejectedStandard++; continue; }
  if (!isSolvable(board, true)) continue; // belt and braces; should never reject
  seeds.push(seed);
  if (seeds.length % 100 === 0) {
    process.stdout.write(`  ${seeds.length}/${target} verified (${attempts} tried)\n`);
  }
}

const elapsed = ((Date.now() - started) / 1000).toFixed(1);
console.log(
  `\n${seeds.length} winnable seeds from ${attempts} deals ` +
  `(${((seeds.length / attempts) * 100).toFixed(1)}% winnable) in ${elapsed}s`
);
console.log(`  rejected as unwinnable under standard rules: ${rejectedStandard}`);

if (seeds.length < target) {
  console.error(`\nOnly found ${seeds.length} of ${target}. Raise maxAttempts and rerun.`);
}

if (!fs.existsSync(pagePath)) {
  console.error(`\n${pagePath} does not exist yet — pool not written.`);
  process.exit(1);
}

const page = fs.readFileSync(pagePath, "utf8");
const line = `  var VERIFIED = [${seeds.join(",")}];`;
const re = /^ {2}var VERIFIED = \[[^\]]*\];$/m;
if (!re.test(page)) {
  console.error(`\nCould not find the "var VERIFIED = [...]" line in ${pagePath}.`);
  process.exit(1);
}
fs.writeFileSync(pagePath, page.replace(re, line));
console.log(`\nWrote ${seeds.length} seeds into ${pagePath}.`);
