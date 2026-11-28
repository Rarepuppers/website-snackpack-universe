// Hold for more and Parking Spots screenshots: waits at a pickup stop for bonus
// loads (HUD and stop sign), then parks a truck in the deep spot (lit ring, HUD,
// results card).   node play/labs/snack-haul/dev/stop-shots.mjs <out-dir> "?full=1"

import { createRequire } from "node:module";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "../../../..");
const repo = path.resolve(site, "..");
let chromium;
for (const home of [process.env.PLAYWRIGHT_HOME, path.join(repo, "website-keeping-up"), site, repo].filter(Boolean)) {
  try { ({ chromium } = createRequire(path.join(home, "x.js"))("playwright")); break; } catch { /* try the next */ }
}
if (!chromium) { console.error("Playwright not found. Set PLAYWRIGHT_HOME."); process.exit(2); }
const out = path.resolve(process.argv[2] || "shots");
const query = process.argv[3] || "";
fs.mkdirSync(out, { recursive: true });

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".ogg": "audio/ogg", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp" };
const server = http.createServer((req, res) => {
  const file = path.join(site, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(site) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.route(/cloudflareinsights/, (r) => r.fulfill({ contentType: "text/javascript", body: "" }));
await page.goto(`http://127.0.0.1:${server.address().port}/play/labs/snack-haul/index.html${query}`);
await page.waitForFunction(() => window.__snackHaul && window.__snackHaul.assets.done, null, { timeout: 30000 }).catch(async (e) => { console.log("ERR", errors, await page.evaluate(() => typeof window.__snackHaul)); process.exit(1); });
const loaded = await page.evaluate(() => { const a = window.__snackHaul.assets; return { models: Object.keys(a.models).length, sounds: Object.keys(a.sounds).length, failed: a.failed }; });
console.log("assets", JSON.stringify(loaded));
await page.evaluate(() => { const H = window.__snackHaul, g = H.state.game; g.status = "failed"; g.reason = "load"; H.state.mode = "result"; H.finishDelivery(g); document.querySelector('#sheet [data-act="garage"]').click(); });
await page.waitForTimeout(400);
const shoot = async (name) => { await page.screenshot({ path: path.join(out, name + ".png") }); console.log("shot", name); };
// 0. The stop's sign, seen on the way in.
await page.evaluate(() => {
  const H = window.__snackHaul, SH = H.SH;
  H.startDelivery(SH.findDelivery(SH.DELIVERIES[7].id));
  const g = H.state.game;
  for (let n = 0; g.status === "driving" && n < 20000 && g.truck.getPosition().x < g.pickup.x0 - 7; n++) g.step(SH.botInput(g, 3));
  for (let k = 0; k < 90; k++) H.world().frameGame(g, 0.016);
});
await shoot("0-stop-sign");
// 1. Hold for more on Rolling Pin Ridge (Bakery 8): wait for two bonus loads.
let info = await page.evaluate(() => {
  const H = window.__snackHaul, SH = H.SH;
  H.startDelivery(SH.findDelivery(SH.DELIVERIES[7].id));
  const g = H.state.game;
  for (let n = 0; g.status === "driving" && n < 20000 && g.bonusHere < 2; n++) g.step(SH.botInput(g, 5, { greedy: true }));
  for (let k = 0; k < 90; k++) H.world().frameGame(g, 0.016);
  return { id: g.delivery.id, bonus: g.bonusHere, status: g.status, x: Math.round(g.truck.getPosition().x) };
});
console.log("hold", JSON.stringify(info));
await page.waitForTimeout(250);
await shoot("1-hold-for-more");
// 2 and 3. Park in the deep spot on Windmill Lane (Bakery 1), then the results card.
info = await page.evaluate(() => {
  const H = window.__snackHaul, SH = H.SH;
  H.startDelivery(SH.findDelivery(SH.DELIVERIES[0].id));
  const g = H.state.game;
  for (let n = 0; g.status === "driving" && n < 20000 && !(g.spotAt() === "deep" && g.speed() < 0.4); n++) g.step(SH.botInput(g, 6, { park: "deep" }));
  for (let k = 0; k < 90; k++) H.world().frameGame(g, 0.016);
  return { id: g.delivery.id, spot: g.spotAt(), status: g.status };
});
console.log("park", JSON.stringify(info));
await page.waitForTimeout(150);
await shoot("2-deep-spot");
await page.waitForTimeout(3500);
await shoot("3-results");
const lines = await page.evaluate(() => document.querySelector("#sheet") && document.querySelector("#sheet").innerText.slice(0, 600));
console.log("sheet", JSON.stringify(lines));
console.log("errors", errors.slice(0, 5));
await browser.close(); server.close();
