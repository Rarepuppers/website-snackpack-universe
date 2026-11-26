// Drives deliveries with bot drivers through the real physics.
// node play/labs/snack-haul/dev/sim.js            base truck, all routes
// node play/labs/snack-haul/dev/sim.js career     one player from start to finish
// node play/labs/snack-haul/dev/sim.js late       upgrades must keep helping
// node play/labs/snack-haul/dev/sim.js trucks     every truck on sample routes
// node play/labs/snack-haul/dev/sim.js opening    gas-only and learner drivers on the designed openers
// node play/labs/snack-haul/dev/sim.js medals     gold times (--write)
// node play/labs/snack-haul/dev/sim.js daily      the World Tour Daily pool (--write)
// node play/labs/snack-haul/dev/sim.js testdrives every Test Drive with learners and careful drivers
// node play/labs/snack-haul/dev/sim.js topup      the Top-Up Run reaches its target stops
// node play/labs/snack-haul/dev/sim.js lasso      the Lucky Lasso fires once and ghosts replay it
// node play/labs/snack-haul/dev/sim.js side       Back Roads, Extra Mile and Old Crust's orders: drivers and ghost replays
const SH = require("../engine.js");

if (process.env.BAL) Object.assign(SH.BALANCE, JSON.parse(process.env.BAL));

// target = cruising speed. A careful driver slows for crests and dips ahead.
function drive(id, upgrades, target, maxSeconds, truck, delivery, watch, opts = {}) {
  const g = SH.createGame({ id, delivery, upgrades, truck });
  const log = [];
  const t = g.terrain;
  let frames = 0;
  while (g.status === "driving" && frames < maxSeconds * 60) {
    frames++;
    const pos = g.truck.getPosition(), vx = g.truck.getLinearVelocity().x;
    const input = SH.botInput(g, target);
    if (opts.noBrake) {
      input.brake = false;
      // No brakes: lift off early and coast into the depot.
      if (opts.coastFrom && (t.zoneStart + t.zoneEnd) / 2 - pos.x < opts.coastFrom && g.grounded()) input.gas = vx < 0.6;
    }
    g.step(input);
    if (watch) for (const ev of g.events) if (ev.type === "lost" || ev.type === "broken" || ev.type === "ruined" || ev.type === "missed") log.push(ev.type + " " + ev.cargo + " @" + Math.round(pos.x) + " v" + vx.toFixed(1) + " " + (SH.featureAt(t, pos.x) ? SH.featureAt(t, pos.x).type : "") + (g.grounded() ? "" : " air"));
    if (watch) g.events.length = 0;
  }
  if (g.status === "driving") { g.status = "failed"; g.reason = "timeout:" + Math.round(g.truck.getPosition().x) + "/" + Math.round(t.total); }
  const rep = SH.report(g);
  rep.rec = g.rec;
  rep.log = log; rep.endX = Math.round(g.truck.getPosition().x);
  return rep;
}

const base = { engine: 0, suspension: 0, tyres: 0, straps: 0, tank: 0 };
const cell = (r, w) => (r.status === "done" ? "*".repeat(r.stars) + ` ${r.kept}/${r.total}` : `F ${r.reason.slice(0, 5)} ${r.kept}/${r.total}`).padEnd(w);

function table(label, upgrades, targets) {
  console.log("\n" + label);
  console.log("delivery    " + targets.map((v) => ("speed " + v).padEnd(14)).join(""));
  for (const d of SH.DELIVERIES) {
    console.log(d.id.padEnd(12) + targets.map((v) => cell(drive(d.id, upgrades, v, 180), 14)).join(""));
  }
}

// A patient player: retries a route, buys the cheapest upgrade they can afford.
function career() {
  const up = Object.assign({}, base);
  let coins = 0, attempts = 0; const stars = {};
  let stuck = 0;
  for (const d of SH.DELIVERIES) {
    let best = null, tries = 0;
    while (tries < 16) {
      tries++; attempts++;
      const speed = [5, 6.5, 8, 4, 3][tries % 5];
      const r = drive(d.id, up, speed, 200);
      coins += r.earned;
      if (r.stars > 0 && (!best || r.stars > best.stars)) best = r;
      for (;;) {
        const opts = SH.UPGRADES.map((u) => ({ id: u.id, c: SH.upgradeCost(up[u.id]) })).filter((o) => o.c != null).sort((a, b) => a.c - b.c);
        if (!opts.length || opts[0].c > coins) break;
        coins -= opts[0].c; up[opts[0].id]++;
      }
      if (best && (best.stars === 3 || tries >= 3)) break;
    }
    stars[d.id] = best ? best.stars : 0;
    const gate = d.index === 7 ? `  region stars ${SH.regionStars(d.region, stars)}/24` : "";
    console.log(d.id.padEnd(12), best ? "*".repeat(best.stars).padEnd(4) : "STUCK", gate, `tries ${String(tries).padStart(2)}  coins ${String(coins).padStart(4)}  ` + Object.keys(up).map((k) => k[0] + up[k]).join(" "));
    if (!best) stuck++;
  }
  console.log("attempts", attempts, "stuck", stuck);
}

function late() {
  for (const lvl of [2, 3, 5]) {
    const u = { engine: lvl, suspension: lvl, tyres: lvl, straps: lvl, tank: lvl };
    console.log("\nAll upgrades level " + lvl);
    for (const id of ["dunes-6", "harbour-6", "frost-4", "frost-8", "chilli-5", "chilli-8", "market-4", "market-8"]) {
      console.log(id.padEnd(10) + [3, 4, 5, 6.5, 8].map((v) => cell(drive(id, u, v, 200), 13)).join(""));
    }
  }
}

function trucks() {
  const lvl = 2;
  const u = { engine: lvl, suspension: lvl, tyres: lvl, straps: lvl, tank: lvl };
  for (const t of SH.TRUCKS) {
    console.log("\n" + t.name);
    for (const id of ["bakery-4", "dunes-4", "harbour-3", "frost-3", "chilli-2", "market-2"]) {
      console.log(id.padEnd(10) + [4, 5.5, 7, 9].map((v) => cell(drive(id, u, v, 200, t.id), 13)).join(""));
    }
  }
}

// Long Haul: how far each truck gets, and that a recorded run replays exactly.
function long() {
  const L = Number(process.argv[3] || 2);
  const u = { engine: L, suspension: L, tyres: L, straps: L, tank: L };
  SH.REGIONS.forEach((region, r) => {
    const d = SH.longHaul(r, "sim");
    console.log(region.id.padEnd(9) + [4, 5.5, 7].map((v) => { const x = drive(null, u, v, 600, "pickup", d); return (x.metres + "m " + x.kept + "/" + x.total + " " + (x.reason || "")).padEnd(22); }).join(""));
  });
}
function ghost() {
  let bad = 0;
  for (const id of ["bakery-5", "dunes-5", "harbour-8", "frost-6", "chilli-8", "market-8"]) {
    const a = drive(id, base, 5.5, 200);
    const b = SH.ghostPath({ id, upgrades: base }, a.rec).report;
    const same = a.status === b.status && a.kept === b.kept && Math.abs(a.time - b.time) < 1e-9 && a.metres === b.metres;
    if (!same) bad++;
    console.log(id.padEnd(11), same ? "replays exactly" : "DIFFERS", a.status, a.kept + "/" + a.total, a.time.toFixed(2), "vs", b.status, b.kept + "/" + b.total, b.time.toFixed(2), "rec", a.rec.length);
  }
  // Beat your ghost: one run becomes the ghost, another races it in lockstep.
  // The live gap starts at zero. Racing a slower ghost it goes negative and stays
  // between zero and the final margin (it is measured where the ghost is now).
  // Racing a faster ghost it ends within a second of the real margin.
  for (const [ghostV, meV] of [[4, 5.5], [5.5, 4]]) for (const id of ["bakery-2", "bakery-5", "dunes-3", "frost-2", "harbour-2", "market-1"]) {
    const ghostRun = drive(id, base, ghostV, 200);
    if (ghostRun.status !== "done") { console.log(id.padEnd(11), "ghost run failed, skipped"); continue; }
    const me = SH.createGame({ id, upgrades: base }), gh = SH.createGame({ id, upgrades: base }), gap = SH.ghostGap();
    let i = 0, k = 0, first = null, frames = 0;
    while (me.status === "driving" && frames++ < 200 * 60) {
      me.step(SH.botInput(me, meV));
      if (gh.status === "driving" && i < ghostRun.rec.length) {
        gh.step({ gas: !!(ghostRun.rec[i] & 1), brake: !!(ghostRun.rec[i] & 2) });
        if (++k >= ghostRun.rec[i + 1]) { i += 2; k = 0; }
      }
      gap.push(me.truck.getPosition().x, gh.truck.getPosition().x, gh.status === "driving");
      if (first == null) first = gap.gap();
    }
    const r = SH.report(me), end = gap.gap(), diff = r.time - ghostRun.time;
    if (r.status !== "done") { console.log(id.padEnd(11), "racing run failed, skipped"); continue; }
    const ok = first === 0 && r.status === "done" && (diff < 0 ? end < 0 && end >= diff - 0.05 : Math.abs(end - diff) < 1);
    if (!ok) bad++;
    console.log(id.padEnd(11), (ok ? "gap ok" : "GAP WRONG").padEnd(10), "ghost", ghostRun.time.toFixed(1) + "s", "me", r.time.toFixed(1) + "s", "margin", diff.toFixed(2), "live gap at finish", end.toFixed(2));
  }
  process.exitCode = bad ? 1 : 0;
}

// node dev/sim.js trace <route> [truck] [level]: where each load is lost.
function trace() {
  const id = process.argv[3], truck = process.argv[4] || "pickup", lvl = Number(process.argv[5] || 4);
  const u = { engine: lvl, suspension: lvl, tyres: lvl, straps: lvl, tank: lvl };
  for (const v of [3, 4, 5, 6.5, 8]) {
    const r = drive(id, u, v, 200, truck, null, true);
    console.log(("speed " + v).padEnd(10) + cell(r, 13) + " end " + r.endX + "  " + r.log.join(" | "));
  }
}

// Writes the route challenge table into engine.js. Each region has a planned
// mix of challenge kinds; the target comes from the bot's runs at upgrade level 4,
// a little easier than its best. A kind the bot cannot do falls back to the next.
// No-brake only works where the road climbs into the depot: coasting barely slows
// the truck on the flat, so it stays on Frosty Pass 3 alone.
// Side roads name their own challenge kind.
const SIDE_PLAN = { "back-1": "coins", "back-2": "calm:hay", "back-3": "calm:seesaw", "back-4": "flat", "back-5": "coins", "back-6": "fuel" };
const CHALLENGE_PLAN = {
  bakery: ["coins", "speed", "fuel", "air", "truck:tuktuk", "flat", "fuel", "coins"],
  dunes: ["speed", "coins", "flat", "truck:buggy", "flat", "air", "fuel", "coins"],
  harbour: ["coins", "calm:bridge", "speed", "calm:ford", "truck:van", "flat", "fuel", "calm:bridge"],
  frost: ["coins", "calm:slick", "nobrake", "fuel", "truck:hauler", "calm:slick", "flat", "coins"],
  chilli: ["air", "coins", "flat", "air", "truck:monster", "speed", "fuel", "air"],
  market: ["coins", "calm:bump", "air", "calm:slick", "truck:tuktuk", "flat", "fuel", "speed"]
};
const COASTS = [8, 12, 16, 20, 25, 30, 40, 55];
const FALLBACK = ["coins", "fuel", "flat", "speed", "air", "truck:van", "truck:hauler", "truck:monster", "truck:buggy", "truck:tuktuk"];
function challenges() {
  const ups = { 4: { engine: 4, suspension: 4, tyres: 4, straps: 4, tank: 4 }, 5: { engine: 5, suspension: 5, tyres: 5, straps: 5, tank: 5 } };
  const speeds = [3, 4, 5, 6.5, 8, 10, 12];
  const levelFor = {};
  const ok = (r) => r.status === "done" && r.stars >= 2;
  const floorTo = (v, step) => Math.floor(v / step + 1e-9) * step;
  const ceilTo = (v, step) => Math.ceil(v / step - 1e-9) * step;
  const round = (v) => Math.round(v * 100) / 100;
  const table = {};
  for (const d of SH.DELIVERIES.concat(SH.SIDE)) {
    const region = SH.REGIONS[d.region].id, wanted = d.side ? SIDE_PLAN[d.id] || "coins" : CHALLENGE_PLAN[region][d.index];
    let up = ups[4], runs = speeds.map((v) => drive(d.id, up, v, 200)).filter(ok);
    // A route the bot cannot finish well at level 4 sets its target at level 5.
    if (!runs.length) { up = ups[5]; runs = speeds.map((v) => drive(d.id, up, v, 200)).filter(ok); }
    levelFor[d.id] = up;
    const tryKind = (spec) => {
      const [kind, arg] = spec.split(":");
      if (kind === "truck") return speeds.some((v) => ok(drive(d.id, up, v, 200, arg))) ? { kind, truck: arg } : null;
      if (kind === "nobrake") return COASTS.some((coastFrom) => speeds.some((v) => { const r = drive(d.id, up, v, 200, "pickup", null, false, { noBrake: true, coastFrom }); return SH.challengeMet({ kind }, r); })) ? { kind } : null;
      if (!runs.length) return null;
      if (kind === "coins") { const best = Math.max(...runs.map((r) => r.coinsTaken)); const n = Math.min(best, Math.max(1, floorTo(best * 0.9, 1))); return n >= 5 ? { kind, n } : null; }
      if (kind === "fuel") { const n = round(floorTo(Math.max(...runs.map((r) => r.fuelShare)) * 0.85, 0.05)); return n >= 0.1 ? { kind, n } : null; }
      if (kind === "flat") { const n = round(Math.max(0.3, ceilTo(Math.min(...runs.map((r) => r.bestAir)) + 0.15, 0.1))); return n <= 1 ? { kind, n } : null; }
      if (kind === "air") { const n = round(floorTo(Math.max(...runs.map((r) => r.bestAir)) * 0.85, 0.1)); return n >= 0.5 ? { kind, n } : null; }
      if (kind === "speed") { const n = Math.floor(Math.max(...runs.map((r) => r.topSpeed)) * 0.95); return n >= 8 ? { kind, n } : null; }
      if (kind === "calm") {
        const seen = runs.filter((r) => r.featMax[arg] != null);
        if (!seen.length) return null;
        const c = { kind, feature: arg, n: round(ceilTo(Math.min(...seen.map((r) => r.featMax[arg])) + 0.5, 0.5)) };
        if (arg === "slick" && region === "market") c.wet = true;
        return c;
      }
      return null;
    };
    let pick = null;
    for (const spec of [wanted].concat(FALLBACK)) { pick = tryKind(spec); if (pick) break; }
    table[d.id] = pick;
    console.log(d.id.padEnd(12), wanted.padEnd(14), pick ? SH.challengeText(pick) : "NONE");
  }
  // Check: every challenge is met by at least one bot run.
  Object.assign(SH.CHALLENGES, table);
  let bad = 0;
  for (const d of SH.DELIVERIES.concat(SH.SIDE)) {
    const c = table[d.id]; if (!c) { bad++; continue; }
    const truck = c.kind === "truck" ? c.truck : "pickup", noBrake = c.kind === "nobrake";
    if (!(noBrake ? COASTS : [0]).some((coastFrom) => speeds.some((v) => SH.challengeMet(c, drive(d.id, levelFor[d.id], v, 200, truck, null, false, { noBrake, coastFrom }))))) { bad++; console.log("NOT MET", d.id, SH.challengeText(c)); }
  }
  console.log("challenges", Object.values(table).filter(Boolean).length, "of", SH.DELIVERIES.length + SH.SIDE.length, "unmet", bad);
  if (process.argv.includes("--write") && !bad) {
    const fs = require("fs"), path = require("path"), file = path.join(__dirname, "..", "engine.js");
    const body = "  var CHALLENGES = {\n" + Object.entries(table).map(([id, c]) => "    " + JSON.stringify(id) + ": " + JSON.stringify(c)).join(",\n") + "\n  };";
    const src = fs.readFileSync(file, "utf8").replace(/(\/\/ CHALLENGES-BEGIN\n)[\s\S]*?(\n  \/\/ CHALLENGES-END)/, "$1" + body + "$2");
    fs.writeFileSync(file, src);
    console.log("written to engine.js");
  }
  process.exitCode = bad ? 1 : 0;
}

// Writes Dash Dalloway's runs: for each route, the clean bot run (two stars or
// more, no wall hit) closest to halfway between gold and silver, at an upgrade level
// a player would have by that region.
function rivals() {
  const table = {};
  let bad = 0;
  for (const d of SH.DELIVERIES.concat(SH.SIDE)) {
    let pick = null;
    for (let L = d.track === "extra" ? 2 : [1, 2, 3, 4, 5, 5][d.region]; L <= 5 && !pick; L++) {
      const up = SH.rivalUpgrades(L);
      for (const v of [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 9, 10]) {
        const r = drive(d.id, up, v, 200);
        if (r.status !== "done" || r.stars < 2 || r.dockHit || r.time < r.medals.gold) continue;
        const aim = (r.medals.gold + r.medals.silver) / 2;
        if (!pick || Math.abs(r.time - aim) < Math.abs(pick.t - aim)) pick = { v, L, t: Math.round(r.time * 10) / 10, gold: r.medals.gold, silver: r.medals.silver };
      }
    }
    if (!pick) bad++;
    else table[d.id] = { v: pick.v, L: pick.L, t: pick.t };
    console.log(d.id.padEnd(12), pick ? `speed ${pick.v} level ${pick.L} time ${pick.t}s (gold ${pick.gold}, silver ${pick.silver})` : "NONE");
  }
  console.log("rivals", Object.keys(table).length, "of", SH.DELIVERIES.length + SH.SIDE.length);
  if (process.argv.includes("--write")) {
    const fs = require("fs"), path = require("path"), file = path.join(__dirname, "..", "engine.js");
    const body = "  var RIVALS = {\n" + Object.entries(table).map(([id, c]) => "    " + JSON.stringify(id) + ": " + JSON.stringify(c)).join(",\n") + "\n  };";
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/(\/\/ RIVALS-BEGIN\n)[\s\S]*?(\n  \/\/ RIVALS-END)/, "$1" + body + "$2"));
    console.log("written to engine.js");
  }
  process.exitCode = bad ? 1 : 0;
}

// Every Special Order must be deliverable with two stars by the bot, at the
// upgrade level a player would have when the order opens.
function orders() {
  let bad = 0;
  for (const o of SH.ORDERS) {
    const L = Math.min(5, 1 + o.region + (o.slot >= 3 ? 1 : 0) + (o.slot === 4 ? 1 : 0)), up = SH.rivalUpgrades(L), truck = o.truck || "pickup";
    const runs = [3, 4, 5, 6.5, 8].map((v) => drive(null, up, v, 240, truck, o));
    const best = runs.filter((r) => r.status === "done").sort((a, b) => b.stars - a.stars || a.time - b.time)[0];
    const pass = best && best.stars >= 2;
    if (!pass) bad++;
    console.log(o.id.padEnd(18), o.twist.padEnd(8), ("L" + L).padEnd(4), runs.map((r) => cell(r, 12)).join(""), pass ? "" : "FAIL");
  }
  console.log("orders failing", bad);
  process.exitCode = bad ? 1 : 0;
}

// ════ The opening: gas-only and learner drivers on the roads built for new players ═
const stopAt = (g) => { const t = g.terrain, x = g.truck.getPosition().x; return g.pickupState === "ahead" ? (g.pickup.x0 + g.pickup.x1) / 2 - x : (t.zoneStart + t.zoneEnd) / 2 - x; };
// Holds GAS, and brakes only for a stop.
const gasOnly = (k = 1) => () => (g) => { const s = stopAt(g), v = g.speed(), need = (v * v / 10 + 2) * k; return s < need ? { gas: v < 0.5 && s > 1.5, brake: v > 0.3 } : { gas: true, brake: false }; };
// Lifts off when the road ahead drops away, `delay` steps late, and does nothing in the air.
const learner = (cap, delay) => () => {
  const q = [];
  return (g) => {
    const t = g.terrain, p = g.truck.getPosition(), v = g.speed(), h = (x) => SH.heightAt(t, x);
    const s1 = (h(p.x + 2) - h(p.x)) / 2, ah = 3 + v * 0.8, s2 = (h(p.x + ah + 2) - h(p.x + ah)) / 2, s = stopAt(g);
    let i = { gas: true, brake: false };
    // Pulling up: brake to a walking pace that shrinks with the distance left, then creep in.
    if (s < v * v / 10 + 3) i = { gas: v < Math.min(2.5, 0.4 + s * 0.35) && s > 0.6, brake: v > 0.6 + s * 0.45 };
    else if (!g.grounded()) i = { gas: false, brake: false };
    else if (s2 - s1 < -0.22 && v > cap) i = { gas: false, brake: v > cap + 2 };
    q.push(i);
    return q.length > delay ? q.shift() : { gas: true, brake: false };
  };
};
const careful = (v) => () => (g) => SH.botInput(g, v);
const LEARNERS = [[6.5, 12], [6, 10], [5, 8]];
function play(delivery, driver, upgrades, truck, seconds = 200) {
  const g = SH.createGame({ delivery, upgrades, truck }), f = driver(g);
  for (let n = 0; g.status === "driving" && n < seconds * 60; n++) g.step(f(g));
  if (g.status === "driving") { g.status = "failed"; g.reason = "timeout"; }
  return SH.report(g);
}
function opening() {
  let bad = 0;
  const straps1 = Object.assign({}, base, { straps: 1 }), straps2 = Object.assign({}, base, { straps: 2 });
  for (const d of SH.DELIVERIES.filter((x) => SH.ROADS[x.id])) {
    const n = d.index + 1, bakery = d.region === 0;
    // The upgrade level a player has on arriving in each region (deliberately low).
    const up = !bakery ? SH.rivalUpgrades([0, 1, 2, 3, 4, 5][d.region]) : n < 4 ? base : n < 8 ? straps1 : straps2;
    const gas = [gasOnly(), gasOnly(0.85)].map((f) => play(d, f, up)), learn = LEARNERS.map(([c, w]) => play(d, learner(c, w), up)), calm = [4.5, 5.5, 6.5].map((v) => play(d, careful(v), up));
    const two = (list) => list.filter((r) => r.stars >= 2).length, air = Math.max(...learn.map((r) => r.bestAir)), fails = [];
    if (gas.some((r) => r.stars > (n === 1 ? 2 : 1))) fails.push("gas only too good");
    if (gas.some((r) => r.medal === 3)) fails.push("gas only wins gold");
    if (two(learn) < 2) fails.push("learners");
    if (two(calm) < 2) fails.push("careful");
    if (air < 0.4) fails.push("no air");
    if (SH.createGame({ delivery: d }).terrain.features.filter((f) => f.set && f.type === "ramp").length !== (d.ramps || []).length) fails.push("a ramp was dropped");
    if (fails.length) bad++;
    const c = (r) => cell(r, 11);
    console.log(d.id.padEnd(10), "gas", gas.map(c).join(""), "learner", learn.map(c).join(""), "careful", calm.map(c).join(""), "air " + air.toFixed(1), fails.join(", "));
  }
  console.log("openers failing", bad);
  process.exitCode = bad ? 1 : 0;
}

// Gold times from the bots, see MEDALS in engine.js.
function medals() {
  const table = {};
  for (const d of SH.DELIVERIES.concat(SH.SIDE)) {
    const up = d.side ? SH.rivalUpgrades(d.track === "extra" ? 2 : 1) : d.region === 0 ? Object.assign({}, base, { straps: d.index < 3 ? 0 : d.index < 5 ? 1 : 2 }) : SH.rivalUpgrades(Math.min(5, 1 + d.region));
    const runs = [];
    for (let v = 4; v <= 12; v += 0.5) runs.push(play(d, careful(v), up));
    for (const [c, w] of LEARNERS.concat([[7.5, 8], [8.5, 8], [10, 8]])) runs.push(play(d, learner(c, w), up));
    const clean = runs.filter((r) => r.status === "done" && r.stars === 3 && !r.dockHit), best = Math.min(...clean.map((r) => r.time)), par = SH.parTime(d);
    const gold = clean.length ? Math.ceil(best * 1.08) : 0;
    if (gold && gold < par) table[d.id] = gold;
    console.log(d.id.padEnd(12), "old", String(par).padStart(3), "clean best", clean.length ? best.toFixed(1) : "none", table[d.id] ? "gold " + table[d.id] : "keeps " + par);
  }
  console.log("new gold times", Object.keys(table).length, "of", SH.DELIVERIES.length + SH.SIDE.length);
  if (process.argv.includes("--write")) writeBlock("MEDALS", "  var MEDALS = " + JSON.stringify(table).replace(/,/g, ", ").replace(/:/g, ": ") + ";");
}
function writeBlock(name, body) {
  const fs = require("fs"), path = require("path"), file = path.join(__dirname, "..", "engine.js");
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(new RegExp("(// " + name + "-BEGIN\\n)[\\s\\S]*?(\\n  // " + name + "-END)"), (_, a, b) => a + body + b));
  console.log("written to engine.js");
}

// The World Tour Daily pool: per region, the truck with the most roads every driver
// can manage, and the roads themselves. A road passes when two learners and two
// careful runs get two stars, and nobody flips.
function dailyPool() {
  const want = Number(process.env.POOL || 24), trucks = [], pool = [];
  SH.REGIONS.forEach((region, r) => {
    const up = SH.rivalUpgrades(SH.DAILY_LEVEL[r]);
    const passes = (k, truck) => {
      const d = Object.assign(SH.dailyRoad(r, k), { id: "daily-test", truck });
      if (d.len === 300 && k % 6 === 5) return false;
      const calm = [4.5, 5.5, 6.5].map((v) => play(d, careful(v), up, truck, 150));
      if (calm.filter((x) => x.stars >= 2).length < 2) return false;
      const learn = LEARNERS.map(([c, w]) => play(d, learner(c, w), up, truck, 150));
      return learn.filter((x) => x.stars >= 2).length >= 2 && !calm.concat(learn).some((x) => x.reason === "flip");
    };
    const options = r === 0 ? ["pickup", "tuktuk"] : SH.TRUCKS.map((t) => t.id).filter((id) => id !== "pickup" && id !== "tuktuk");
    const scores = options.map((id) => { let n = 0; for (let k = 0; k < 12; k++) if (passes(k, id)) n++; return { id, n }; }).sort((a, b) => b.n - a.n);
    const truck = process.env["TRUCK" + r] || scores[0].id, list = [];
    for (let k = 0; k < 400 && list.length < want; k++) if (passes(k, truck)) list.push(k);
    trucks.push(truck); pool.push(list);
    console.log(region.id.padEnd(9), scores.map((s) => s.id + " " + s.n).join(", "), "->", truck, list.length, "roads");
  });
  if (process.argv.includes("--write")) writeBlock("DAILY", "  var DAILY_TRUCK = " + JSON.stringify(trucks) + ",\n    DAILY_POOL = " + JSON.stringify(pool) + ";");
}

// Test Drives: learners get two stars on most runs, nobody flips (a bad taster
// costs more than none), in the loaner truck at its set level.
function testDrives() {
  let bad = 0;
  for (const t of SH.TEST_DRIVES) {
    const up = SH.rivalUpgrades(t.level);
    const learn = LEARNERS.map(([c, w]) => play(t, learner(c, w), up, t.truck)), calm = [4.5, 5.5, 6.5].map((v) => play(t, careful(v), up, t.truck));
    const fails = [];
    if (learn.filter((r) => r.stars >= 2).length < 2) fails.push("learners");
    if (calm.filter((r) => r.stars >= 2).length < 2) fails.push("careful");
    if (learn.concat(calm).some((r) => r.reason === "flip")) fails.push("a flip");
    if (fails.length) bad++;
    console.log(t.id.padEnd(14), t.truck.padEnd(8), "L" + t.level, "learner", learn.map((r) => cell(r, 11)).join(""), "careful", calm.map((r) => cell(r, 11)).join(""), fails.join(", "));
  }
  console.log("test drives failing", bad, "of", SH.TEST_DRIVES.length);
  process.exitCode = bad ? 1 : 0;
}

// Top-Up Run: the careful bot reaches stop 5 on the bare truck and stop 10 at
// level 5, over three days' roads, so the mode is fair every day.
function topup() {
  let bad = 0;
  for (const [L, want] of [[0, 5], [5, 10]]) {
    let best = 0;
    for (const day of ["2026-12-01", "2026-12-02", "2026-12-03"]) for (const v of [3.5, 4, 5, 6]) best = Math.max(best, play(SH.topUpRun(0, day), careful(v), SH.rivalUpgrades(L), "pickup", 500).stops);
    if (best < want) bad++;
    console.log("level " + L, "best stop " + best, best >= want ? "ok" : "BELOW " + want);
  }
  process.exitCode = bad ? 1 : 0;
}

// Lucky Lasso: it fires once on a run that drops a load, and a recorded run
// with a lasso armed replays exactly (ghosts store the lasso).
function lasso() {
  let bad = 0;
  for (const id of ["bakery-4", "bakery-6", "bakery-8", "dunes-2", "harbour-3"]) {
    const opts = { id, upgrades: SH.rivalUpgrades(1), lasso: true }, g = SH.createGame(opts);
    for (let n = 0; g.status === "driving" && n < 12000; n++) g.step(gasOnly()()(g));
    const a = SH.report(g), b = SH.ghostPath(opts, g.rec).report;
    const ok = a.lassoUsed && a.kept === b.kept && Math.abs(a.time - b.time) < 1e-9 && b.lassoUsed;
    if (!ok) bad++;
    console.log(id.padEnd(11), ok ? "fired, replays exactly" : "FAILED", a.status, a.kept + "/" + a.total);
  }
  process.exitCode = bad ? 1 : 0;
}

// Side roads (Back Roads, Extra Mile) and Old Crust's orders. A player reaches
// Back Roads with about 8 Bakery stars, so drivers use level 1 upgrades there and
// level 2 on the Extra Mile. Targets: learners 2 stars on most roads, careful
// drivers 2 stars, no flips for either, gas-only no clean 3 stars, and
// every road with ducks, hay or a seesaw replays exactly from its recording.
function side() {
  let bad = 0;
  const roads = SH.SIDE.concat(SH.ORDERS.filter((o) => o.track));
  for (const d of roads) {
    const L = d.track === "extra" ? 2 : 1, up = SH.rivalUpgrades(L);
    const learn = LEARNERS.map(([c, w]) => play(d, learner(c, w), up, d.truck || "pickup"));
    const calm = [4.5, 5.5, 6.5].map((v) => play(d, careful(v), up, d.truck || "pickup"));
    const gas = play(d, gasOnly(), up, d.truck || "pickup");
    const fails = [];
    if (learn.filter((r) => r.stars >= 2).length < 2) fails.push("learners");
    if (calm.filter((r) => r.stars >= 2).length < 2) fails.push("careful");
    if (learn.concat(calm).some((r) => r.reason === "flip")) fails.push("a flip");
    // Holding gas may keep the load where the ducks are the test: they cost it time.
    if (gas.stars === 3 && !gas.honks && !d.order) fails.push("gas-only 3*");
    // Ghost replay: the moving parts must give the same run twice.
    const moving = (d.feats || []).some((f) => f.type === "ducks" || f.type === "hay" || f.type === "seesaw");
    if (moving) {
      const g = SH.createGame({ delivery: d, upgrades: up, truck: d.truck || "pickup" }), f = learner(6, 10)(g);
      for (let n = 0; g.status === "driving" && n < 200 * 60; n++) g.step(f(g));
      const a = SH.report(g), b = SH.ghostPath({ delivery: d, upgrades: up, truck: d.truck || "pickup" }, g.rec).report;
      if (!(a.status === b.status && a.kept === b.kept && Math.abs(a.time - b.time) < 1e-9 && a.honks === b.honks && a.coinsTaken === b.coinsTaken)) fails.push("GHOST DIFFERS");
    }
    if (fails.length) bad++;
    const honks = calm.concat(learn).reduce((n, r) => n + r.honks, 0);
    console.log(d.id.padEnd(13), "L" + L, "learner", learn.map((r) => cell(r, 11)).join(""), "careful", calm.map((r) => cell(r, 11)).join(""), "gas", cell(gas, 11), "t" + Math.round(calm[1].time), "honks " + honks, fails.join(", "));
  }
  console.log("side roads failing", bad, "of", roads.length);
  process.exitCode = bad ? 1 : 0;
}

const mode = process.argv[2];
if (mode === "career") career();
else if (mode === "late") late();
else if (mode === "trucks") trucks();
else if (mode === "long") long();
else if (mode === "ghost") ghost();
else if (mode === "trace") trace();
else if (mode === "challenges") challenges();
else if (mode === "rivals") rivals();
else if (mode === "orders") orders();
else if (mode === "opening") opening();
else if (mode === "medals") medals();
else if (mode === "daily") dailyPool();
else if (mode === "testdrives") testDrives();
else if (mode === "topup") topup();
else if (mode === "lasso") lasso();
else if (mode === "side") side();
else if (["winter","northpole","advent","sleigh","workshop"].includes(mode)) {
  import("./check-winter.mjs").catch((error) => { console.error(error); process.exitCode=1; });
}
else table("Base truck, no upgrades", base, [4.5, 6, 8]);
