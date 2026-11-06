// Thirteen rules for friend rooms. Same rules as /play/thirteen/, which remains
// the reference: if a rule changes there, change it here and run test/rooms.test.mjs.

export function rankValue(c, mode) {
  if (mode === "classic" && c.value === 2) return c.suit;
  if (mode === "classic" && c.value === 1) return 12 * 4 + c.suit;
  if (mode === "classic") return (c.value - 2) * 4 + c.suit;
  if (c.value === 2) return 13 * 4 + c.suit;
  if (c.value === 1) return 12 * 4 + c.suit;
  return (c.value - 3) * 4 + c.suit;
}

export function sortCards(cards, mode) {
  return cards.slice().sort((a, b) => rankValue(a, mode) - rankValue(b, mode));
}

const seqRank = (c) => (c.value === 2 ? 15 : c.value === 1 ? 14 : c.value);
const seqIndex = (c) => (c.value === 1 ? 11 : c.value === 2 ? 12 : c.value - 3);

function isCircularConsecutive(cards) {
  const indices = Array.from(new Set(cards.map(seqIndex))).sort((a, b) => a - b);
  if (indices.length !== cards.length) return false;
  const gaps = indices.map((rank, i) => (indices[(i + 1) % indices.length] - rank + 13) % 13);
  return gaps.filter((g) => g > 1).length <= 1 && gaps.every((g) => g > 0);
}

export function identifyCombo(cards, mode) {
  if (cards.length === 0) return null;
  const sorted = sortCards(cards, mode);
  const n = sorted.length;
  if (n === 1) return { type: "single", cards: sorted, rankKey: rankValue(sorted[0], mode) };
  if (n === 2 && sorted[0].value === sorted[1].value) return { type: "pair", cards: sorted, rankKey: rankValue(sorted[1], mode) };
  if (n === 3 && sorted[0].value === sorted[1].value && sorted[1].value === sorted[2].value) return { type: "triple", cards: sorted, rankKey: rankValue(sorted[2], mode) };
  if (n === 4 && sorted.every((c) => c.value === sorted[0].value)) return { type: "quad", cards: sorted, rankKey: rankValue(sorted[3], mode) };
  if (n >= 3) {
    const ranks = sorted.map(seqRank);
    if (!(mode === "standard" && ranks.some((r) => r === 15))) {
      if (ranks.every((r, i) => i === 0 || r === ranks[i - 1] + 1)) return { type: "sequence", cards: sorted, rankKey: rankValue(sorted[n - 1], mode) };
      if (mode === "classic" && isCircularConsecutive(sorted)) return { type: "sequence", cards: sorted, rankKey: Math.max(...sorted.map((c) => rankValue(c, mode))) };
    }
  }
  if (n >= 6 && n % 2 === 0) {
    const pairRanks = [];
    let ok = true;
    for (let i = 0; i < n; i += 2) {
      if (sorted[i].value !== sorted[i + 1].value) { ok = false; break; }
      pairRanks.push(seqRank(sorted[i]));
    }
    if (ok && pairRanks.length >= 3) {
      if (mode === "standard" && pairRanks.some((r) => r === 15)) ok = false;
      if (ok && pairRanks.every((r, i) => i === 0 || r === pairRanks[i - 1] + 1)) return { type: "pair-sequence", cards: sorted, rankKey: rankValue(sorted[n - 1], mode) };
    }
  }
  return null;
}

export function canBeat(attempt, current, mode) {
  if (!current) return true;
  if (attempt.type === current.type && attempt.cards.length === current.cards.length) return attempt.rankKey > current.rankKey;
  const topIsTwo = current.cards[current.cards.length - 1].value === 2;
  if (mode === "standard" && attempt.type === "quad" && current.type === "single" && topIsTwo) return true;
  if (mode === "standard" && attempt.type === "pair-sequence" && attempt.cards.length >= 6 && current.type === "single" && topIsTwo) return true;
  if (mode === "standard" && attempt.type === "pair-sequence" && attempt.cards.length >= 8 && current.type === "pair" && topIsTwo) return true;
  return false;
}

export function comboName(combo) {
  if (!combo) return "";
  const n = combo.cards.length;
  return { single: "Single", pair: "Pair", triple: "Triple", quad: "Bomb (four of a kind)", sequence: `${n}-card sequence`, "pair-sequence": `${n / 2}-pair sequence` }[combo.type];
}

// Enough candidates for a fair computer seat, without trying every subset of a hand.
// A Worker has only milliseconds of CPU per event, and 8,191 subsets would not fit.
function enumerateCombos(hand, mode) {
  const sorted = sortCards(hand, mode);
  const combos = [];
  const add = (cards) => { const combo = identifyCombo(cards, mode); if (combo) combos.push(combo); };
  const groups = new Map();
  for (const card of sorted) groups.set(card.value, [...(groups.get(card.value) || []), card]);
  sorted.forEach((card) => add([card]));
  for (const group of groups.values()) {
    for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) add([group[i], group[j]]);
    if (group.length >= 3) add(group.slice(0, 3));
    if (group.length === 4) add(group);
  }
  const runCards = [...groups.values()].map((group) => group[0]).sort((a, b) => seqRank(a) - seqRank(b));
  for (let start = 0; start < runCards.length; start++) {
    for (let end = start + 3; end <= runCards.length; end++) add(runCards.slice(start, end));
  }
  return combos;
}

export function legalCombos(game, seat) {
  const current = game.lastSeat === seat ? null : game.lastCombo;
  return enumerateCombos(game.hands[seat], game.mode).filter((combo) =>
    (!game.firstTurn || combo.cards.some((c) => c.value === 3 && c.suit === 0)) && canBeat(combo, current, game.mode));
}

// Plays for an empty or disconnected seat. Same priorities as Normal on the page.
export function cpuChoose(game, seat) {
  const options = legalCombos(game, seat);
  if (!options.length) return null;
  const hand = game.hands[seat];
  const finishing = options.find((c) => c.cards.length === hand.length);
  if (finishing) return finishing;
  const leading = !game.lastCombo || game.lastSeat === seat;
  options.sort((a, b) => (leading ? b.cards.length - a.cards.length : 0) || a.rankKey - b.rankKey);
  return options[0];
}

export function newGame(mode, random = Math.random) {
  const deck = [];
  for (let value = 1; value <= 13; value++) for (let suit = 0; suit <= 3; suit++) deck.push({ value, suit, id: `${value}-${suit}` });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const hands = [0, 13, 26, 39].map((start) => sortCards(deck.slice(start, start + 13), mode));
  const turn = hands.findIndex((h) => h.some((c) => c.value === 3 && c.suit === 0));
  return { mode, hands, turn, lastCombo: null, lastSeat: null, passed: [], firstTurn: true, winner: null };
}

function nextSeat(game, seat) {
  for (let i = 1; i <= 4; i++) {
    const next = (seat + i) % 4;
    if (!game.passed.includes(next)) return next;
  }
  return seat;
}

export function play(game, seat, combo) {
  const ids = new Set(combo.cards.map((c) => c.id));
  game.hands[seat] = game.hands[seat].filter((c) => !ids.has(c.id));
  game.lastCombo = combo;
  game.lastSeat = seat;
  game.passed = [];
  game.firstTurn = false;
  if (!game.hands[seat].length) { game.winner = seat; return; }
  game.turn = nextSeat(game, seat);
}

export function pass(game, seat) {
  game.passed.push(seat);
  const active = [0, 1, 2, 3].filter((s) => !game.passed.includes(s));
  if (active.length === 1) {
    game.turn = active[0];
    game.lastCombo = null;
    game.lastSeat = null;
    game.passed = [];
    return;
  }
  game.turn = nextSeat(game, seat);
}
