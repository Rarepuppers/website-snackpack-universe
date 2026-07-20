// Klondike solver + seed miner for play/solitaire/index.html.
//
// makeDeck/dealFromDeck below are byte-for-byte the page's own logic, so a
// seed verified here produces the identical deal in the browser.
//
// The search deliberately omits foundation->tableau moves. That makes it
// INCOMPLETE (it can miss some winnable deals) but never UNSOUND: anything
// it reports solvable genuinely is. False negatives just get discarded
// during mining, which is exactly what we want.

const isRed = s => s === 1 || s === 2;

function makeDeck(seed) {
  const d = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push({ r, s, up: false });
  let value = (seed >>> 0) || 1;
  function random() {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  }
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const t = d[i]; d[i] = d[j]; d[j] = t;
  }
  return d;
}

function dealFromDeck(d) {
  const dd = d.slice();
  const t = [[], [], [], [], [], [], []];
  for (let col = 0; col < 7; col++) {
    for (let k = 0; k <= col; k++) {
      const card = dd.pop();
      t[col].push({ r: card.r, s: card.s, up: k === col });
    }
  }
  const st = dd.map(c => ({ r: c.r, s: c.s, up: false }));
  return { tableau: t, stock: st };
}

// ── search ───────────────────────────────────────────
class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
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

const clone = st => ({
  tab: st.tab.map(p => p.map(c => ({ r: c.r, s: c.s, up: c.up }))),
  stock: st.stock.map(c => ({ r: c.r, s: c.s })),
  waste: st.waste.map(c => ({ r: c.r, s: c.s })),
  found: st.found.slice(),
  rec: st.rec,
});

const total = st => st.found[0] + st.found[1] + st.found[2] + st.found[3];
const won = st => total(st) === 52;

// Sending a card up is "safe" only when nothing left in play could still
// need it as a stacking target.
function autoSafe(st) {
  let moved = true;
  while (moved) {
    moved = false;
    const safe = c => {
      if (st.found[c.s] !== c.r - 1) return false;
      if (c.r <= 2) return true;
      for (let o = 0; o < 4; o++) if (isRed(o) !== isRed(c.s) && st.found[o] < c.r - 1) return false;
      return true;
    };
    for (let i = 0; i < 7; i++) {
      const p = st.tab[i], t = p[p.length - 1];
      if (t && t.up && safe(t)) {
        st.found[t.s] = t.r; p.pop();
        if (p.length && !p[p.length - 1].up) p[p.length - 1].up = true;
        moved = true;
      }
    }
    const w = st.waste[st.waste.length - 1];
    if (w && safe(w)) { st.found[w.s] = w.r; st.waste.pop(); moved = true; }
  }
}

function encode(st) {
  let k = '';
  for (const p of st.tab) {
    for (const c of p) k += (c.up ? '+' : '-') + c.s + c.r + ',';
    k += '|';
  }
  k += '#';
  for (const c of st.stock) k += c.s + '' + c.r + ',';
  k += '#';
  for (const c of st.waste) k += c.s + '' + c.r + ',';
  return k + '#' + st.found.join('.');
}

function heuristic(st) {
  let h = (52 - total(st)) * 2;
  for (const p of st.tab) for (const c of p) if (!c.up) h += 2; // face-down = unknown/blocked
  h += st.stock.length * 0.1 + st.waste.length * 0.1;
  return h;
}

const canToFound = (c, st) => st.found[c.s] === c.r - 1;
function canStackTab(card, pile) {
  if (!pile.length) return card.r === 13;
  const t = pile[pile.length - 1];
  return t.up && t.r === card.r + 1 && isRed(t.s) !== isRed(card.s);
}

function solve(dealt, drawN, nodeBudget, maxRecycles) {
  const root = {
    tab: dealt.tableau.map(p => p.map(c => ({ r: c.r, s: c.s, up: c.up }))),
    stock: dealt.stock.map(c => ({ r: c.r, s: c.s })),
    waste: [],
    found: [0, 0, 0, 0],
    rec: 0,
  };
  autoSafe(root);
  if (won(root)) return { ok: true, nodes: 0 };

  const seen = new Set();
  const heap = new Heap();
  heap.push({ st: root, g: 0, f: heuristic(root), parent: null });
  let nodes = 0;

  const chainOf = node => { const out = []; for (let n = node; n; n = n.parent) out.push(n.st); return out.reverse(); };

  while (heap.size) {
    const cur = heap.pop();
    const st = cur.st;
    if (won(st)) return { ok: true, nodes, chain: chainOf(cur) };
    if (++nodes > nodeBudget) return { ok: false, nodes, budget: true };
    const key = encode(st);
    if (seen.has(key)) continue;
    seen.add(key);

    const next = [];
    const add = s => { autoSafe(s); next.push(s); };

    // waste top -> foundation / tableau
    const w = st.waste[st.waste.length - 1];
    if (w) {
      if (canToFound(w, st)) { const s = clone(st); const c = s.waste.pop(); s.found[c.s] = c.r; add(s); }
      for (let j = 0; j < 7; j++) {
        if (canStackTab(w, st.tab[j])) { const s = clone(st); const c = s.waste.pop(); c.up = true; s.tab[j].push(c); add(s); }
      }
    }
    // tableau top -> foundation
    for (let i = 0; i < 7; i++) {
      const p = st.tab[i], t = p[p.length - 1];
      if (t && t.up && canToFound(t, st)) {
        const s = clone(st); const c = s.tab[i].pop(); s.found[c.s] = c.r;
        const np = s.tab[i]; if (np.length && !np[np.length - 1].up) np[np.length - 1].up = true;
        add(s);
      }
    }
    // tableau run -> tableau
    for (let i = 0; i < 7; i++) {
      const p = st.tab[i];
      let firstUp = p.findIndex(c => c.up);
      if (firstUp < 0) continue;
      for (let ci = firstUp; ci < p.length; ci++) {
        // run from ci must be a valid alternating descending sequence
        let ok = true;
        for (let k = ci; k < p.length - 1; k++) {
          if (!(p[k].r === p[k + 1].r + 1 && isRed(p[k].s) !== isRed(p[k + 1].s))) { ok = false; break; }
        }
        if (!ok) continue;
        for (let j = 0; j < 7; j++) {
          if (j === i) continue;
          // moving a whole column to another empty column achieves nothing
          if (!st.tab[j].length && ci === firstUp && firstUp === 0) continue;
          if (!canStackTab(p[ci], st.tab[j])) continue;
          const s = clone(st);
          const mv = s.tab[i].splice(ci);
          s.tab[j].push(...mv);
          const np = s.tab[i]; if (np.length && !np[np.length - 1].up) np[np.length - 1].up = true;
          add(s);
        }
      }
    }
    // draw / recycle
    if (st.stock.length) {
      const s = clone(st);
      const n = Math.min(drawN, s.stock.length);
      for (let k = 0; k < n; k++) s.waste.push(s.stock.pop());
      add(s);
    } else if (st.waste.length && st.rec < maxRecycles) {
      const s = clone(st);
      while (s.waste.length) s.stock.push(s.waste.pop());
      s.rec++;
      add(s);
    }

    for (const s of next) {
      const node = { st: s, g: cur.g + 1, f: (cur.g + 1) * 0.05 + heuristic(s), parent: cur };
      if (won(s)) return { ok: true, nodes, chain: chainOf(node) };
      heap.push(node);
    }
  }
  return { ok: false, nodes, budget: false };
}

module.exports = { makeDeck, dealFromDeck, solve };
