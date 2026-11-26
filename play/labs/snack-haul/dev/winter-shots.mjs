// Winter Haul screenshots and draw stats: home, the Winter screen, the advent
// calendar and a few North Pole runs in the sleigh.
//   node play/labs/snack-haul/dev/winter-shots.mjs <out-dir> "?date=2026-12-10&full=1"
//   RUNS='[["northpole-8",60]]' adds or replaces the runs ([id, physics steps]).
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
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(out, "first.png") });
await page.evaluate(() => { const H = window.__snackHaul, g = H.state.game; g.status = "failed"; g.reason = "load"; H.state.mode = "result"; H.finishDelivery(g); document.querySelector('#sheet [data-act="garage"]').click(); });
await page.waitForTimeout(500);
await page.evaluate(() => document.querySelector('#ui [data-nav="home"]').click());
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(out, "home.png") });
console.log(await page.evaluate(() => [...document.querySelectorAll("#sheet [data-act], #ui [data-nav]")].map((b) => b.dataset.act || b.dataset.nav).join(",")));
await page.evaluate(() => document.querySelector('#ui [data-nav="winter"]').click());
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(out, "winter.png") });
await page.evaluate(() => { document.querySelector("#ui .winter-doors").scrollIntoView(); });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, "advent.png") });
for (const [id, steps] of (process.env.RUNS ? JSON.parse(process.env.RUNS) : [["northpole-2", 420], ["northpole-2", 1500], ["northpole-5", 900]])) {
  const info = await page.evaluate(([id, steps]) => {
    const H = window.__snackHaul, SH = H.SH, save = H.save();
    if (!save.trucks.includes("sleigh")) save.trucks.push("sleigh");
    save.truck = "sleigh";
    H.startDelivery(SH.winterDelivery(id));
    const g = H.state.game;
    let n = 0;
    while (g.status === "driving" && n++ < steps) { const vx = g.truck.getLinearVelocity().x; g.step({ gas: vx < 4, brake: vx > 6 }); }
    H.world().frameGame(g, 0.016);
    return { x: Math.round(g.truck.getPosition().x), status: g.status, total: g.total, draw: H.world().stats() };
  }, [id, steps]);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(out, `${id}-${steps}.png`) });
  console.log(id, JSON.stringify(info));
}
console.log("errors", errors.slice(0, 5));
await browser.close(); server.close();
