// Balance simulator. Run: node play/labs/peak-run/dev/sim.js [runs] [altitude] [kit]
// Plays whole runs through the real engine with three bots of rising skill.
const PR = require("../engine.js");

if (process.env.BAL) Object.assign(PR.BALANCE, JSON.parse(process.env.BAL));
const runs = Number(process.argv[2]) || 2000;
const altitude = Number(process.argv[3]) || 1;
const kit = process.argv[4] || "classic";

function playHandRandom(run, r) {
  while (run.phase === "hand") {
    const moves = PR.legal(run);
    if (moves.length) PR.play(run, moves[Math.floor(r() * moves.length)]);
    else if (run.hand.stock.length) PR.draw(run);
    else break;
  }
}
// Plays the first legal card, like someone not looking ahead.
function playHandCasual(run) {
  while (run.phase === "hand") {
    const moves = PR.legal(run);
    if (moves.length) {
      moves.sort((a, b) => PR.rowOf(b) - PR.rowOf(a));
      PR.play(run, moves[0]);
    } else if (run.hand.stock.length) PR.draw(run);
    else break;
  }
}
// Follows the longest chain and banks once the target is met and only draws remain.
function playHandThinker(run) {
  while (run.phase === "hand") {
    const chain = PR.longestChain(run, 4000);
    if (chain.path && chain.path.length) {
      for (const i of chain.path) {
        if (run.phase !== "hand") break;
        if (!PR.play(run, i)) break;
      }
      continue;
    }
    const moves = PR.legal(run);
    if (moves.length) { PR.play(run, moves[0]); continue; }
    if (PR.canBank(run)) { PR.bank(run); break; }
    if (run.hand.stock.length) PR.draw(run);
    else break;
  }
}

const RARITY_FIRST = (a, b) => PR.CHARM[b].rarity - PR.CHARM[a].rarity;

function shopSmart(run) {
  // Buy the best charms, then a useful pack, keeping a little interest money late on.
  let again = true;
  while (again) {
    again = false;
    const order = run.shop.charms
      .map((o, i) => ({ o, i }))
      .filter((x) => !x.o.sold)
      .sort((a, b) => RARITY_FIRST(a.o.id, b.o.id));
    for (const x of order) {
      if (PR.buyCharm(run, x.i)) { again = true; break; }
    }
  }
  run.shop.packs.forEach((o, i) => {
    if (!o.sold && (o.id === "honey" || o.id === "wild" || o.id === "spark" || (o.id === "rope" && run.ropes < 2))) PR.buyPack(run, i);
  });
}
function shopSimple(run) {
  run.shop.charms.forEach((o, i) => PR.buyCharm(run, i));
}

function playRun(seed, playHand, shop, pick) {
  let x = PR.hashSeed("bot" + seed);
  const r = () => { x = (x + 0x6D2B79F5) | 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const run = PR.newRun({ seed, kit, altitude });
  const scores = [];
  let guard = 0;
  while (guard++ < 3000) {
    if (run.phase === "reward") {
      const list = run.reward.charms.slice().sort(pick ? RARITY_FIRST : () => 0);
      PR.takeReward(run, list[0]);
    } else if (run.phase === "hand") {
      playHand(run, r);
    } else if (run.phase === "passed") {
      scores.push({ act: run.act, stage: run.stage, ratio: run.result.score / run.result.target });
      PR.advance(run);
    } else if (run.phase === "fell") {
      scores.push({ act: run.act, stage: run.stage, ratio: run.result.score / run.result.target, failed: true });
      PR.retry(run);
    } else if (run.phase === "shop") {
      shop(run);
      PR.leaveShop(run);
    } else {
      if (run.result) scores.push({ act: run.act, stage: run.stage, ratio: run.result.score / run.result.target, failed: run.phase === "lost" });
      break;
    }
  }
  return { run, scores };
}

function report(label, playHand, shop, pick) {
  const t0 = Date.now();
  const reached = [0, 0, 0, 0];
  let hands = 0, cards = 0, bestStreak = 0, wins = 0;
  const stage = {};
  const coins = [];
  for (let n = 0; n < runs; n++) {
    const { run, scores } = playRun("s" + n, playHand, shop, pick);
    const actsDone = run.phase === "won" ? 3 : run.act;
    for (let a = 0; a <= actsDone; a++) reached[a]++;
    if (run.phase === "won") wins++;
    hands += run.stats.hands; cards += run.stats.cards; bestStreak += run.stats.bestStreak;
    coins.push(run.coins);
    for (const s of scores) {
      const k = s.act + "." + s.stage;
      (stage[k] = stage[k] || { tries: 0, fails: 0, ratios: [] }).tries++;
      if (s.failed) stage[k].fails++;
      stage[k].ratios.push(s.ratio);
    }
  }
  const pct = (v) => ((100 * v) / runs).toFixed(1) + "%";
  console.log(`\n${label}  (${runs} runs, altitude ${altitude}, ${kit}, ${Date.now() - t0}ms)`);
  console.log(`  beat act 1 ${pct(reached[1])}  act 2 ${pct(reached[2])}  whole run ${pct(wins)}`);
  console.log(`  avg hands ${(hands / runs).toFixed(1)}  cards ${(cards / runs).toFixed(0)}  best streak ${(bestStreak / runs).toFixed(1)}`);
  const rows = Object.keys(stage).sort().map((k) => {
    const s = stage[k];
    s.ratios.sort((a, b) => a - b);
    return `${k}: fail ${((100 * s.fails) / s.tries).toFixed(0)}% med ${s.ratios[Math.floor(s.ratios.length / 2)].toFixed(2)}x`;
  });
  console.log("  " + rows.join("  |  "));
}

report("Random player ", playHandRandom, shopSimple, false);
report("Casual player ", playHandCasual, shopSimple, false);
report("Thinking player", playHandThinker, shopSmart, true);
