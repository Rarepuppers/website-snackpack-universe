// Drives deliveries with bot drivers through the real physics.
// node play/labs/snack-haul/dev/sim.js            base truck, all routes
// node play/labs/snack-haul/dev/sim.js career     one player from start to finish
// node play/labs/snack-haul/dev/sim.js late       upgrades must keep helping
// node play/labs/snack-haul/dev/sim.js trucks     every truck on sample routes
const SH = require("../engine.js");

if (process.env.BAL) Object.assign(SH.BALANCE, JSON.parse(process.env.BAL));

// target = cruising speed. A careful driver slows for crests and dips ahead.
function drive(id, upgrades, target, maxSeconds, truck) {
  const g = SH.createGame({ id, upgrades, truck });
  const t = g.terrain;
  let frames = 0;
  while (g.status === "driving" && frames < maxSeconds * 60) {
    frames++;
    const pos = g.truck.getPosition();
    const vx = g.truck.getLinearVelocity().x;
    const angle = SH.normalAngle(g.truck.getAngle());
    const toZone = (t.zoneStart + t.zoneEnd) / 2 - pos.x;
    const ahead = 5 + vx;
    const s1 = (SH.heightAt(t, pos.x + 2) - SH.heightAt(t, pos.x)) / 2;
    const s2 = (SH.heightAt(t, pos.x + ahead + 2) - SH.heightAt(t, pos.x + ahead)) / 2;
    let want = target - Math.min(target * 0.55, Math.abs(s2 - s1) * 9);
    if (toZone < 40) want = Math.min(want, Math.max(0.1, toZone * 0.28));
    const input = { gas: false, brake: false };
    if (!g.grounded()) {
      if (angle > 0.14) input.brake = true;
      else if (angle < -0.14) input.gas = true;
    } else if (toZone < 1 && vx > 0.2) input.brake = true;
    else if (toZone < 0.5) input.brake = false;
    else if (vx < want) input.gas = true;
    else if (vx > want + 1.6) input.brake = true;
    g.step(input);
  }
  if (g.status === "driving") { g.status = "failed"; g.reason = "timeout:" + Math.round(g.truck.getPosition().x) + "/" + Math.round(t.total); }
  return SH.report(g);
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
  let coins = 0, attempts = 0;
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
    console.log(d.id.padEnd(12), best ? "*".repeat(best.stars).padEnd(4) : "STUCK", `tries ${String(tries).padStart(2)}  coins ${String(coins).padStart(4)}  ` + Object.keys(up).map((k) => k[0] + up[k]).join(" "));
    if (!best) return;
  }
  console.log("attempts", attempts);
}

function late() {
  for (const lvl of [2, 3, 5]) {
    const u = { engine: lvl, suspension: lvl, tyres: lvl, straps: lvl, tank: lvl };
    console.log("\nAll upgrades level " + lvl);
    for (const id of ["dunes-6", "frost-4", "frost-6", "chilli-3", "chilli-5", "chilli-6"]) {
      console.log(id.padEnd(10) + [3, 4, 5, 6.5, 8].map((v) => cell(drive(id, u, v, 200), 13)).join(""));
    }
  }
}

function trucks() {
  const lvl = 2;
  const u = { engine: lvl, suspension: lvl, tyres: lvl, straps: lvl, tank: lvl };
  for (const t of SH.TRUCKS) {
    console.log("\n" + t.name);
    for (const id of ["bakery-4", "dunes-4", "frost-3", "chilli-2"]) {
      console.log(id.padEnd(10) + [4, 5.5, 7, 9].map((v) => cell(drive(id, u, v, 200, t.id), 13)).join(""));
    }
  }
}

const mode = process.argv[2];
if (mode === "career") career();
else if (mode === "late") late();
else if (mode === "trucks") trucks();
else table("Base truck, no upgrades", base, [4.5, 6, 8]);
