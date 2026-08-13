// FreeCell solvability check for the WEBSITE build.
// Verifies every deal in the pool the page actually ships. This script only
// CHECKS -- to find new deals, use gen-freecell-seeds.js.
//
// Usage (from the website repo root):
//   node scripts/verify-freecell-deals.js
// Exits non-zero if any shipped deal is proven unsolvable.

const fs = require('fs');
const path = require('path');
const { deal, solve } = require('./freecell-solver');

// Read the pool straight out of the page, so this can never drift from what
// ships. A hard-coded copy here was the previous failure mode.
const PAGE = path.join(__dirname, '..', 'play', 'freecell', 'index.html');
const html = fs.readFileSync(PAGE, 'utf8');
const m = html.match(/CHECKED\s*=\s*\[([^\]]*)\]/);
if (!m) {
  console.error('Could not find the CHECKED pool in', PAGE);
  process.exit(2);
}
const CHECKED = m[1].split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n));

const BUDGET = 250000;
const bad = [];
const unknown = [];
for (const seed of CHECKED) {
  const res = solve(deal(seed), BUDGET);
  if (res.ok) continue;
  (res.hitBudget ? unknown : bad).push(seed);
}

console.log('deals in shipped pool :', CHECKED.length);
console.log('solved                :', CHECKED.length - bad.length - unknown.length);
console.log('PROVEN UNSOLVABLE     :', bad.length ? bad.join(',') : 'none');
console.log('inconclusive          :', unknown.length ? unknown.join(',') : 'none');
process.exit(bad.length ? 1 : 0);
