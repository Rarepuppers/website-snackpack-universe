// Drives deliveries with bot drivers through the real physics.
// node play/labs/snack-haul/dev/sim.js            base truck, all routes
// node play/labs/snack-haul/dev/sim.js career     one player from start to finish
// node play/labs/snack-haul/dev/sim.js late       upgrades must keep helping
// node play/labs/snack-haul/dev/sim.js trucks     every truck on sample routes
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
  for (const d of SH.DELIVERIES) {
    const region = SH.REGIONS[d.region].id, wanted = CHALLENGE_PLAN[region][d.index];
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
  for (const d of SH.DELIVERIES) {
    const c = table[d.id]; if (!c) { bad++; continue; }
    const truck = c.kind === "truck" ? c.truck : "pickup", noBrake = c.kind === "nobrake";
    if (!(noBrake ? COASTS : [0]).some((coastFrom) => speeds.some((v) => SH.challengeMet(c, drive(d.id, levelFor[d.id], v, 200, truck, null, false, { noBrake, coastFrom }))))) { bad++; console.log("NOT MET", d.id, SH.challengeText(c)); }
  }
  console.log("challenges", Object.values(table).filter(Boolean).length, "of", SH.DELIVERIES.length, "unmet", bad);
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
  for (const d of SH.DELIVERIES) {
    let pick = null;
    for (let L = [1, 2, 3, 4, 5, 5][d.region]; L <= 5 && !pick; L++) {
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
  console.log("rivals", Object.keys(table).length, "of", SH.DELIVERIES.length);
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
else table("Base truck, no upgrades", base, [4.5, 6, 8]);
