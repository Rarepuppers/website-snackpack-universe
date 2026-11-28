// Speed check, a stand-in for a cheap phone until a real-device check: the bot
// plays with the CPU slowed 4x while big crumb bursts go off every half second
// (the worst case for effects) in a crate of 26 or more snacks, and the main-thread time of every frame is
// measured (physics, effects and issuing the draw; the GPU is not measured,
// because headless Chrome draws in software).
// Fails if more than 2% of frames take over 16 ms.
//   node play/labs/snack-drop/dev/perf.mjs [seconds]
import { open } from "./browser.mjs";

const seconds = Number(process.argv[2]) || 40;
const { page, ctx, base, errors, close } = await open();
await page.goto(base + "?bot=1&perf=1");
await page.waitForFunction(() => window.__snackdrop && window.__snackdrop.perf);
// Fill the crate first at full speed, so the measured part has a busy pile.
const filled = await page.evaluate(() => {
  const SD = window.SnackDrop, g = window.__snackdrop.game, r = SD.rng(5);
  for (let i = 0; i < 60 * 600 && g.status === "playing" && g.snacks.length < 26; i++) g.step({ drop: g.canDrop() && g.snacks.every((s) => s.landed) ? SD.botAim(g, "careful", r) : null });
  return g.snacks.length;
});
if (filled < 20) { console.error("could not fill the crate (" + filled + ")"); process.exit(2); }
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await page.evaluate(() => { window.__snackdrop.perf.length = 0; });
await page.evaluate(() => { setInterval(() => window.__snackdrop.view.burst(0, 5, "#f2c14e", 60), 500); });
await page.waitForTimeout(seconds * 1000);
const t = await page.evaluate(() => window.__snackdrop.perf.slice(10));
const snacks = await page.evaluate(() => window.__snackdrop.game.snacks.length), status = await page.evaluate(() => window.__snackdrop.game.status);
const sorted = [...t].sort((a, b) => a - b), at = (p) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
const over = t.filter((x) => x > 16).length / t.length;
console.log(`${t.length} frames at 4x CPU slowdown, ${snacks} snacks at the end, game ${status} (software drawing caps the frame rate, so count the time per frame, not the frames)`);
console.log(`main thread per frame: median ${at(0.5).toFixed(1)} ms, p95 ${at(0.95).toFixed(1)} ms, p98 ${at(0.98).toFixed(1)} ms, worst ${sorted[sorted.length - 1].toFixed(1)} ms`);
console.log(`frames over 16 ms: ${(over * 100).toFixed(1)}%`);
console.log(errors.length ? "errors:\n" + errors.join("\n") : "no page errors");
await close();
const ok = over <= 0.02 && !errors.length;
console.log(ok ? "perf: OK" : "perf: FAIL");
process.exit(ok ? 0 : 1);
