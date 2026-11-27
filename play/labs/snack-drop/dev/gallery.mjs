// Save proof gallery PNGs and the 40 px silhouettes at their actual pixel sizes.
//   PLAYWRIGHT_HOME=<checkout> node play/labs/snack-drop/dev/gallery.mjs <out-dir>
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const site = fileURLToPath(new URL("../../../../", import.meta.url));
const out = path.resolve(process.argv[2] || "gallery");
fs.mkdirSync(out, { recursive: true });
const { chromium } = createRequire(path.join(process.env.PLAYWRIGHT_HOME || site, "x.js"))("playwright");
const lab = "/play/labs/snack-drop/";
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".webp": "image/webp" };
const server = http.createServer((req, res) => {
  const file = path.resolve(site, "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname));
  if (!file.startsWith(site) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}${lab}index.html`;
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 1 });
  page.on("response", (r) => { if (r.status() >= 400) errors.push(r.status() + " " + r.url()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.route(/cloudflareinsights/, (r) => r.fulfill({ contentType: "text/javascript", body: "" }));
  await page.goto(base + "?gallery=1");
  await page.evaluate(async () => { await (await import("./assets.js")).loadAssets(); });
  const loaded = await page.evaluate(async () => {
    const { Assets } = await import("./assets.js");
    return { failed: Assets.failed, models: Object.keys(Assets.models).sort(), game: window.__snackdrop.game, version: Assets.version };
  });
  assert.equal(loaded.game, null, "gallery must not run physics");
  assert.deepEqual(errors, []);
  assert.deepEqual(loaded.failed, []);
  assert(loaded.version, "asset manifest was not loaded");
  for (const name of ["cameos/cameo_corgi-on-the-cob", "crates/crate_wood", "kitchens/kitchen_farmhouse",
    "snacks/snack_cookie", "snacks/snack_cheese", "snacks/snack_donut", "snacks/snack_pizza", "snacks/snack_cake"]) {
    assert(loaded.models.includes(name), name + " did not load");
  }
  await page.screenshot({ path: path.join(out, "gallery.png") });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: path.join(out, "gallery-desktop.png") });

  const sheet = await page.evaluate(async () => {
    const THREE = await import("./vendor/three.module.min.js");
    const { Renderer } = await import("./render3d.js");
    const { hasModel } = await import("./assets.js");
    const { TIERS } = window.SnackDrop;
    const view = new Renderer(document.createElement("canvas"));
    view.refreshTemplates();
    const { renderer } = view;
    renderer.setSize(192, 192, false);
    renderer.setClearColor("#fff5e7");
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    camera.position.z = 10;
    const scene = new THREE.Scene();
    scene.overrideMaterial = new THREE.MeshBasicMaterial({ color: "#170d0a", toneMapped: false });
    const canvas = document.createElement("canvas");
    canvas.width = 850;
    canvas.height = 158;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff5e7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#3a2414";
    ctx.font = "bold 18px system-ui";
    ctx.fillText("Snack Drop D1 · 40 px front silhouettes", 18, 28);
    const box = new THREE.Box3(), size = new THREE.Vector3(), center = new THREE.Vector3();
    TIERS.forEach((tier, i) => {
      const m = view.templates[i].clone();
      box.setFromObject(m).getSize(size);
      box.getCenter(center);
      m.position.sub(center);
      const extent = Math.max(size.x, size.y) * .5;
      Object.assign(camera, { left: -extent, right: extent, top: extent, bottom: -extent });
      camera.updateProjectionMatrix();
      scene.add(m);
      renderer.render(scene, camera);
      const x = 42 + 76 * i;
      ctx.drawImage(renderer.domElement, x - 20, 48, 40, 40);
      ctx.textAlign = "center";
      ctx.font = "11px system-ui";
      ctx.fillText(tier.name, x, 109, 73);
      ctx.fillStyle = "#795a42";
      ctx.fillText(hasModel("snacks/snack_" + tier.id) ? "D1 model" : "Fallback", x, 127);
      ctx.fillStyle = "#3a2414";
      scene.remove(m);
    });
    renderer.dispose();
    return canvas.toDataURL();
  });
  fs.writeFileSync(path.join(out, "silhouette-40px.png"), Buffer.from(sheet.split(",")[1], "base64"));
  await page.setViewportSize({ width: 412, height: 860 });
  await page.goto(base + "?gallery=1&assets=dev/empty-assets/");
  await page.evaluate(async () => { await (await import("./assets.js")).loadAssets(); });
  await page.screenshot({ path: path.join(out, "gallery-fallback.png") });
  assert.deepEqual(errors, []);
  console.log(`Gallery: ${loaded.models.length} models, 11 silhouettes, phone and desktop captures, no page errors`);
} finally {
  await browser.close();
  server.close();
}
