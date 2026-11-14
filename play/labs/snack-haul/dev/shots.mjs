// Screenshots of the real game for visual review: one route per region with a
// different truck each, a close crop of every truck, and the menus.
//   node play/labs/snack-haul/dev/shots.mjs <out-dir> [query, e.g. "?assets=dev/empty-assets/"]
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

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".ogg": "audio/ogg", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp" };
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
await page.waitForFunction(() => window.__snackHaul && window.__snackHaul.assets.done, null, { timeout: 30000 });
const loaded = await page.evaluate(() => { const a = window.__snackHaul.assets; return { models: Object.keys(a.models).length, sounds: Object.keys(a.sounds).length, failed: a.failed }; });
console.log("assets", JSON.stringify(loaded));
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(out, "home.png") });

const runs = [["bakery-4", "pickup"], ["dunes-5", "tuktuk"], ["harbour-6", "van"], ["frost-6", "buggy"], ["chilli-3", "hauler"], ["market-5", "monster"]];
for (const [id, truck] of runs) {
  const info = await page.evaluate(([id, truck]) => {
    const H = window.__snackHaul, SH = H.SH, save = H.save();
    if (!save.trucks.includes(truck)) save.trucks.push(truck);
    save.truck = truck;
    H.startDelivery(SH.findDelivery(id));
    const g = H.state.game;
    let n = 0;
    // Roll gently for a few seconds so the suspension settles and scenery is in view.
    while (g.status === "driving" && n++ < 420) { const vx = g.truck.getLinearVelocity().x; g.step({ gas: vx < 3.2, brake: vx > 4.6 }); }
    H.world().frameGame(g, 0.016);
    return { x: Math.round(g.truck.getPosition().x), status: g.status, live: g.live(), total: g.total, draw: H.world().stats() };
  }, [id, truck]);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(out, `${id}-${truck}.png`) });
  console.log(id, truck, JSON.stringify(info));
}
// Back to the menu for the garage and routes screens.
await page.evaluate(() => { const H = window.__snackHaul, g = H.state.game; g.status = "failed"; g.reason = "load"; H.state.mode = "result"; H.finishDelivery(g); document.querySelector('#sheet [data-act="garage"]').click(); });
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(out, "garage.png") });
// Every truck parked in the garage, each with a different driver and roof topper.
const looks = [["pickup", "corgi", ""], ["tuktuk", "barkbq", "croissant"], ["van", "waffle", "cone"], ["buggy", "booklava", "chilli"], ["hauler", "corgi", "crown"], ["monster", "barkbq", "honey"]];
for (const [truck, driver, topper] of looks) {
  await page.evaluate(([truck, driver, topper]) => {
    const save = window.__snackHaul.save();
    save.driver = driver; save.topper = topper;
    document.querySelector(`#ui [data-truck="${truck}"]`).click();
  }, [truck, driver, topper]);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, `truck-${truck}.png`), clip: { x: 0, y: 60, width: 330, height: 300 } });
}
for (const nav of ["home", "routes", "home", "goals"]) {
  await page.evaluate((nav) => { const b = document.querySelector(`#ui [data-nav="${nav}"]`); if (b) b.click(); }, nav);
  await page.waitForTimeout(500);
  if (nav !== "home") await page.screenshot({ path: path.join(out, `${nav}.png`) });
}
await browser.close();
server.close();
if (errors.length) console.log("errors", errors);
console.log(errors.length ? "FAIL" : "DONE");
process.exit(errors.length ? 1 : 0);
