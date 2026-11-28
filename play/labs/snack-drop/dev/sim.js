// Plays whole games with bots through the real physics.
// node play/labs/snack-drop/dev/sim.js            careful and random bots, 40 games each
// node play/labs/snack-drop/dev/sim.js 100 [id]   more games, in one container (default pantry)
// node play/labs/snack-drop/dev/sim.js band       every container inside the bot band
// node play/labs/snack-drop/dev/sim.js same       the same seed and drops must give the same game
// node play/labs/snack-drop/dev/sim.js restore    a saved snapshot puts the crate back exactly and plays on (resume)
// node play/labs/snack-drop/dev/sim.js shakes     200 shakes: none ends a game, no snack leaves the crate
// node play/labs/snack-drop/dev/sim.js replay     a saved drop log replays to exactly the same crate (resume)
// BAL='{"dropGap":0.6}' overrides BALANCE for tuning.
// "Minutes" assumes a person takes about 2 seconds per drop (aiming plus watching).
const SD = require("../engine.js");
if (process.env.BAL) Object.assign(SD.BALANCE, JSON.parse(process.env.BAL));

function play(seed, style, container, mode = "classic", maxDrops = 2000, tools = false) {
  const g = SD.createGame({ seed, container, mode });
  const rand = SD.rng(seed * 7 + 3);
  let frames = 0;
  while (g.status === "playing" && g.drops < maxDrops && frames < 60 * 60 * 120) {
    frames++;
    // Wait for the pile to settle a little, like a person watching the last drop.
    const settled = g.snacks.every((s) => s.landed);
    const ready = g.canDrop() && (settled || g.wait < -0.6);
    const tool = tools && ready ? SD.botTool(g) : null;
    const drop = ready && !tool ? SD.botAim(g, style, rand) : null;
    g.step({ drop, tool });
  }
  return { toolsUsed: g.toolsUsed, score: g.score, drops: g.drops, best: g.best, made: g.made, time: g.time, fevers: g.fevers, maxChain: g.maxChain };
}

function pct(list, p) { const s = [...list].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; }

const arg = process.argv[2];
if (arg === "shakes") {
  // PLAN 20 step 6: across 200 shakes, no game ends during a shake or its
  // guard, and no snack ever leaves the crate. Bots play Arcade and are handed
  // a shake every few seconds.
  const kinds = ["rumble", "bump", "quake"];
  let shakes = 0, endedInGuard = 0, escaped = 0, games = 0;
  const merged = { rumble: 0, bump: 0, quake: 0 }, count = { rumble: 0, bump: 0, quake: 0 };
  for (let k = 1; shakes < 200 && k < 400; k++) {
    const seed = k * 271, container = SD.CONTAINER_ORDER[k % 4], g = SD.createGame({ seed, container, mode: "arcade" }), rand = SD.rng(seed);
    games++;
    for (let st = 0; g.status === "playing" && st < 60 * 600 && shakes < 200; st++) {
      let tool = null;
      if (st % 240 === 120 && !g.shake && g.time - g.lastDrop >= SD.SHAKE.gap) {
        const kind = kinds[shakes % 3];
        g.tray.length = 0; g.tray.push(kind);
        tool = { id: kind, target: kind === "bump" ? (rand() < 0.5 ? "l" : "r") : undefined };
      }
      const ready = !tool && g.canDrop() && g.snacks.every((s) => s.landed);
      const before = g.shake, m0 = g.merges;
      g.step({ tool, drop: ready ? SD.botAim(g, "careful", rand) : null });
      if (!before && g.shake) { shakes++; count[g.shake.kind]++; }
      if (g.shake && !ready) merged[g.shake.kind] += g.merges - m0;
      if (g.status === "over" && (g.shake || g.guard > 0)) endedInGuard++;
      for (const s of g.snacks) { const p = s.body.getPosition(); if (Math.abs(p.x) > SD.CRATE.half + 0.4 || p.y < -0.5 || p.y > SD.CRATE.height + 1) { escaped++; break; } }
    }
  }
  console.log(`${shakes} shakes in ${games} games: ${endedInGuard} games ended during a shake or its guard, ${escaped} steps with a snack outside the crate`);
  console.log("merges during the shake itself, per shake: " + Object.keys(count).map((k) => `${k} ${(merged[k] / Math.max(1, count[k])).toFixed(2)}`).join(", "));
  const ok = shakes >= 200 && !endedInGuard && !escaped;
  console.log(ok ? "shakes: OK" : "shakes: FAIL");
  process.exit(ok ? 0 : 1);
}
if (arg === "restore") {
  // Resume restores a snapshot. Check it puts the crate back exactly, survives
  // JSON, and plays on without errors or snacks flying off.
  let bad = 0;
  for (let k = 1; k <= 12; k++) {
    const seed = k * 613, container = SD.CONTAINER_ORDER[k % SD.CONTAINER_ORDER.length], g = SD.createGame({ seed, container }), rand = SD.rng(seed);
    const cut = 600 + Math.floor(rand() * 15000);
    for (let step = 0; g.status === "playing" && step < cut; step++) {
      const drop = g.canDrop() && (g.snacks.every((s) => s.landed) || g.wait < -0.6) ? SD.botAim(g, "careful", rand) : null;
      g.step({ drop });
    }
    if (g.status !== "playing") continue;
    const snap = JSON.parse(JSON.stringify(g.snapshot()));
    const r = SD.createGame({ seed, container: snap.container, restore: snap });
    const exact = r.score === g.score && r.next === g.next && r.current === g.current && r.snacks.length === g.snacks.length &&
      r.snacks.every((s, j) => { const a = s.body.getPosition(), b = g.snacks[j].body.getPosition(); return s.id === g.snacks[j].id && a.x === b.x && a.y === b.y; });
    // Same queue afterwards: the next five drops bring the same snacks.
    const qa = [], qb = [];
    for (let i = 0; i < 5; i++) { qa.push(g.current); qb.push(r.current); g.current = g.next; r.current = r.next; }
    let drift = 0;
    for (let n = 0; n < 300; n++) { g.step({}); r.step({}); }
    r.snacks.forEach((s) => { const o = g.snacks.find((t) => t.id === s.id); if (o) { const a = s.body.getPosition(), b = o.body.getPosition(); drift = Math.max(drift, Math.hypot(a.x - b.x, a.y - b.y)); } });
    const inside = r.snacks.every((s) => { const p = s.body.getPosition(); return Math.abs(p.x) < SD.CRATE.half + 0.1 && p.y > -0.1; });
    const ok = exact && inside && String(qa) === String(qb);
    if (!ok) bad++;
    console.log(`  seed ${seed} ${container}: ${r.snacks.length} snacks, exact ${exact}, queue ${String(qa) === String(qb)}, drift after 5 s ${drift.toFixed(3)} m, inside ${inside}`);
  }
  console.log(bad ? `restore: ${bad} FAILED` : "restore: OK");
  process.exit(bad ? 1 : 0);
}
if (arg === "replay") {
  // Resume works by replaying the saved drops (step number and x) on a fresh
  // game with the same seed. Play bot games, cut each at a random point, replay
  // the log to that point and require every snack in exactly the same place.
  let bad = 0, worstMs = 0;
  for (let k = 1; k <= 12; k++) {
    const seed = k * 977, g = SD.createGame({ seed }), rand = SD.rng(seed), log = [];
    const cut = 600 + Math.floor(rand() * 20000);
    let step = 0;
    while (g.status === "playing" && step < cut) {
      const settled = g.snacks.every((s) => s.landed);
      let drop = null;
      if (g.canDrop() && (settled || g.wait < -0.6)) { drop = SD.botAim(g, "careful", rand); log.push([step, drop]); }
      g.step({ drop }); step++;
    }
    const t0 = process.hrtime.bigint();
    const r = SD.createGame({ seed }); let i = 0;
    for (let n = 0; n < step; n++) { let drop = null; if (i < log.length && log[i][0] === n) drop = log[i++][1]; r.step({ drop }); }
    const ms = Number(process.hrtime.bigint() - t0) / 1e6; worstMs = Math.max(worstMs, ms);
    const same = r.score === g.score && r.drops === g.drops && r.snacks.length === g.snacks.length && r.snacks.every((s, j) => {
      const a = s.body.getPosition(), b = g.snacks[j].body.getPosition();
      return s.tier === g.snacks[j].tier && a.x === b.x && a.y === b.y && s.body.getAngle() === g.snacks[j].body.getAngle();
    });
    if (!same) bad++;
    console.log(`  seed ${seed}: ${step} steps, ${g.drops} drops, ${g.status}, replay ${ms.toFixed(0)} ms, ${same ? "same" : "DIFFERENT"}`);
  }
  console.log(bad ? `replay: ${bad} DIFFERENT` : `replay: OK (slowest ${worstMs.toFixed(0)} ms in Node)`);
  process.exit(bad ? 1 : 0);
}
if (arg === "same") {
  const a = play(42, "careful"), b = play(42, "careful");
  const ok = a.score === b.score && a.drops === b.drops;
  console.log(ok ? "same: OK" : "same: DIFFERENT", a.score, b.score, a.drops, b.drops);
  process.exit(ok ? 0 : 1);
}
// node dev/sim.js band [n]   every container: the careful bot's median must sit
// inside 150 to 280 drops, the random bot must stay clearly worse (PLAN 4a), and
// Pro must be clearly shorter than Classic (under 90%) but at least 60 drops.
if (arg === "band") {
  const n = Number(process.argv[3]) || 30;
  let bad = 0;
  for (const id of SD.CONTAINER_ORDER) {
    const runs = (style, mode) => Array.from({ length: n }, (_, i) => play(i * 101, style, id, mode));
    const cr = runs("careful", "classic"), pr = runs("careful", "pro");
    const c = pct(cr.map((x) => x.drops), 0.5), r = pct(runs("random", "classic").map((x) => x.drops), 0.5), p = pct(pr.map((x) => x.drops), 0.5);
    // Pro must be clearly harder, but still a game a good player can play.
    const ok = c >= 150 && c <= 280 && r <= c * 0.8 && p < c * 0.9 && p >= 60;
    if (!ok) bad++;
    const fev = (cr.reduce((a, x) => a + x.fevers, 0) / n).toFixed(1), sc = pct(cr.map((x) => x.score), 0.5);
    console.log(`  ${id.padEnd(10)} careful ${c}  random ${r}  pro ${p}   classic score median ${sc}, fevers per game ${fev}  ${ok ? "in band" : "OUT OF BAND"}`);
  }
  // Arcade: the bot that uses its tools must last longer than one that doesn't.
  for (const id of SD.CONTAINER_ORDER) {
    const plain = Array.from({ length: n }, (_, i) => play(i * 101, "careful", id, "arcade"));
    const tooled = Array.from({ length: n }, (_, i) => play(i * 101, "careful", id, "arcade", 2000, true));
    const a = pct(plain.map((x) => x.drops), 0.5), t = pct(tooled.map((x) => x.drops), 0.5), used = (tooled.reduce((s, x) => s + x.toolsUsed, 0) / n).toFixed(1);
    const ok = t > a;
    if (!ok) bad++;
    console.log(`  ${id.padEnd(10)} arcade careful ${a}  with tools ${t} (${used} tools a game)  ${ok ? "tools help" : "TOOLS DON'T HELP"}`);
  }
  console.log(bad ? `band: ${bad} check(s) failed` : "band: OK");
  process.exit(bad ? 1 : 0);
}
const n = Number(arg) || 40;
const only = process.argv[3];
for (const id of only ? [only] : ["pantry"]) for (const style of ["careful", "random"]) {
  const runs = [];
  for (let i = 1; i <= n; i++) runs.push(play(i * 101, style, id));
  const drops = runs.map((r) => r.drops), scores = runs.map((r) => r.score);
  const reach = SD.TIERS.map((t, i) => runs.filter((r) => r.best >= i).length);
  console.log(`\n${id} ${style}: ${n} games`);
  console.log(`  drops   median ${pct(drops, 0.5)}  p10 ${pct(drops, 0.1)}  p90 ${pct(drops, 0.9)}   ≈ ${(pct(drops, 0.5) * 2 / 60).toFixed(1)} min for a person`);
  console.log(`  score   median ${pct(scores, 0.5)}  p90 ${pct(scores, 0.9)}  max ${Math.max(...scores)}`);
  console.log("  reached " + SD.TIERS.map((t, i) => `${t.id} ${Math.round(100 * reach[i] / n)}%`).slice(4).join("  "));
}
