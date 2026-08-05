/*
 * Rule tests for Spider Solitaire.
 *
 * These pull the real function source straight out of index.html rather than
 * copying it, so the tests fail if the shipped logic changes underneath them.
 * The functions under test are pure (they only touch `cols` / `completed`),
 * so they run fine without a DOM.
 *
 * Run: node play/spider-solitaire/rules.test.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(here, "index.html"), "utf8");

function extract(name) {
  // Grab `function name(...) { ... }` by brace-matching from the header.
  const start = html.indexOf("function " + name + "(");
  if (start === -1) throw new Error("could not find function " + name);
  let depth = 0, i = html.indexOf("{", start);
  for (; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error("unbalanced braces in " + name);
}

const src = ["runLength", "canDrop", "harvest", "buildDeck"].map(extract).join("\n");

// Scaffold the few globals the extracted functions close over. COLS is read
// from the page too, so the board width can't drift out of sync with the test.
const COLS = Number(html.match(/var COLS\s*=\s*(\d+)/)[1]);

const sandbox = new Function(
  "COLS",
  `let cols = [], completed = [], suitCount = 1;
   ${src}
   return { runLength, canDrop, harvest, buildDeck,
            bind: (c, d, s) => { cols = c; completed = d; suitCount = s; },
            cols: () => cols, completed: () => completed };`
)(COLS);

// Pads a partial fixture out to a full board so harvest() can scan every column.
function board(...columns) {
  const b = columns.map((c) => c || []);
  while (b.length < COLS) b.push([]);
  return b;
}

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log("  ok   " + label); }
  else { fail++; console.log(`  FAIL ${label}\n         expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}

const C = (r, s, up = true) => ({ r, s, up });

console.log("\nrunLength — a group only lifts if same-suit and descending");
sandbox.bind(board([C(9, 0), C(8, 0), C(7, 0)]), [], 1);
check("full same-suit run from index 0", sandbox.runLength(0, 0), 3);
check("partial run from index 1", sandbox.runLength(0, 1), 2);
check("single top card", sandbox.runLength(0, 2), 1);

sandbox.bind(board([C(9, 0), C(8, 1), C(7, 0)]), [], 4);
check("mixed suits blocks the group", sandbox.runLength(0, 0), 0);
check("top card still lifts alone", sandbox.runLength(0, 2), 1);

sandbox.bind(board([C(9, 0), C(7, 0)]), [], 1);
check("rank gap blocks the group", sandbox.runLength(0, 0), 0);

sandbox.bind(board([C(9, 0, false), C(8, 0)]), [], 1);
check("face-down card cannot be lifted", sandbox.runLength(0, 0), 0);
check("face-up card above it can", sandbox.runLength(0, 1), 1);

console.log("\ncanDrop — any suit, exactly one rank higher");
sandbox.bind(board([C(10, 0)], [], [C(5, 0)]), [], 4);
check("9 onto 10, same suit", sandbox.canDrop(C(9, 0), 0), true);
check("9 onto 10, different suit", sandbox.canDrop(C(9, 2), 0), true);
check("8 onto 10 rejected", sandbox.canDrop(C(8, 0), 0), false);
check("10 onto 10 rejected", sandbox.canDrop(C(10, 0), 0), false);
check("empty column takes anything", sandbox.canDrop(C(7, 3), 1), true);
check("King onto empty column", sandbox.canDrop(C(13, 0), 1), true);

console.log("\nharvest — a full K-to-A run lifts off the board");
const fullRun = [];
for (let r = 13; r >= 1; r--) fullRun.push(C(r, 0));
sandbox.bind(board(fullRun.slice()), [], 1);
check("harvest reports a completed run", sandbox.harvest(), true);
check("column is emptied", sandbox.cols()[0].length, 0);
check("one run recorded", sandbox.completed().length, 1);
check("run recorded with its suit", sandbox.completed()[0], 0);

// A buried card underneath must be turned face up when the run lifts.
sandbox.bind(board([C(4, 2, false)].concat(fullRun.slice())), [], 1);
sandbox.harvest();
check("card under a harvested run is flipped up", sandbox.cols()[0][0].up, true);
check("that card remains", sandbox.cols()[0].length, 1);

// 13 descending cards of mixed suits must NOT harvest.
const mixed = [];
for (let r = 13; r >= 1; r--) mixed.push(C(r, r % 2));
sandbox.bind(board(mixed), [], 4);
check("mixed-suit K-to-A does not harvest", sandbox.harvest(), false);
check("nothing recorded", sandbox.completed().length, 0);

// A run that is complete but not King-headed must not harvest.
const notKing = [];
for (let r = 12; r >= 1; r--) notKing.push(C(r, 0));
sandbox.bind(board(notKing), [], 1);
check("Queen-to-Ace does not harvest", sandbox.harvest(), false);

console.log("\nbuildDeck — always 104 cards, suit count respected");
for (const n of [1, 2, 4]) {
  sandbox.bind(board(), [], n);
  const deck = sandbox.buildDeck();
  const suits = new Set(deck.map((c) => c.s));
  check(`${n}-suit deck has 104 cards`, deck.length, 104);
  check(`${n}-suit deck uses ${n} suit(s)`, suits.size, n);
  const ranks = {};
  deck.forEach((c) => (ranks[c.r] = (ranks[c.r] || 0) + 1));
  check(`${n}-suit deck has 8 of each rank`,
    Object.keys(ranks).length === 13 && Object.values(ranks).every((v) => v === 8), true);
  check(`${n}-suit deck starts face down`, deck.every((c) => c.up === false), true);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
