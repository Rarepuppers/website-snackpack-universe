import { test, expect, chromium } from "@playwright/test";

// First-load weight budget.
//
// The eight soccer games used to pull ~9 MB each. Two causes: soccer-assets.js
// loaded both pitch sheets on every page when a game only ever draws one, and
// play/sprites/ was 8 MB of raw PNG with no WebP anywhere. Fixing both took a
// cold crossbar-challenge load from 9,082 KB to ~2,300 KB.
//
// Measuring this honestly is most of the work. A warm service worker or HTTP
// cache makes the number meaningless, and the cache survives newContext() — a
// draft of this spec reported 524 KB for a page that really pulls 2.3 MB, and
// an earlier probe reported 72 KB for a 6.6 MB page. So each measurement gets
// its own browser process, not just its own context.

const SOCCER = ["crossbar-challenge", "dribble-rush", "free-kick-curl", "goalkeeper-hero",
  "header-hero", "keepy-uppy", "penalty-shootout", "target-shooting-arena"];

// Generous enough not to fail on a new sprite, tight enough to catch a
// regression to loading both pitches (+2.4 MB) or shipping raw PNG (+4 MB).
const BUDGET_KB = 3500;

async function coldLoad(slug, baseURL) {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ serviceWorkers: "block" });
    const page = await context.newPage();
    // res.body() is async, so the handler must be awaited before the total is
    // read — returning straight after goto() undercounts badly and erratically
    // (185 KB to 597 KB for pages that really pull the same ~2.3 MB).
    const pending = [];
    const pitches = [];
    const seen = new Set();
    page.on("response", (res) => {
      const u = res.url();
      if (seen.has(u) || /cloudflareinsights|cdn-cgi/.test(u)) return;
      seen.add(u);
      if (/pitch-[a-z]+.(png|webp)/.test(u)) pitches.push(u.split("/").pop());
      pending.push(res.body().then((b) => b.length).catch(() => 0));
    });
    await page.goto(`${baseURL}/play/${slug}/`, { waitUntil: "networkidle" });
    const bytes = (await Promise.all(pending)).reduce((n, b) => n + b, 0);
    return { kb: Math.round(bytes / 1024), pitches };
  } finally {
    await browser.close();
  }
}

for (const slug of SOCCER) {
  test(`${slug}: stays inside the first-load budget`, async ({ baseURL }) => {
    test.slow();
    const { kb, pitches } = await coldLoad(slug, baseURL);
    console.log(`${slug}: ${kb} KB cold, pitches=[${pitches.join(",")}]`);
    expect(pitches.length, "fetches exactly one pitch sheet").toBe(1);
    expect(pitches[0], "the pitch is the WebP, not the PNG fallback").toMatch(/\.webp$/);
    expect(kb, `cold first load is ${kb} KB`).toBeLessThan(BUDGET_KB);
  });
}
