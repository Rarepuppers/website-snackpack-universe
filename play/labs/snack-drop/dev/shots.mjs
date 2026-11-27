// Screenshots of the real game: the menu, a bot game in progress, a late
// crate, and game over, on a phone-sized portrait screen.
//   node play/labs/snack-drop/dev/shots.mjs <out-dir>
// Needs Playwright from the website or website-keeping-up (PLAYWRIGHT_HOME overrides).
import { createRequire } from "node:module";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "../../../..");
const repo = path.resolve(site, "..");
let chromium;
for (const home of [process.env.PLAYWRIGHT_HOME, site, path.join(repo, "website-keeping-up"), repo].filter(Boolean)) {
  try { ({ chromium } = createRequire(path.join(home, "x.js"))("playwright")); break; } catch { /* try the next */ }
}
if (!chromium) { console.error("Playwright not found. Set PLAYWRIGHT_HOME."); process.exit(2); }
const out = path.resolve(process.argv[2] || "shots");
fs.mkdirSync(out, { recursive: true });

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const file = path.join(site, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(site) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/play/labs/snack-drop/index.html`;

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.route(/cloudflareinsights/, (r) => r.fulfill({ contentType: "text/javascript", body: "" }));

await page.goto(base);
await page.waitForFunction(() => window.__snackdrop && window.__snackdrop.game);
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(out, "1-menu.png") });

// A real tap path: press Play, aim and drop with the mouse.
await page.click("text=Play");
await page.waitForTimeout(300);
for (const x of [120, 300, 200, 160, 260]) { await page.mouse.move(x, 400); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(700); }
const drops = await page.evaluate(() => window.__snackdrop.game.drops);
console.log("tap drops", drops);
await page.screenshot({ path: path.join(out, "2-early.png") });

// The bot plays on for a while.
await page.goto(base + "?bot=1");
await page.waitForFunction(() => window.__snackdrop.game.drops > 60, null, { timeout: 120000 });
await page.screenshot({ path: path.join(out, "3-mid.png") });
await page.waitForFunction(() => window.__snackdrop.game.status === "over", null, { timeout: 400000, polling: 1000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(out, "4-over.png") });
const g = await page.evaluate(() => { const g = window.__snackdrop.game; return { score: g.score, drops: g.drops, best: g.best }; });
console.log("bot game", JSON.stringify(g));

console.log(errors.length ? "errors:\n" + errors.join("\n") : "no page errors");
await browser.close(); server.close();
process.exit(errors.length ? 1 : 0);
