/**
 * TriPeaks solver — decides whether a deal can be cleared.
 *
 * Used by scripts/gen-tripeaks-seeds.mjs to mine a pool of guaranteed-winnable
 * deals, and by scripts/verify-tripeaks-deals.js to re-check the committed pool.
 * Not shipped to the browser: the page deals from the verified pool instead.
 *
 * Why a pool at all, when TriPeaks is cheap to solve? Consistency. Solitaire and
 * FreeCell on this site both advertise solver-verified deals, and "verified"
 * should mean the same thing across the arcade. Doing it offline also keeps the
 * deal instant and costs the player's battery nothing.
 *
 * THE LAYOUT CONTRACT. These 28 indices and their covering rules are duplicated
 * in play/tripeaks/index.html. If you change one you MUST change the other, or
 * the pool will certify boards the page never deals.
 *
 *   row 0 — indices 0..2    the three peak tips
 *   row 1 — indices 3..8    two per peak
 *   row 2 — indices 9..17   three per peak
 *   row 3 — indices 18..27  the shared base row of ten
 *
 * A card is available when both cards overlapping it are gone. Base-row cards
 * are always available.
 */

"use strict";

/** For each tableau index, the indices that cover it. Base row covers nothing. */
function buildCovers() {
  const covers = [];
  // Peak tips: peak p is covered by its own two row-1 cards.
  for (let p = 0; p < 3; p++) covers[p] = [3 + 2 * p, 3 + 2 * p + 1];
  // Row 1: peak p holds row-1 cards 2p and 2p+1 above row-2 cards 3p..3p+2.
  for (let p = 0; p < 3; p++) {
    covers[3 + 2 * p] = [9 + 3 * p, 9 + 3 * p + 1];
    covers[3 + 2 * p + 1] = [9 + 3 * p + 1, 9 + 3 * p + 2];
  }
  // Row 2: nine cards, each sitting on two of the ten base cards.
  for (let j = 0; j < 9; j++) covers[9 + j] = [18 + j, 18 + j + 1];
  // Base row: nothing on top.
  for (let j = 0; j < 10; j++) covers[18 + j] = [];
  return covers;
}

const COVERS = buildCovers();

/** Deterministic PRNG — identical to the one in the page, so seeds agree. */
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deal a board from a seed. MUST match play/tripeaks/index.html exactly.
 * Suits are 0 club, 1 diamond, 2 spade, 3 heart — the same order Golf
 * Solitaire uses on this site, so the painted suit icons index the same way.
 */
function deal(seed) {
  const rng = mulberry32(seed);
  const deck = [];
  for (let s = 0; s <= 3; s++) for (let r = 1; r <= 13; r++) deck.push({ s, r });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
  }
  return {
    tableau: deck.slice(0, 28),
    waste: deck[28],
    stock: deck.slice(29) // 23 cards
  };
}

/** One rank apart, optionally wrapping King <-> Ace. */
function canPlay(rank, ontoRank, wrap) {
  const diff = Math.abs(rank - ontoRank);
  if (diff === 1) return true;
  return wrap && diff === 12;
}

/**
 * Can this board be cleared?
 *
 * Depth-first over (removed-cards bitmask, stock index, current waste rank).
 * Only the waste *rank* matters for legality, never the suit, which collapses a
 * lot of otherwise-distinct states.
 *
 * `nodeBudget` bounds the search so a pathological board cannot hang the miner.
 * Exhausting it returns false — treated as "not provably winnable", which is the
 * safe direction for a pool that promises every deal is solvable.
 */
function isSolvable(board, wrap, nodeBudget) {
  const budget = nodeBudget || 400000;
  const tableau = board.tableau;
  const stock = board.stock;
  const ALL = (1 << 28) - 1;
  const seen = new Set();
  let nodes = 0;

  function available(mask, i) {
    if (mask & (1 << i)) return false;            // already gone
    const c = COVERS[i];
    for (let k = 0; k < c.length; k++) {
      if (!(mask & (1 << c[k]))) return false;    // still covered
    }
    return true;
  }

  function search(mask, stockIdx, wasteRank) {
    if (mask === ALL) return true;
    if (++nodes > budget) return false;

    const key = mask + "|" + stockIdx + "|" + wasteRank;
    if (seen.has(key)) return false;
    seen.add(key);

    // Try every playable tableau card first — clearing is always progress, and
    // exploring plays before draws finds a win far sooner on winnable boards.
    for (let i = 0; i < 28; i++) {
      if (!available(mask, i)) continue;
      if (!canPlay(tableau[i].r, wasteRank, wrap)) continue;
      if (search(mask | (1 << i), stockIdx, tableau[i].r)) return true;
    }

    // Otherwise turn the next stock card.
    if (stockIdx < stock.length) {
      if (search(mask, stockIdx + 1, stock[stockIdx].r)) return true;
    }
    return false;
  }

  return search(0, 0, board.waste.r);
}

module.exports = { COVERS, mulberry32, deal, canPlay, isSolvable };
