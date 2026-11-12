// Loads the Blender-made fixtures (dev/make-fixtures.py) into the real game and
// checks that authored models and sounds replace the code-built ones, and that
// the game still runs untouched when there are none.
//   node play/labs/snack-haul/dev/check-loader.mjs [shots-dir]
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
const shots = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (shots) fs.mkdirSync(shots, { recursive: true });

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".glb": "model/gltf-binary", ".ogg": "audio/ogg", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp" };
const server = http.createServer((req, res) => {
  const file = path.join(site, decodeURIComponent(req.url.split("?")[0]));
  if (!file.startsWith(site) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"] });
const problems = [];
const expect = (ok, what) => { console.log((ok ? "  ok   " : "  FAIL ") + what); if (!ok) problems.push(what); };

async function open(query) {
  const page = await browser.newPage({ viewport: { width: 915, height: 412 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.route(/cloudflareinsights/, (r) => r.fulfill({ contentType: "text/javascript", body: "" }));
  await page.goto(`${origin}/play/labs/snack-haul/index.html${query}`);
  await page.waitForFunction(() => window.__snackHaul && window.__snackHaul.assets.done, null, { timeout: 20000 });
  return { page, errors };
}
// What the scene is made of, read from the live renderer.
const inspect = (page) => page.evaluate(async () => {
  const H = window.__snackHaul, w = H.world(), names = [], mats = {};
  H.startDelivery(H.SH.findDelivery("bakery-1"));
  for (let i = 0; i < 120; i++) H.state.game.step({ gas: i > 20, brake: false });
  await new Promise((r) => setTimeout(r, 900));
  w.truckModel.root.traverse((o) => { if (o.name) names.push(o.name); if (o.isMesh && o.material.name) mats[o.material.name] = "#" + o.material.color.getHexString(); });
  const cargo = w.cargo[0].group, first = cargo.children[0];
  return {
    models: Object.keys(H.assets.models).length, sounds: Object.keys(H.assets.sounds).length, failed: H.assets.failed,
    names, mats, brakes: w.truckModel.brakes.length, wheelKids: w.truckModel.wheels[0].children.map((c) => c.type + ":" + (c.children[0] ? c.children[0].name : "")),
    cargoUnits: cargo.children.length, cargoName: first && first.children[0] ? first.children[0].name : "", cargoType: cargo.userData.type,
    coinVerts: w.coinMesh.geometry.attributes.position.count,
    decoded: Object.keys(H.audio.buffers).sort(), loops: !!H.audio.loops, ctx: H.audio.ctx ? H.audio.ctx.state : "none"
  };
});

console.log("With fixture assets");
{
  const { page, errors } = await open("?assets=dev/fixture-assets/");
  const s = await inspect(page);
  if (shots) await page.screenshot({ path: path.join(shots, "loader-fixtures.png") });
  expect(s.models === 8 && s.sounds === 5, `loaded 8 models and 5 sounds (got ${s.models} and ${s.sounds})`);
  expect(s.failed.length === 0, "no file failed to load" + (s.failed.length ? ": " + s.failed.join("; ") : ""));
  expect(["body", "glass", "lights_front", "lights_brake", "seat", "topper", "headlight", "corgi"].every((n) => s.names.includes(n)), "truck holds the authored nodes and the corgi");
  expect(s.mats.paint === "#d8452e" && s.mats.trim === "#f2e2c4", `paint and trim recoloured (${s.mats.paint}, ${s.mats.trim})`);
  expect(s.brakes === 1, `brake lamps found under lights_brake (${s.brakes})`);
  expect(s.wheelKids.length === 2 && s.wheelKids.every((k) => /tyre|hub/.test(k) || k.startsWith("Group")), `authored wheels on the axle (${s.wheelKids.join(", ")})`);
  expect(s.cargoUnits === 2 && /crate|eggs/.test(s.cargoName), `authored cargo, two units (${s.cargoType}: ${s.cargoName})`);
  expect(s.coinVerts !== 0 && s.coinVerts % 3 === 0, `coin uses the merged authored geometry (${s.coinVerts} vertices)`);
  expect(s.decoded.length === 5, `sounds decoded (${s.decoded.length}, context ${s.ctx})`);
  expect(s.loops, "engine loops running for the pickup");
  expect(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await page.close();
}

console.log("With no assets (the shipped empty manifest)");
{
  const { page, errors } = await open("");
  const s = await inspect(page);
  if (shots) await page.screenshot({ path: path.join(shots, "loader-none.png") });
  expect(s.models === 0 && s.sounds === 0, "nothing loaded");
  expect(!s.names.includes("body") && s.brakes === 2, "code-built truck in use");
  expect(s.cargoUnits >= 1 && !s.loops, "code-built cargo and synthesised engine in use");
  expect(errors.length === 0, "no page errors" + (errors.length ? ": " + errors.join(" | ") : ""));
  await page.close();
}

console.log("With a missing manifest");
{
  const { page, errors } = await open("?assets=dev/no-such-folder/");
  const s = await inspect(page);
  expect(s.models === 0 && s.brakes === 2, "falls back to the code-built game");
  expect(errors.filter((e) => !/404/.test(e)).length === 0, "no errors beyond the one 404");
  await page.close();
}

await browser.close();
server.close();
console.log(problems.length ? `FAIL: ${problems.length} problem(s)` : "PASS");
process.exit(problems.length ? 1 : 0);
