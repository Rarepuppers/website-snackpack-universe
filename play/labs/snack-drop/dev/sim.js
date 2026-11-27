// Plays whole games with bots through the real physics.
// node play/labs/snack-drop/dev/sim.js            careful and random bots, 40 games each
// node play/labs/snack-drop/dev/sim.js 100        more games
// node play/labs/snack-drop/dev/sim.js same       the same seed and drops must give the same game
// BAL='{"dropGap":0.6}' overrides BALANCE for tuning.
// "Minutes" assumes a person takes about 2 seconds per drop (aiming plus watching).
const SD = require("../engine.js");
if (process.env.BAL) Object.assign(SD.BALANCE, JSON.parse(process.env.BAL));

function play(seed, style, maxDrops = 2000) {
  const g = SD.createGame({ seed });
  const rand = SD.rng(seed * 7 + 3);
  let frames = 0;
  while (g.status === "playing" && g.drops < maxDrops && frames < 60 * 60 * 120) {
    frames++;
    // Wait for the pile to settle a little, like a person watching the last drop.
    const settled = g.snacks.every((s) => s.landed);
    const drop = g.canDrop() && (settled || g.wait < -0.6) ? SD.botAim(g, style, rand) : null;
    g.step({ drop });
  }
  return { score: g.score, drops: g.drops, best: g.best, made: g.made, time: g.time };
}

function pct(list, p) { const s = [...list].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; }

const arg = process.argv[2];
if (arg === "same") {
  const a = play(42, "careful"), b = play(42, "careful");
  const ok = a.score === b.score && a.drops === b.drops;
  console.log(ok ? "same: OK" : "same: DIFFERENT", a.score, b.score, a.drops, b.drops);
  process.exit(ok ? 0 : 1);
}
const n = Number(arg) || 40;
for (const style of ["careful", "random"]) {
  const runs = [];
  for (let i = 1; i <= n; i++) runs.push(play(i * 101, style));
  const drops = runs.map((r) => r.drops), scores = runs.map((r) => r.score);
  const reach = SD.TIERS.map((t, i) => runs.filter((r) => r.best >= i).length);
  console.log(`\n${style}: ${n} games`);
  console.log(`  drops   median ${pct(drops, 0.5)}  p10 ${pct(drops, 0.1)}  p90 ${pct(drops, 0.9)}   ≈ ${(pct(drops, 0.5) * 2 / 60).toFixed(1)} min for a person`);
  console.log(`  score   median ${pct(scores, 0.5)}  p90 ${pct(scores, 0.9)}  max ${Math.max(...scores)}`);
  console.log("  reached " + SD.TIERS.map((t, i) => `${t.id} ${Math.round(100 * reach[i] / n)}%`).slice(4).join("  "));
}
