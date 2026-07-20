// FreeCell solvability check for the WEBSITE build.
// Uses the exact rand()/deal() from play/freecell/index.html so results
// apply to the deals the page actually serves.

const RED = [false, true, true, false]; // spade, heart, diamond, club
const C = (s, r) => (s << 4) | r;
const S = c => c >> 4;
const R = c => c & 15;

function rand(seed) {
  let v = seed >>> 0;
  return function () {
    v = (v + 0x6d2b79f5) >>> 0;
    let t = v;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deal(seed) {
  const d = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push(C(s, r));
  const random = rand(seed);
  for (let i = d.length - 1; i; i--) {
    const j = Math.floor(random() * (i + 1));
    const t = d[i]; d[i] = d[j]; d[j] = t;
  }
  const cascades = [[], [], [], [], [], [], [], []];
  d.forEach((c, i) => cascades[i % 8].push(c));
  return cascades;
}

const canStack = (c, t) => t === undefined || (R(c) === R(t) - 1 && RED[S(c)] !== RED[S(t)]);

function encode(cas, free, found) {
  const cs = cas.map(p => p.join(',')).sort().join('|');
  const fs = free.filter(x => x !== null).sort((a, b) => a - b).join(',');
  return cs + '#' + fs + '#' + found.join(',');
}

function autoplay(cas, free, found) {
  let moved = true;
  while (moved) {
    moved = false;
    const safe = card => {
      const s = S(card), r = R(card);
      if (found[s] !== r - 1) return false;
      if (r <= 2) return true;
      for (let o = 0; o < 4; o++) if (RED[o] !== RED[s] && found[o] < r - 1) return false;
      return true;
    };
    for (let i = 0; i < 8; i++) {
      const p = cas[i], top = p[p.length - 1];
      if (top !== undefined && safe(top)) { found[S(top)] = R(top); p.pop(); moved = true; }
    }
    for (let i = 0; i < 4; i++) {
      const c = free[i];
      if (c !== null && safe(c)) { found[S(c)] = R(c); free[i] = null; moved = true; }
    }
  }
}

class Heap {
  constructor() { this.a = []; }
  push(n) {
    const a = this.a; a.push(n);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
      const t = a[p]; a[p] = a[i]; a[i] = t; i = p;
    }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        const t = a[m]; a[m] = a[i]; a[i] = t; i = m;
      }
    }
    return top;
  }
}

// Lower is better: mostly "how many cards still off the foundations",
// plus how deeply the next card each foundation needs is buried.
function heuristic(cas, free, found) {
  let h = (52 - (found[0] + found[1] + found[2] + found[3])) * 3;
  for (let s = 0; s < 4; s++) {
    const need = found[s] + 1;
    if (need > 13) continue;
    for (let i = 0; i < 8; i++) {
      const p = cas[i];
      for (let k = 0; k < p.length; k++) {
        if (S(p[k]) === s && R(p[k]) === need) { h += (p.length - 1 - k); break; }
      }
    }
  }
  h += free.filter(x => x !== null).length * 2;
  return h;
}

function solve(cascades, nodeBudget) {
  const cas0 = cascades.map(p => p.slice());
  const free0 = [null, null, null, null];
  const found0 = [0, 0, 0, 0];
  autoplay(cas0, free0, found0);

  const visited = new Set();
  let nodes = 0;
  let hitBudget = false;

  function won(found) { return found[0] + found[1] + found[2] + found[3] === 52; }

  const heap = new Heap();
  heap.push({ cas: cas0, free: free0, found: found0, g: 0, f: heuristic(cas0, free0, found0) });

  while (heap.a.length) {
    const cur = heap.pop();
    const cas = cur.cas, free = cur.free, found = cur.found;
    if (won(found)) return { ok: true, nodes, hitBudget: false };
    if (nodes++ > nodeBudget) { hitBudget = true; break; }
    const key = encode(cas, free, found);
    if (visited.has(key)) continue;
    visited.add(key);

    const freeCount = free.filter(x => x === null).length;
    const emptyCols = cas.reduce((a, p) => a + (p.length === 0 ? 1 : 0), 0);
    const moves = [];

    // explicit foundation moves
    for (let i = 0; i < 8; i++) {
      const p = cas[i], top = p[p.length - 1];
      if (top !== undefined && found[S(top)] === R(top) - 1) moves.push({ k: 'cf', i, score: 100 });
    }
    for (let i = 0; i < 4; i++) {
      const c = free[i];
      if (c !== null && found[S(c)] === R(c) - 1) moves.push({ k: 'ff', i, score: 100 });
    }
    // cascade run -> cascade
    for (let i = 0; i < 8; i++) {
      const p = cas[i];
      if (!p.length) continue;
      let runLen = 1;
      while (runLen < p.length) {
        const a = p[p.length - 1 - runLen], b = p[p.length - runLen];
        if (R(a) === R(b) + 1 && RED[S(a)] !== RED[S(b)]) runLen++; else break;
      }
      for (let k = 1; k <= runLen; k++) {
        const head = p[p.length - k];
        for (let j = 0; j < 8; j++) {
          if (j === i) continue;
          const dest = cas[j], destTop = dest[dest.length - 1];
          if (!canStack(head, destTop)) continue;
          const emptyForCap = emptyCols - (dest.length === 0 ? 1 : 0);
          if (k > (freeCount + 1) * Math.pow(2, emptyForCap)) continue;
          // don't shuffle a whole column into an empty one for nothing
          if (dest.length === 0 && k === p.length) continue;
          moves.push({ k: 'cc', i, j, n: k, score: 50 + (k === p.length ? 10 : 0) });
        }
      }
    }
    // free -> cascade
    for (let i = 0; i < 4; i++) {
      const c = free[i];
      if (c === null) continue;
      for (let j = 0; j < 8; j++) {
        const dest = cas[j];
        if (canStack(c, dest[dest.length - 1])) moves.push({ k: 'fc', i, j, score: 40 });
      }
    }
    // cascade -> free
    if (freeCount > 0) {
      const fi = free.indexOf(null);
      for (let i = 0; i < 8; i++) {
        if (cas[i].length) moves.push({ k: 'cfree', i, fi, score: 10 });
      }
    }

    moves.sort((a, b) => b.score - a.score);

    for (const m of moves) {
      const nc = cas.map(p => p.slice());
      const nf = free.slice();
      const nfd = found.slice();
      if (m.k === 'cf') { const c = nc[m.i].pop(); nfd[S(c)] = R(c); }
      else if (m.k === 'ff') { const c = nf[m.i]; nf[m.i] = null; nfd[S(c)] = R(c); }
      else if (m.k === 'cc') { const mv = nc[m.i].splice(nc[m.i].length - m.n, m.n); nc[m.j].push(...mv); }
      else if (m.k === 'fc') { nc[m.j].push(nf[m.i]); nf[m.i] = null; }
      else if (m.k === 'cfree') { nf[m.fi] = nc[m.i].pop(); }
      autoplay(nc, nf, nfd);
      const g = cur.g + 1;
      heap.push({ cas: nc, free: nf, found: nfd, g, f: g * 0.3 + heuristic(nc, nf, nfd) });
    }
  }
  return { ok: false, nodes, hitBudget: hitBudget || heap.a.length > 0 };
}

const CHECKED = [1,2,3,4,5,7,8,9,10,11,12,13,14,16,17,21,23,24,25,26,28,30,31,32,33,35,36,37,38,39,41,42,43,45,46,48,49,50,51,52,53,54,55,56,57,59,60,61,63,64,69,70,71,74,75,76,78,81,82,83,84,86,87,89,90,91,92,94,96,97,98,99,100];

const BUDGET = 250000;
let bad = [], unknown = [];
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
