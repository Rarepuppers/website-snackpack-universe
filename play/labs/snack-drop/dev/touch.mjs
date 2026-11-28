// Touch check on an emulated phone: a quick tap drops, and a long press
// (hold, drag, release) aims while held and drops on release.
//   node play/labs/snack-drop/dev/touch.mjs
import { createRequire } from "node:module";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "../../../..");
let chromium;
for (const home of [process.env.PLAYWRIGHT_HOME, site].filter(Boolean)) {
  try { ({ chromium } = createRequire(path.join(home, "x.js"))("playwright")); break; } catch { /* next */ }
}
if (!chromium) { console.error("Playwright not found. Set PLAYWRIGHT_HOME."); process.exit(2); }
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = http.createServer((req, res) => {
  const file = path.join(site, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(site) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({ viewport: { width: 412, height: 860 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.route(/cloudflareinsights/, (r) => r.fulfill({ contentType: "text/javascript", body: "" }));
await page.goto(`http://127.0.0.1:${server.address().port}/play/labs/snack-drop/index.html`);
await page.waitForFunction(() => window.__snackdrop && window.__snackdrop.game);
await page.tap("text=Play");
await page.waitForTimeout(400);
const cdp = await ctx.newCDPSession(page);
const touch = (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
const state = () => page.evaluate(() => { const g = window.__snackdrop.game; return { drops: g.drops, aim: +g.aim.toFixed(2) }; });

let fails = 0;
const check = (ok, label) => { console.log((ok ? "ok   " : "FAIL ") + label); if (!ok) fails++; };

// Quick tap.
let before = await state();
await touch("touchStart", 206, 500); await touch("touchEnd");
await page.waitForTimeout(700);
check((await state()).drops === before.drops + 1, "quick tap drops one snack");

// Long press: hold 1.2 s, drag right while holding, hold again, release.
before = await state();
await touch("touchStart", 150, 500);
await page.waitForTimeout(1200);
const held = await state();
check(held.drops === before.drops, "holding does not drop");
for (let x = 150; x <= 320; x += 10) { await touch("touchMove", x, 520); await page.waitForTimeout(16); }
await page.waitForTimeout(800);
const dragged = await state();
check(dragged.aim > held.aim + 1, `aim follows the finger while held (${held.aim} -> ${dragged.aim})`);
await touch("touchEnd");
await page.waitForTimeout(700);
check((await state()).drops === before.drops + 1, "release after a long hold drops one snack");

// Tools (Arcade): an armed tool never drops a snack, and a tap on a snack uses it.
await page.evaluate(() => { localStorage.clear(); });
await page.reload();
await page.waitForFunction(() => window.__snackdrop && window.__snackdrop.game);
await page.tap('[data-mode="arcade"]');
await page.tap('[data-start="spatula"]');
await page.tap('[data-go="arcade"]');
await page.waitForTimeout(400);
for (const x of [110, 300, 200]) { await touch("touchStart", x, 500); await touch("touchEnd"); await page.waitForTimeout(900); }
await page.waitForTimeout(1200);
const t0 = await page.evaluate(() => { const g = window.__snackdrop.game; return { drops: g.drops, n: g.snacks.length, tray: g.tray.slice() }; });
check(t0.tray.includes("spatula"), "Arcade starts with the chosen tool (" + t0.tray + ")");
await page.tap('[data-tool="spatula"]');
await page.waitForTimeout(200);
check(await page.evaluate(() => document.body.classList.contains("arming")), "tapping Spatula arms it");
// A tap in empty space inside the crate: nothing drops, still armed.
await touch("touchStart", 206, 330); await touch("touchEnd"); await page.waitForTimeout(700);
const t1 = await page.evaluate(() => ({ drops: window.__snackdrop.game.drops, arming: document.body.classList.contains("arming") }));
check(t1.drops === t0.drops && t1.arming, "a tap on empty space with a tool armed drops nothing and stays armed");
// A tap on a snack lifts it out.
const at = await page.evaluate(() => { const g = window.__snackdrop.game, s = g.snacks.find((x) => x.tier <= 6), p = s.body.getPosition(); return window.__snackdrop.view.toScreen(p.x, p.y); });
await touch("touchStart", at.x, at.y); await touch("touchEnd"); await page.waitForTimeout(700);
const t2 = await page.evaluate(() => { const g = window.__snackdrop.game; return { drops: g.drops, n: g.snacks.length, tray: g.tray.slice(), arming: document.body.classList.contains("arming") }; });
check(t2.drops === t0.drops && t2.n === t0.n - 1 && !t2.tray.includes("spatula") && !t2.arming, `a tap on a snack uses the Spatula and drops nothing (${t0.n} -> ${t2.n} snacks)`);

await browser.close(); server.close();
process.exit(fails ? 1 : 0);
