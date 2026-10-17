import { test, expect, chromium } from "@playwright/test";

// Shared game art reaches the site through the derivative pipeline
// (scripts/build-game-ui-derivatives.ps1 in the monorepo), which delivers a
// .webp beside every PNG in play/shared-assets/game-ui. Pages ask for the WebP
// (CSS image-set, or arcade-assets.js with a PNG retry) and keep the PNG only
// as a fallback. Before that, flappy-snacky pulled 3.6 MB on a cold load —
// two 1.25 MB background PNGs and 512 px bird frames drawn at 68 px — and
// checkers fetched two ~290 KB piece PNGs.
//
// A browser that takes WebP must therefore never fetch a shared-art PNG. Each
// page gets its own browser process; see arcade-weight.spec.mjs for why.

const GAMES = ["flappy-snacky", "checkers", "reversi", "connect-4", "solitaire", "spider-solitaire",
  "tripeaks", "pyramid", "golf-solitaire", "freecell", "thirteen", "memory-match", "minesweeper",
  "picross", "snakes-and-ladders"];

async function coldLoad(slug, baseURL) {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    const pending = [];
    const pngs = [];
    const seen = new Set();
    page.on("response", (res) => {
      const u = res.url();
      if (seen.has(u) || /cloudflareinsights|cdn-cgi/.test(u)) return;
      seen.add(u);
      if (/\/shared-assets\/game-ui\/(?!pinball\/).*\.png$/.test(u)) pngs.push(u.split("/shared-assets/game-ui/")[1]);
      pending.push(res.body().then((b) => b.length).catch(() => 0));
    });
    await page.goto(`${baseURL}/play/${slug}/`, { waitUntil: "networkidle" });
    // Draw at least one frame of art in the canvas games and show card backs.
    await page.mouse.move(10, 10);
    await page.waitForTimeout(400);
    const bytes = (await Promise.all(pending)).reduce((n, b) => n + b, 0);
    return { kb: Math.round(bytes / 1024), pngs };
  } finally {
    await browser.close();
  }
}

for (const slug of GAMES) {
  test(`${slug}: shared art is fetched as WebP`, async ({ baseURL }) => {
    test.slow();
    const { kb, pngs } = await coldLoad(slug, baseURL);
    console.log(`${slug}: ${kb} KB cold`);
    expect(pngs, "shared-art PNGs fetched by a WebP-capable browser").toEqual([]);
    if (slug === "flappy-snacky") expect(kb, `flappy-snacky cold first load is ${kb} KB`).toBeLessThan(1000);
  });
}
