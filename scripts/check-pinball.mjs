import { execFileSync, spawn } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

/*
 * The Pinball inner loop: everything worth running on a website-only change,
 * as one command.
 *
 * Measured: the whole static set below costs ~4.6 seconds. Cutting any of it
 * to "iterate faster" saves nothing and removes the net, so nothing is cut.
 * What is deliberately NOT here is the portfolio gate (`scripts/check-all.js`
 * in the parent repo, ~10 minutes over 13 apps and 2,200 delivered assets) --
 * that answers "is the fleet shippable", which a CSS tweak on one web page
 * does not change. Run it before handing work back, not per iteration.
 *
 * --smoke additionally serves the site and plays a ball in a real browser.
 * That is the only check here that can catch "the page is green but the game
 * does not start", which is the failure this project has actually shipped.
 *
 * Run:  node scripts/check-pinball.mjs [--smoke]
 */

const root = path.resolve(".");
const smoke = process.argv.includes("--smoke");

const STATIC = [
  // Order: cheapest and most likely to fail first.
  ["build-pinball-version.mjs --check", "module cache-bust token is current"],
  ["build-pinball-scoring.mjs --check", "published scores match rules.js"],
  ["check-website-delivery.mjs", "delivered game-ui assets are governed"],
  ["check-contrast.mjs", "theme contrast across cream/dark/light"],
  ["build-play-links.mjs --check", "Play links are tagged"],
  ["check-site.mjs", "site HTML structure and links"],
  ["check-javascript.mjs", "every script parses"],
];

// The engine suites only matter when the simulation itself moves, but they cost
// two seconds together, so they always run rather than relying on a human to
// notice which files they touched.
const ENGINE = [
  ["../tools/pinball/rules.test.mjs", "ruleset: missions, ranks, scoring"],
  ["../tools/pinball/replay.test.mjs", "recorded games still replay identically"],
  ["../tools/pinball/tune.test.mjs", "physics: containment, determinism"],
];

let failed = 0;
const started = Date.now();

function run(entry, base) {
  const [spec, why] = entry;
  const [script, ...args] = spec.split(" ");
  const label = script.replace("../", "");
  process.stdout.write(`  ${label.padEnd(34)} `);
  const t = Date.now();
  try {
    execFileSync(process.execPath, [path.join(base, script), ...args], {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    });
    console.log(`ok   ${String(Date.now() - t).padStart(5)}ms  ${why}`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL ${String(Date.now() - t).padStart(5)}ms  ${why}`);
    const out = `${error.stdout || ""}${error.stderr || ""}`.trim();
    if (out) console.log(out.split("\n").map((l) => `      ${l}`).join("\n"));
  }
}

console.log("Pinball checks\n");
for (const entry of STATIC) run(entry, path.join(root, "scripts"));
for (const entry of ENGINE) run(entry, path.join(root, "scripts"));

if (smoke) {
  console.log("\nBrowser smoke");
  // shell:true on Windows -- spawning npx.cmd directly is EINVAL on modern Node.
  const server = spawn(
    "npx",
    ["-y", "http-server", "-p", "4183", "-c-1", "--silent"],
    { cwd: root, stdio: "ignore", shell: process.platform === "win32" },
  );
  try {
    // http-server needs a moment before the first request will connect.
    await new Promise((r) => setTimeout(r, 2500));
    // pathToFileURL: a bare Windows path is not a valid ESM specifier.
    const playwright = await import(
      pathToFileURL(path.join(root, "node_modules", "@playwright", "test", "index.js")).href
    );
    const { chromium } = playwright.default ?? playwright;

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    const bad = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("response", (r) => {
      const p = new URL(r.url()).pathname;
      if (/\/play\/pinball\/|game-ui\/pinball\//.test(p) && r.status() >= 400) {
        bad.push(`${p} -> ${r.status()}`);
      }
    });

    await page.goto("http://localhost:4183/play/pinball/", { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await page.locator('[data-mode="relaxed"]').first().click();
    await page.waitForTimeout(1200);
    await page.keyboard.down("Space");
    await page.waitForTimeout(550);
    await page.keyboard.up("Space");
    await page.waitForTimeout(1800);

    const state = await page.evaluate(() => {
      const c = document.getElementById("pb-canvas");
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      const seen = new Set();
      for (let i = 0; i < d.length; i += 4 * 97) {
        seen.add((d[i] >> 3) + "," + (d[i + 1] >> 3) + "," + (d[i + 2] >> 3));
      }
      const score = document.getElementById("pb-score");
      const hud = document.getElementById("pb-hud");
      return {
        colours: seen.size,
        score: Number((score.textContent || "0").replace(/,/g, "")),
        hudShown: !hud.hasAttribute("hidden"),
        started: !/Choose a mode to start\./.test(document.body.innerText),
      };
    });
    await browser.close();

    // Each of these has been a real failure mode: a blank canvas, a game that
    // will not start, a silently 404ing sprite, a score that never moves.
    const checks = [
      [state.started, "a mode starts"],
      [state.hudShown, "the readout is showing"],
      [state.colours > 500, `the table is drawn (${state.colours} colours)`],
      [state.score > 0, `a plunge scores (${state.score})`],
      [bad.length === 0, `no failing pinball requests${bad.length ? `: ${bad.join(", ")}` : ""}`],
      [errors.length === 0, `no page errors${errors.length ? `: ${errors[0]}` : ""}`],
    ];
    for (const [ok, why] of checks) {
      if (!ok) failed += 1;
      console.log(`  ${ok ? "ok  " : "FAIL"}  ${why}`);
    }
  } catch (error) {
    failed += 1;
    console.log(`  FAIL  smoke could not run: ${error.message}`);
  } finally {
    server.kill();
  }
}

const secs = ((Date.now() - started) / 1000).toFixed(1);
console.log(
  failed === 0
    ? `\nPinball OK in ${secs}s.${smoke ? "" : "  (add --smoke to play a ball)"}`
    : `\nPinball FAILED: ${failed} check(s) in ${secs}s.`,
);
process.exit(failed === 0 ? 0 : 1);
