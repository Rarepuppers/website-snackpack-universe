// Reproducible, authentic guide/social/video captures from the committed game bundle.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir, rename, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const port = Number(process.env.LAST_BASTION_CAPTURE_PORT || 44179);
const baseURL = `http://127.0.0.1:${port}`;
const seed = "57512";
const guideRoot = resolve("guides/free-browser-roguelite/assets");
const mediaRoot = resolve("play/last-bastion/media");
const videoScratch = resolve("play/last-bastion/.capture-video");

const shots = [
  {
    name: "combat-mid-wave",
    route: `/play/last-bastion/?screen=game&runseed=${seed}&gamespeed=1.25`,
    alt: "Last Bastion combat during a dense wave, with the Marine surrounded by enemies and active weapons.",
  },
  {
    name: "expedition-map",
    route: `/play/last-bastion/?screen=map&mapseed=${seed}`,
    alt: "Last Bastion expedition map with distinct node icons, connected routes and a selected combat node.",
  },
  {
    name: "level-up-choice",
    route: `/play/last-bastion/?scenario=level-up-review&runseed=${seed}`,
    alt: "Last Bastion level-up screen presenting four upgrade choices during a run.",
  },
];

const server = spawn(process.execPath, ["scripts/serve-static.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: "ignore",
});

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`${baseURL}/play/last-bastion/`);
      if (response.ok) return;
    } catch { /* server is still starting */ }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error("Last Bastion capture server did not start.");
}

async function settle(page, milliseconds = 1800) {
  await page.waitForSelector("#game-root canvas", { state: "visible", timeout: 60_000 });
  await page.waitForTimeout(milliseconds);
}

await mkdir(guideRoot, { recursive: true });
await mkdir(mediaRoot, { recursive: true });
await rm(videoScratch, { recursive: true, force: true });
await mkdir(videoScratch, { recursive: true });

let browser;
try {
  await waitForServer();
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  for (const shot of shots) {
    await page.goto(`${baseURL}${shot.route}`, { waitUntil: "domcontentloaded" });
    await settle(page, shot.name === "combat-mid-wave" ? 9000 : 1800);
    const canvas = page.locator("#game-root canvas");
    await canvas.screenshot({ path: resolve(guideRoot, `${shot.name}.png`) });
    console.log(`Captured ${shot.name}.png`);
  }
  await page.close();

  const context = await browser.newContext({
    viewport: { width: 960, height: 540 },
    recordVideo: { dir: videoScratch, size: { width: 960, height: 540 } },
  });
  const loopPage = await context.newPage();
  const video = loopPage.video();
  for (const route of [shots[1].route, shots[0].route, shots[2].route]) {
    await loopPage.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded" });
    await settle(loopPage, route.includes("screen=game") ? 7000 : 2200);
  }
  await context.close();
  if (!video) throw new Error("Playwright did not create a run-loop recording.");
  await rename(await video.path(), resolve(mediaRoot, "last-bastion-run-loop.webm"));
  await rm(videoScratch, { recursive: true, force: true });
  console.log("Captured play/last-bastion/media/last-bastion-run-loop.webm");
} finally {
  await browser?.close();
  if (!server.killed) server.kill();
}
