// Captures authentic Keeping Up with the Joneses gameplay screenshots for
// /keeping-up-with-the-joneses/, the same way assets/atlas/ was produced.
//
//   node scripts/capture-keeping-up.mjs
//
// Drives the live release build through onboarding into Week 1 and shoots the
// board at desktop and compact widths. Re-run when the HUD changes materially.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const URL = "https://keepingup.snackpackuniverse.com/";
const OUT = "assets/keeping-up";
// A fixed seed keeps the captures reproducible; the engine is deterministic.
const SEED = "20260830";

const shots = [
  { name: "gameplay-desktop", width: 1440, height: 900 },
  { name: "gameplay-mobile", width: 768, height: 1024 },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

for (const shot of shots) {
  const page = await browser.newPage({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: 1,
  });
  await page.goto(URL, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: "Choose a starting life" }).click();
  const seed = page.getByRole("textbox");
  await seed.fill(SEED);
  await page.getByRole("button", { name: /^Begin Week 1 as / }).click();
  await page.getByRole("button", { name: "Enter the city" }).click();

  // The board paints the city groundplate and animates the player token in.
  await page.waitForSelector(".board-canvas", { state: "visible" });
  await page.waitForTimeout(2500);

  await page.screenshot({ path: `${OUT}/keeping-up-${shot.name}.png` });
  console.log(`Captured ${shot.name} (${shot.width}x${shot.height}).`);
  await page.close();
}

await browser.close();
