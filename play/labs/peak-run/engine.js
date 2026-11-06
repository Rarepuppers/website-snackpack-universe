/* Peak Run rules engine. Pure logic: no DOM, no storage, no Math.random.
 * The whole run is plain JSON, so it can be saved, replayed and simulated.
 * Loaded by index.html (window.PeakRun) and dev/sim.js (require).
 * Port this file as-is when the game moves to the Android app. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PeakRun = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ════ Balance ════════════════════════════════════════════════════
  // Every tunable number lives here so dev/sim.js can test changes.
  var BALANCE = {
    acts: 3,
    stagesPerAct: 4,               // three climbs, then a boss
    startRopes: 2,
    startCoins: 4,
    drawsByAct: [22, 20, 18],
    baseCard: 10,
    peakBonus: 150,
    clearBonus: 400,
    // Tuned with dev/sim.js. Bosses carry a debuff, so their targets stay low.
    stageTargets: [600, 900, 1150, 1250],
    actScale: [1, 2.3, 4.4],
    summitScale: 1,                // extra target on the final boss
    altitudeStep: 0.2,
    payout: { climb: 4, boss: 7, drawsPerCoin: 3, interestPer: 5, interestCap: 3 },
    slots: 5,
    rerollStart: 1,
    sellRate: 0.5,
    minDeck: 40
  };

  // ════ Layout contract ════════════════════════════════════════════
  // Same geometry as the arcade's TriPeaks page.
  //   row 0: 0..2 peak tips, row 1: 3..8, row 2: 9..17, row 3: 18..27 base
  var COVERS = [];
  (function () {
    var i;
    for (i = 0; i < 3; i++) COVERS[i] = [3 + 2 * i, 4 + 2 * i];
    for (i = 0; i < 3; i++) {
      COVERS[3 + 2 * i] = [9 + 3 * i, 10 + 3 * i];
      COVERS[4 + 2 * i] = [10 + 3 * i, 11 + 3 * i];
    }
    for (i = 0; i < 9; i++) COVERS[9 + i] = [18 + i, 19 + i];
    for (i = 0; i < 10; i++) COVERS[18 + i] = [];
  })();
  var LEFT = [];
  (function () {
    var i;
    for (i = 0; i < 10; i++) LEFT[18 + i] = i;
    for (i = 0; i < 9; i++) LEFT[9 + i] = i + 0.5;
    for (i = 0; i < 3; i++) {
      LEFT[3 + 2 * i] = (LEFT[9 + 3 * i] + LEFT[10 + 3 * i]) / 2;
      LEFT[4 + 2 * i] = (LEFT[10 + 3 * i] + LEFT[11 + 3 * i]) / 2;
      LEFT[i] = (LEFT[3 + 2 * i] + LEFT[4 + 2 * i]) / 2;
    }
  })();
  function rowOf(i) { return i < 3 ? 0 : i < 9 ? 1 : i < 18 ? 2 : 3; }
  function peakCards(p) { return [p, 3 + 2 * p, 4 + 2 * p, 9 + 3 * p, 10 + 3 * p, 11 + 3 * p]; }

  // ════ Content ════════════════════════════════════════════════════
  // rarity 1 common, 2 uncommon, 3 rare.
  var CHARMS = [
    { id: "trail", name: "Trail Mix", icon: "🥜", rarity: 1, price: 4, desc: "Every card scores +5." },
    { id: "mitten", name: "Red Mitten", icon: "🧤", rarity: 1, price: 4, desc: "Hearts and diamonds score +12." },
    { id: "coffee", name: "Black Coffee", icon: "☕", rarity: 1, price: 4, desc: "Clubs and spades score +12." },
    { id: "royal", name: "Royal Jelly", icon: "👑", rarity: 1, price: 4, desc: "Jacks, queens and kings score +25." },
    { id: "lowroad", name: "Low Road", icon: "🪨", rarity: 1, price: 4, desc: "Aces to fives score +20." },
    { id: "lunch", name: "Packed Lunch", icon: "🍱", rarity: 1, price: 5, desc: "Earn 2 extra coins every hand you pass." },
    { id: "leftovers", name: "Leftovers", icon: "🥡", rarity: 1, price: 4, desc: "Every unused draw pays 1 coin." },
    { id: "longrope", name: "Long Rope", icon: "🪢", rarity: 1, price: 5, desc: "+3 draws every hand." },
    { id: "compass", name: "Compass", icon: "🧭", rarity: 1, price: 5, desc: "Playing the waste card's suit adds 1 extra streak." },
    { id: "hotsauce", name: "Hot Sauce", icon: "🌶️", rarity: 2, price: 7, desc: "Plays at streak 5 or more score ×1.5." },
    { id: "wind", name: "Second Wind", icon: "🍃", rarity: 2, price: 6, desc: "Your first 2 draws each hand keep your streak." },
    { id: "bend", name: "Round the Bend", icon: "🔁", rarity: 2, price: 6, desc: "Kings and aces are neighbours." },
    { id: "piggy", name: "Piggy Bank", icon: "🐷", rarity: 2, price: 6, desc: "Doubles your savings limit to 6 coins a hand." },
    { id: "flag", name: "Summit Flag", icon: "🚩", rarity: 2, price: 6, desc: "Clearing a peak pays triple points." },
    { id: "slow", name: "Slow Burn", icon: "🕯️", rarity: 2, price: 7, desc: "Drawing halves your streak instead of ending it." },
    { id: "goldrush", name: "Gold Rush", icon: "⛏️", rarity: 2, price: 6, desc: "Gold cards score +60." },
    { id: "jam", name: "Jam Jar", icon: "🍯", rarity: 2, price: 6, desc: "Honey cards score ×3, not ×2." },
    { id: "tailwind", name: "Tailwind", icon: "🪁", rarity: 2, price: 6, desc: "Start every hand on streak 3." },
    { id: "spyglass", name: "Spyglass", icon: "🔭", rarity: 2, price: 5, desc: "See the next 3 draws." },
    { id: "twins", name: "Twin Peaks", icon: "⛰️", rarity: 2, price: 7, desc: "Cards of the same rank can be played on each other." },
    { id: "knot", name: "Undo Knot", icon: "🎀", rarity: 2, price: 5, desc: "Undo your last move, twice each hand." },
    { id: "stretch", name: "Long Reach", icon: "🦒", rarity: 3, price: 9, desc: "Twice each hand, play a card two ranks away." },
    { id: "glass", name: "Glass Jar", icon: "🫙", rarity: 3, price: 9, desc: "All scores ×1.25 for each boss beaten, plus ×1.25 now." },
    { id: "yeast", name: "Wild Yeast", icon: "🥖", rarity: 3, price: 8, desc: "Reaching streak 8 adds a draw to the stock." },
    { id: "ember", name: "Ember", icon: "🔥", rarity: 3, price: 9, desc: "Your streak multiplier counts double from streak 10." },
    { id: "sherpa", name: "Sherpa", icon: "🎒", rarity: 3, price: 8, desc: "One extra charm slot, and +2 draws every hand." }
  ];
  var CHARM = {};
  CHARMS.forEach(function (c) { CHARM[c.id] = c; });

  var EDITIONS = {
    wild: { name: "Wild", icon: "✶", desc: "Plays on anything. Anything plays on it." },
    gold: { name: "Gold", icon: "◆", desc: "Pays 1 coin when played." },
    spark: { name: "Spark", icon: "⚡", desc: "Adds 2 to your streak." },
    honey: { name: "Honey", icon: "🍯", desc: "Scores ×2." }
  };

  var PACKS = [
    { id: "wild", name: "Wild Cards", icon: "✶", price: 6, count: 2, desc: "2 cards in your deck become Wild." },
    { id: "gold", name: "Gold Cards", icon: "◆", price: 4, count: 4, desc: "4 cards in your deck become Gold." },
    { id: "spark", name: "Spark Cards", icon: "⚡", price: 4, count: 4, desc: "4 cards in your deck become Spark." },
    { id: "honey", name: "Honey Cards", icon: "🍯", price: 5, count: 3, desc: "3 cards in your deck become Honey." },
    { id: "trim", name: "Trim the Pack", icon: "✂️", price: 3, count: 4, desc: "Remove 4 plain cards, so specials turn up more." },
    { id: "rope", name: "Spare Rope", icon: "🧵", price: 7, count: 1, desc: "+1 rope for this run." }
  ];
  var PACK = {};
  PACKS.forEach(function (p) { PACK[p.id] = p; });

  var BOSSES = [
    { id: "fog", name: "The Fog", icon: "🌫️", desc: "Covered cards stay hidden." },
    { id: "thin", name: "Thin Air", icon: "🫧", desc: "6 fewer draws." },
    { id: "whiteout", name: "Whiteout", icon: "❄️", desc: "Your streak multiplier stops at 6." },
    { id: "iron", name: "Iron Ridge", icon: "🗿", desc: "Jacks, queens and kings score nothing." },
    { id: "rockfall", name: "Rockfall", icon: "🪨", desc: "Every draw knocks points off your score." },
    { id: "blackice", name: "Black Ice", icon: "🧊", desc: "Clubs and spades do not build your streak." }
  ];
  var BOSS = {};
  BOSSES.forEach(function (b) { BOSS[b.id] = b; });

  var KITS = [
    { id: "classic", name: "Classic Pack", icon: "🂠", desc: "A plain 52 cards. The honest climb.", unlock: null },
    { id: "honeypot", name: "Honey Pot", icon: "🍯", desc: "Starts with 5 Honey cards, but 2 fewer draws.", unlock: "act1" },
    { id: "wildcard", name: "Wild Pack", icon: "✶", desc: "Starts with 3 Wild cards, but 1 fewer rope.", unlock: "act2" },
    { id: "prospector", name: "Prospector", icon: "⛏️", desc: "Starts with 6 Gold cards and 6 more coins. Targets are 10% higher.", unlock: "win" }
  ];
  var KIT = {};
  KITS.forEach(function (k) { KIT[k.id] = k; });

  var ACT_NAMES = ["The Foothills", "The Ridge", "The Summit"];

  // ════ Seeded RNG: the state is a number stored in the run ════════
  function rand(run, stream) {
    var a = run.rng[stream] | 0;
    a = (a + 0x6D2B79F5) | 0;
    run.rng[stream] = a;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function pickInt(run, stream, n) { return Math.floor(rand(run, stream) * n); }
  function shuffle(run, stream, list) {
    for (var i = list.length - 1; i > 0; i--) {
      var k = pickInt(run, stream, i + 1);
      var t = list[i]; list[i] = list[k]; list[k] = t;
    }
    return list;
  }
  function hashSeed(text) {
    var h = 2166136261;
    text = String(text);
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // ════ Helpers ════════════════════════════════════════════════════
  function has(run, id) { return run.charms.indexOf(id) >= 0; }
  function isRed(c) { return c.s === 1 || c.s === 3; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function slots(run) { return BALANCE.slots + (has(run, "sherpa") ? 1 : 0); }
  function isBossStage(run) { return run.stage === BALANCE.stagesPerAct - 1; }
  function isFinalStage(run) { return run.act === BALANCE.acts - 1 && isBossStage(run); }

  function targetFor(run, act, stage) {
    var t = BALANCE.stageTargets[stage] * BALANCE.actScale[act];
    if (act === BALANCE.acts - 1 && stage === BALANCE.stagesPerAct - 1) t *= BALANCE.summitScale;
    t *= 1 + BALANCE.altitudeStep * (run.altitude - 1);
    if (run.kit === "prospector") t *= 1.1;
    return Math.round(t / 10) * 10;
  }

  function freshDeck() {
    var d = [];
    for (var s = 0; s <= 3; s++) for (var r = 1; r <= 13; r++) d.push({ r: r, s: s, e: null });
    return d;
  }
  function plainIndexes(run) {
    var out = [];
    run.deck.forEach(function (c, i) { if (!c.e) out.push(i); });
    return out;
  }
  function stampDeck(run, edition, count, stream) {
    var plain = shuffle(run, stream, plainIndexes(run));
    plain.slice(0, count).forEach(function (i) { run.deck[i].e = edition; });
  }

  // ════ Run lifecycle ══════════════════════════════════════════════
  function newRun(opts) {
    opts = opts || {};
    var seed = opts.seed != null ? opts.seed : "run";
    var base = hashSeed(seed);
    var run = {
      v: 1,
      seed: String(seed),
      daily: opts.daily || null,
      kit: KIT[opts.kit] ? opts.kit : "classic",
      altitude: Math.max(1, opts.altitude | 0),
      rng: { deal: base | 0, shop: (base ^ 0x5bd1e995) | 0, boss: (base ^ 0x1b873593) | 0 },
      act: 0, stage: 0,
      phase: "reward",
      ropes: BALANCE.startRopes,
      coins: BALANCE.startCoins,
      charms: [],
      deck: freshDeck(),
      bosses: [],
      hand: null, shop: null, reward: null, result: null,
      bossesBeaten: 0,
      stats: { hands: 0, cards: 0, bestStreak: 0, bestPlay: 0, score: 0, ropesLost: 0, peaks: 0 }
    };
    if (run.kit === "honeypot") stampDeck(run, "honey", 5, "shop");
    if (run.kit === "wildcard") { stampDeck(run, "wild", 3, "shop"); run.ropes -= 1; }
    if (run.kit === "prospector") { stampDeck(run, "gold", 6, "shop"); run.coins += 6; }
    var bossIds = shuffle(run, "boss", BOSSES.map(function (b) { return b.id; }));
    run.bosses = bossIds.slice(0, BALANCE.acts);
    run.reward = { title: "Pack one charm for the climb", charms: rollCharms(run, 3, 1) };
    return run;
  }

  function rollCharms(run, count, maxRarity) {
    var out = [];
    var pool = CHARMS.filter(function (c) {
      return !has(run, c.id) && c.rarity <= (maxRarity || 3);
    });
    while (out.length < count && pool.length) {
      // Commons 6, uncommons 3, rares 1.
      var total = 0, i;
      for (i = 0; i < pool.length; i++) total += [0, 6, 3, 1][pool[i].rarity];
      var roll = rand(run, "shop") * total;
      for (i = 0; i < pool.length; i++) {
        roll -= [0, 6, 3, 1][pool[i].rarity];
        if (roll < 0) break;
      }
      i = Math.min(i, pool.length - 1);
      out.push(pool[i].id);
      pool.splice(i, 1);
    }
    return out;
  }

  function takeReward(run, id) {
    if (run.phase !== "reward" || run.reward.charms.indexOf(id) < 0) return false;
    if (run.charms.length >= slots(run)) return false;
    run.charms.push(id);
    afterReward(run);
    return true;
  }
  function skipReward(run) {
    if (run.phase !== "reward") return false;
    afterReward(run);
    return true;
  }
  function afterReward(run) {
    run.reward = null;
    if (!run.hand && run.stats.hands === 0) startHand(run);
    else openShop(run);
  }

  function startHand(run) {
    var draws = BALANCE.drawsByAct[run.act];
    if (has(run, "longrope")) draws += 3;
    if (has(run, "sherpa")) draws += 2;
    if (run.kit === "honeypot") draws -= 2;
    var bossId = isBossStage(run) ? run.bosses[run.act] : null;
    if (bossId === "thin") draws -= 6;
    var cards = shuffle(run, "deal", clone(run.deck));
    var need = 29;
    draws = Math.max(6, Math.min(draws, cards.length - need));
    run.hand = {
      tableau: cards.slice(0, 28),
      gone: new Array(28).fill(false),
      waste: [cards[28]],
      stock: cards.slice(need, need + draws),
      reserve: cards.slice(need + draws),
      boss: bossId,
      target: targetFor(run, run.act, run.stage),
      score: 0,
      streak: has(run, "tailwind") ? 3 : 0,
      bestStreak: 0,
      peaks: [false, false, false],
      freeDraws: has(run, "wind") ? 2 : 0,
      reach: has(run, "stretch") ? 2 : 0,
      undos: has(run, "knot") ? 2 : 0,
      yeastFired: false,
      undoSnap: null
    };
    run.phase = "hand";
  }

  // ════ Rules ══════════════════════════════════════════════════════
  function available(hand, i) {
    if (hand.gone[i]) return false;
    var c = COVERS[i];
    for (var k = 0; k < c.length; k++) if (!hand.gone[c[k]]) return false;
    return true;
  }
  // Returns 0 for no, 1 for a normal play, 2 for a play that spends Long Reach.
  function fit(run, card) {
    var hand = run.hand;
    var top = hand.waste[hand.waste.length - 1];
    if (card.e === "wild" || top.e === "wild") return 1;
    var d = Math.abs(card.r - top.r);
    if (d === 1) return 1;
    if (d === 12 && has(run, "bend")) return 1;
    if (d === 0 && has(run, "twins")) return 1;
    if (hand.reach > 0 && (d === 2 || (d === 11 && has(run, "bend")))) return 2;
    return 0;
  }
  function legal(run) {
    var out = [];
    if (run.phase !== "hand") return out;
    for (var i = 0; i < 28; i++) {
      if (available(run.hand, i) && fit(run, run.hand.tableau[i])) out.push(i);
    }
    return out;
  }
  function glassFactor(run) {
    return has(run, "glass") ? Math.pow(1.25, 1 + run.bossesBeaten) : 1;
  }

  function scoreCard(run, card, streak, top) {
    var hand = run.hand;
    if (hand.boss === "iron" && card.r >= 11) return 0;
    var flat = BALANCE.baseCard;
    if (has(run, "trail")) flat += 5;
    if (has(run, "mitten") && isRed(card)) flat += 12;
    if (has(run, "coffee") && !isRed(card)) flat += 12;
    if (has(run, "royal") && card.r >= 11) flat += 25;
    if (has(run, "lowroad") && card.r <= 5) flat += 20;
    if (has(run, "goldrush") && card.e === "gold") flat += 60;
    var mult = hand.boss === "whiteout" ? Math.min(streak, 6) : streak;
    if (has(run, "ember") && mult >= 10) mult *= 2;
    var pts = flat * Math.max(1, mult);
    if (card.e === "honey") pts *= has(run, "jam") ? 3 : 2;
    if (has(run, "hotsauce") && streak >= 5) pts *= 1.5;
    pts *= glassFactor(run);
    return Math.round(pts);
  }

  function play(run, i) {
    var hand = run.hand;
    if (run.phase !== "hand" || !available(hand, i)) return null;
    var card = hand.tableau[i];
    var kind = fit(run, card);
    if (!kind) return null;
    if (hand.undos > 0) hand.undoSnap = snapshot(run);
    var top = hand.waste[hand.waste.length - 1];
    if (kind === 2) hand.reach -= 1;
    hand.gone[i] = true;
    hand.waste.push(card);

    var gain = 1;
    if (card.e === "spark") gain += 1;
    if (has(run, "compass") && card.s === top.s) gain += 1;
    if (hand.boss === "blackice" && !isRed(card)) gain = 0;
    hand.streak += gain;
    hand.bestStreak = Math.max(hand.bestStreak, hand.streak);

    var pts = scoreCard(run, card, hand.streak, top);
    var bonus = 0, peaksNow = 0, cleared = false;
    var coin = 0;
    if (card.e === "gold") { run.coins += 1; coin = 1; }
    for (var p = 0; p < 3; p++) {
      if (hand.peaks[p]) continue;
      if (peakCards(p).every(function (k) { return hand.gone[k]; })) {
        hand.peaks[p] = true;
        peaksNow += 1;
        bonus += BALANCE.peakBonus * (has(run, "flag") ? 3 : 1);
      }
    }
    if (hand.gone.every(Boolean)) { cleared = true; bonus += BALANCE.clearBonus; }
    hand.score += pts + bonus;
    run.stats.cards += 1;
    run.stats.peaks += peaksNow;
    run.stats.bestStreak = Math.max(run.stats.bestStreak, hand.streak);
    run.stats.bestPlay = Math.max(run.stats.bestPlay, pts);

    if (has(run, "yeast") && hand.streak >= 8 && !hand.yeastFired) {
      hand.yeastFired = true;
      if (hand.reserve.length) hand.stock.push(hand.reserve.pop());
    }
    var ended = settleIfOver(run);
    return { pts: pts, bonus: bonus, streak: hand.streak, coin: coin, peaks: peaksNow, cleared: cleared, ended: ended };
  }

  function draw(run) {
    var hand = run.hand;
    if (run.phase !== "hand" || !hand.stock.length) return null;
    if (hand.undos > 0) hand.undoSnap = snapshot(run);
    hand.waste.push(hand.stock.shift());
    var lost = 0;
    if (hand.freeDraws > 0) hand.freeDraws -= 1;
    else if (has(run, "slow")) hand.streak = Math.floor(hand.streak / 2);
    else hand.streak = 0;
    if (hand.boss === "rockfall") {
      lost = Math.min(hand.score, 60 * (run.act + 1));
      hand.score -= lost;
    }
    var ended = settleIfOver(run);
    return { lost: lost, ended: ended };
  }

  function snapshot(run) {
    var h = run.hand;
    return {
      gone: h.gone.slice(), waste: clone(h.waste), stock: clone(h.stock), reserve: clone(h.reserve),
      score: h.score, streak: h.streak, bestStreak: h.bestStreak, peaks: h.peaks.slice(),
      freeDraws: h.freeDraws, reach: h.reach, yeastFired: h.yeastFired, coins: run.coins
    };
  }
  function undo(run) {
    var h = run.hand;
    if (run.phase !== "hand" || !h.undoSnap || h.undos <= 0) return false;
    var s = h.undoSnap;
    Object.keys(s).forEach(function (k) { if (k !== "coins") h[k] = s[k]; });
    run.coins = s.coins;
    h.undos -= 1;
    h.undoSnap = null;
    return true;
  }

  function isStuck(run) { return !run.hand.stock.length && !legal(run).length; }
  function settleIfOver(run) {
    var h = run.hand;
    if (h.gone.every(Boolean) || isStuck(run)) { endHand(run); return true; }
    return false;
  }
  function canBank(run) { return run.phase === "hand" && run.hand.score >= run.hand.target; }
  function bank(run) {
    if (!canBank(run)) return false;
    endHand(run);
    return true;
  }

  function payout(run) {
    var h = run.hand, p = BALANCE.payout;
    var boss = isBossStage(run);
    var lines = [{ label: boss ? "Boss beaten" : "Climb passed", coins: boss ? p.boss : p.climb }];
    var unused = h.stock.length;
    var perDraw = has(run, "leftovers") ? unused : Math.floor(unused / p.drawsPerCoin);
    if (perDraw) lines.push({ label: unused + " unused draws", coins: perDraw });
    if (h.score >= h.target * 2) lines.push({ label: "Double the target", coins: 3 });
    else if (h.score >= h.target * 1.5) lines.push({ label: "Well over target", coins: 1 });
    if (has(run, "lunch")) lines.push({ label: "Packed Lunch", coins: 2 });
    var cap = p.interestCap * (has(run, "piggy") ? 2 : 1);
    var interest = Math.min(cap, Math.floor(run.coins / p.interestPer));
    if (interest) lines.push({ label: "Savings", coins: interest });
    return lines;
  }

  function endHand(run) {
    var h = run.hand;
    run.stats.hands += 1;
    run.stats.score += h.score;
    var passed = h.score >= h.target;
    if (!passed) {
      run.ropes -= 1;
      run.stats.ropesLost += 1;
      run.result = { passed: false, score: h.score, target: h.target, ropes: run.ropes, boss: h.boss };
      run.phase = run.ropes <= 0 ? "lost" : "fell";
      return;
    }
    var lines = payout(run);
    var total = lines.reduce(function (n, l) { return n + l.coins; }, 0);
    run.coins += total;
    var boss = isBossStage(run);
    if (boss) run.bossesBeaten += 1;
    run.result = { passed: true, score: h.score, target: h.target, lines: lines, total: total, boss: h.boss };
    run.phase = isFinalStage(run) ? "won" : "passed";
  }

  // Called after the "fell" screen: same stage, a new deal, one rope lighter.
  function retry(run) {
    if (run.phase !== "fell") return false;
    run.result = null;
    startHand(run);
    return true;
  }

  // Called after the "passed" screen.
  function advance(run) {
    if (run.phase !== "passed") return false;
    var wasBoss = isBossStage(run);
    run.result = null;
    if (wasBoss) {
      run.reward = { title: "Boss spoils: take a charm for free", charms: rollCharms(run, 3, 3) };
      if (run.charms.length >= slots(run)) { run.reward = null; openShop(run); return true; }
      run.phase = "reward";
      return true;
    }
    openShop(run);
    return true;
  }

  // ════ Shop ═══════════════════════════════════════════════════════
  function rollPacks(run) {
    var ids = shuffle(run, "shop", PACKS.map(function (p) { return p.id; }));
    return ids.slice(0, 2).map(function (id) { return { id: id, sold: false }; });
  }
  function openShop(run) {
    run.shop = {
      charms: rollCharms(run, 3).map(function (id) { return { id: id, sold: false }; }),
      packs: rollPacks(run),
      reroll: BALANCE.rerollStart
    };
    run.phase = "shop";
  }
  function buyCharm(run, slot) {
    var o = run.phase === "shop" && run.shop.charms[slot];
    if (!o || o.sold) return false;
    var c = CHARM[o.id];
    if (run.coins < c.price || run.charms.length >= slots(run)) return false;
    run.coins -= c.price;
    run.charms.push(o.id);
    o.sold = true;
    return true;
  }
  function canBuyPack(run, slot) {
    var o = run.phase === "shop" && run.shop.packs[slot];
    if (!o || o.sold) return false;
    var p = PACK[o.id];
    if (run.coins < p.price) return false;
    if (o.id === "rope") return true;
    if (o.id === "trim" && run.deck.length - p.count < BALANCE.minDeck) return false;
    return plainIndexes(run).length >= p.count;
  }
  function buyPack(run, slot) {
    if (!canBuyPack(run, slot)) return false;
    var o = run.shop.packs[slot], p = PACK[o.id];
    run.coins -= p.price;
    if (o.id === "rope") run.ropes += 1;
    else if (o.id === "trim") {
      var cut = shuffle(run, "shop", plainIndexes(run)).slice(0, p.count).sort(function (a, b) { return b - a; });
      cut.forEach(function (i) { run.deck.splice(i, 1); });
    } else stampDeck(run, o.id, p.count, "shop");
    o.sold = true;
    return true;
  }
  function reroll(run) {
    if (run.phase !== "shop" || run.coins < run.shop.reroll) return false;
    run.coins -= run.shop.reroll;
    run.shop.reroll += 1;
    run.shop.charms = rollCharms(run, 3).map(function (id) { return { id: id, sold: false }; });
    return true;
  }
  function sellValue(id) { return Math.max(1, Math.floor(CHARM[id].price * BALANCE.sellRate)); }
  function sellCharm(run, id) {
    var i = run.charms.indexOf(id);
    if (run.phase !== "shop" || i < 0) return false;
    run.charms.splice(i, 1);
    run.coins += sellValue(id);
    return true;
  }
  function leaveShop(run) {
    if (run.phase !== "shop") return false;
    run.shop = null;
    run.stage += 1;
    if (run.stage >= BALANCE.stagesPerAct) { run.stage = 0; run.act += 1; }
    startHand(run);
    return true;
  }

  // ════ Hand evaluation for hints and the sim bot ══════════════════
  // Longest chain of plays reachable from here without drawing. It works on
  // a light copy, so it never touches the real hand.
  function longestChain(run, budget) {
    var hand = run.hand;
    var gone = hand.gone.slice();
    var nodes = 0;
    var bend = has(run, "bend"), twins = has(run, "twins");
    function open(i) {
      if (gone[i]) return false;
      var c = COVERS[i];
      for (var k = 0; k < c.length; k++) if (!gone[c[k]]) return false;
      return true;
    }
    function fits(card, top) {
      if (card.e === "wild" || top.e === "wild") return true;
      var d = Math.abs(card.r - top.r);
      return d === 1 || (bend && d === 12) || (twins && d === 0);
    }
    function dfs(top) {
      var best = 0, path = null;
      if (nodes++ > budget) return { n: 0, path: null };
      for (var i = 0; i < 28; i++) {
        if (!open(i) || !fits(hand.tableau[i], top)) continue;
        gone[i] = true;
        var r = dfs(hand.tableau[i]);
        gone[i] = false;
        if (r.n + 1 > best) { best = r.n + 1; path = [i].concat(r.path || []); }
        if (nodes > budget) break;
      }
      return { n: best, path: path };
    }
    return dfs(hand.waste[hand.waste.length - 1]);
  }

  return {
    BALANCE: BALANCE, COVERS: COVERS, LEFT: LEFT, rowOf: rowOf, peakCards: peakCards,
    CHARMS: CHARMS, CHARM: CHARM, EDITIONS: EDITIONS, PACKS: PACKS, PACK: PACK,
    BOSSES: BOSSES, BOSS: BOSS, KITS: KITS, KIT: KIT, ACT_NAMES: ACT_NAMES,
    newRun: newRun, takeReward: takeReward, skipReward: skipReward, startHand: startHand,
    available: available, legal: legal, play: play, draw: draw, undo: undo,
    canBank: canBank, bank: bank, payout: payout, retry: retry, advance: advance,
    buyCharm: buyCharm, buyPack: buyPack, canBuyPack: canBuyPack, reroll: reroll, sellCharm: sellCharm,
    sellValue: sellValue, leaveShop: leaveShop, slots: slots, has: has, isRed: isRed,
    isBossStage: isBossStage, targetFor: targetFor, longestChain: longestChain, hashSeed: hashSeed
  };
});
