// Grows the FreeCell deal pool for the WEBSITE build.
//
// Scans a range of seeds through the same solver the verifier uses and keeps
// only the deals proven winnable at four free cells, then (with --write)
// replaces the CHECKED array in play/freecell/index.html.
//
// The page indexes this pool by date for the daily deal, so a bigger pool means
// the daily cycle repeats less often. 73 deals cycles in under three months.
//
// Usage (from the website repo root):
//   node scripts/gen-freecell-seeds.js --max=3000            # scan, report only
//   node scripts/gen-freecell-seeds.js --max=3000 --write     # scan and update
//   node scripts/gen-freecell-seeds.js --max=3000 --budget=400000 --write
//
// Slow by design: solving is the whole point. ~1-2s/deal at the default budget.

const fs = require('fs');
const path = require('path');
const { deal, solve } = require('./freecell-solver');

const args = process.argv.slice(2);
const argVal = (name, dflt) => {
  const hit = args.find(a => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split('=')[1]) : dflt;
};
const MAX = argVal('max', 1000);
const BUDGET = argVal('budget', 250000);
const MIN = argVal('min', 1);
const WRITE = args.includes('--write');

const PAGE = path.join(__dirname, '..', 'play', 'freecell', 'index.html');

console.log(`scanning seeds ${MIN}..${MAX} (budget ${BUDGET.toLocaleString()} nodes/deal)`);
const good = [];
let unsolvable = 0;
let inconclusive = 0;
const started = Date.now();

for (let seed = MIN; seed <= MAX; seed++) {
  const res = solve(deal(seed), BUDGET);
  if (res.ok) good.push(seed);
  else if (res.hitBudget) inconclusive++;
  else unsolvable++;

  if (seed % 100 === 0 || seed === MAX) {
    const secs = ((Date.now() - started) / 1000).toFixed(0);
    console.log(`  ...${seed}/${MAX}  kept ${good.length}  rejected ${unsolvable}  inconclusive ${inconclusive}  (${secs}s)`);
  }
}

console.log('');
console.log('scanned      :', MAX - MIN + 1);
console.log('WINNABLE     :', good.length);
console.log('unsolvable   :', unsolvable);
console.log('inconclusive :', inconclusive, '(budget hit -- excluded, not proven bad)');

if (!WRITE) {
  console.log('\nDry run. Re-run with --write to update play/freecell/index.html.');
  process.exit(0);
}

const html = fs.readFileSync(PAGE, 'utf8');
// The page declares it as `var CHECKED=[...]` -- accept any declaration form
// so this keeps working if the page is ever tidied up.
const POOL_RE = /((?:var|let|const)\s+CHECKED\s*=\s*\[)([^\]]*)(\])/;
const m = html.match(POOL_RE);
if (!m) {
  console.error('Could not find the CHECKED array in', PAGE);
  process.exit(2);
}
const before = m[2].split(',').filter(s => s.trim()).length;
const updated = html.replace(POOL_RE, `$1${good.join(',')}$3`);
fs.writeFileSync(PAGE, updated);
console.log(`\nplay/freecell/index.html updated: ${before} -> ${good.length} deals.`);
console.log('Now run: node scripts/verify-freecell-deals.js');
