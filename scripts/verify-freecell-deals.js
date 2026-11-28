// FreeCell solvability check for the WEBSITE build.
// Verifies every deal in the pool the page actually ships. This script only
// CHECKS -- to find new deals, use gen-freecell-seeds.js.
//
// Usage (from the website repo root):
//   node scripts/verify-freecell-deals.js
// Use --reduced-only when the four-cell pool is unchanged.

const fs = require('fs');
const path = require('path');
const { deal, solve } = require('./freecell-solver');

// Read the pool straight out of the page, so this can never drift from what
// ships. A hard-coded copy here was the previous failure mode.
const PAGE = path.join(__dirname, '..', 'play', 'freecell', 'index.html');
const html = fs.readFileSync(PAGE, 'utf8');
function readPool(name) {
  const match = html.match(new RegExp(`\\b${name}\\s*=\\s*(\\[[^\\]]*\\])`));
  if (!match) throw new Error(`Missing ${name} in ${PAGE}`);
  const seeds = JSON.parse(match[1]);
  if (!seeds.length || seeds.some((seed, i) => !Number.isSafeInteger(seed) || seed < 1 || (i && seed <= seeds[i - 1]))) {
    throw new Error(`${name} must contain sorted, unique, positive deal numbers`);
  }
  return seeds;
}

const four = readPool('CHECKED');
const two = readPool('CHECKED_TWO');
const one = readPool('CHECKED_ONE');
if (!one.every(seed => two.includes(seed)) || !two.every(seed => four.includes(seed))) {
  throw new Error('Reduced FreeCell pools must be nested subsets of the original pool.');
}

function verify(seeds, cells, budget) {
  const failed = seeds.filter(seed => !solve(deal(seed), budget, cells).ok);
  console.log(`${cells}-cell proofs: ${seeds.length - failed.length}/${seeds.length} solved`);
  if (failed.length) {
    console.error('No solution found within the check budget:', failed.join(', '));
    process.exitCode = 1;
  }
}

verify(one, 1, 12000);
verify(two.filter(seed => !one.includes(seed)), 2, 12000);
if (!process.argv.includes('--reduced-only')) verify(four, 4, 250000);
