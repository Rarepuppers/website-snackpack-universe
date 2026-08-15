/**
 * Re-verify every seed baked into play/tripeaks/index.html.
 *
 * The page promises "every deal is winnable". That promise is only as good as
 * the pool, and the pool is a bare list of integers that means nothing on its
 * own — a bad merge, a hand edit, or a change to deal() in either file would
 * break it silently and the page would keep making the claim.
 *
 * Exits non-zero if any seed fails, so it can gate a release.
 *
 * Usage:
 *   node scripts/verify-tripeaks-deals.js
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { deal, isSolvable } = require("./tripeaks-solver.js");

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
