#!/usr/bin/env node
// Regenerates the VERIFIED_SEEDS pool in play/solitaire/index.html.
//
// Why this exists: Klondike solvability can't be decided in interactive
// time, so the page used to run a bounded on-device search that timed out
// on ~86% of deals (100% of Draw 3 deals) and then dealt an unverified —
// sometimes unwinnable — shuffle anyway. This mines solvable seeds offline
// instead, so the page can deal instantly from a known-good pool.
//
// Each kept seed is solved under BOTH Draw 1 and Draw 3, so a single pool is
// valid whichever mode the player picks.
//
// The solver is deliberately incomplete but sound: it omits foundation->tableau
// moves, so it can MISS winnable deals, but anything it accepts really is
// winnable. False negatives are just discarded during mining.
//
//   node scripts/mine-solitaire-seeds.js [target] [budget]
//
// Writes the seed list straight into the page, replacing the existing
// `var VERIFIED_SEEDS = [...];` line.

const fs = require('fs');
const path = require('path');
const { makeDeck, dealFromDeck, solve } = require('./klondike-solver.js');

const TARGET = Number(process.argv[2] || 1000);
const BUDGET = Number(process.argv[3] || 120000);
const RECYCLES = 8;
const PAGE = path.join(__dirname, '..', 'play', 'solitaire', 'index.html');

const good = [];
let seed = 0, scanned = 0;
const t0 = Date.now();

while (good.length < TARGET && seed < 500000) {
  seed++; scanned++;
  // Draw 3 is the harder constraint — test it first and skip Draw 1 if it fails.
  if (!solve(dealFromDeck(makeDeck(seed)), 3, BUDGET, RECYCLES).ok) continue;
  if (!solve(dealFromDeck(makeDeck(seed)), 1, BUDGET, RECYCLES).ok) continue;
  good.push(seed);
  if (good.length % 100 === 0) {
    process.stdout.write(`${good.length}/${TARGET} kept (scanned ${scanned}, ${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }
}

let src = fs.readFileSync(PAGE, 'utf8');
const line = /var VERIFIED_SEEDS = \[[^\]]*\];/;
if (!line.test(src)) throw new Error('VERIFIED_SEEDS declaration not found in ' + PAGE);
src = src.replace(line, 'var VERIFIED_SEEDS = [' + good.join(',') + '];');
fs.writeFileSync(PAGE, src);

console.log(`\nwrote ${good.length} verified seeds to ${path.relative(process.cwd(), PAGE)}`);
console.log(`scanned ${scanned} seeds, hit rate ${(good.length / scanned * 100).toFixed(1)}%`);
