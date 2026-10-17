import { test, expect } from "@playwright/test";

// The board must start on the first screen.
//
// Every game page used to open on a marketing hero (eyebrow, H1, a 4–6 line
// paragraph) and a full options row, so on a 375×812 phone the board started
// 672–1,104 px down — below the first screen on almost every game — and on a
// 1280×800 laptop it was cut off. The hero is now a title strip, and where
// height is short the options fold behind one "Options" button
// (game-ui-assets.js + play.css).
//
// Tall portrait canvases (flappy, asteroid, table tennis, cascade…) cannot fit
// whole on a phone, so the rule is that the board is either wholly on screen
// or starts on it with at least 200 px showing.

import fs from "node:fs"; import path from "node:path";
const PLAY = path.resolve("play");
const RES = new Set(["daily", "stats", "last-bastion", "shared-assets", "social", "sprites", "tiles", "docs"]);
const games = fs.readdirSync(PLAY, { withFileTypes: true }).filter(e => e.isDirectory() && !RES.has(e.name) && fs.existsSync(path.join(PLAY, e.name, "index.html"))).map(e => e.name);

// The play surface, in priority order; the first that exists is measured.
const BOARD = [".game-board-wrap", "canvas", "#fc-table", "#gs-cols", ".py-pyramid", ".tp-board", "#mj-board", "#t-hand",
  "#trivia-options", "#ff-input", ".sw-board", "#sol-table", "#spi-table", "#cw-grid", "#ws-board", "#s-board"];

for (const [label, size] of [["phone", { width: 375, height: 812 }], ["laptop", { width: 1280, height: 800 }]]) {
  test(`every board starts on the first screen (${label})`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(size);
    const bad = [];
    for (const slug of games) {
      await page.goto(`/play/${slug}/`, { waitUntil: "load" });
      await page.waitForTimeout(250);
      const r = await page.evaluate((sel) => {
        const el = sel.map(q => document.querySelector(q)).find(Boolean);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { top: Math.round(b.top), whole: b.bottom <= innerHeight, shown: Math.round(Math.min(b.bottom, innerHeight) - b.top), vh: innerHeight };
      }, BOARD);
      if (!r) { bad.push(`${slug}: no board element found`); continue; }
      if (r.top >= r.vh || (!r.whole && r.shown < 200)) bad.push(`${slug}: board starts at ${r.top}px, ${r.shown}px visible`);
    }
    console.log(bad.length ? bad.join("\n") : `all ${games.length} boards start on screen`);
    expect(bad).toEqual([]);
  });
}

test("Options shows the folded controls and names the current choice", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/play/checkers/", { waitUntil: "load" });
  const toggle = page.locator(".sp-options-toggle");
  const hard = page.locator(".game-controls .seg button", { hasText: "Hard" });
  await expect(toggle).toContainText("Medium");
  await expect(hard).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(hard).toBeVisible();
  await hard.click();
  await expect(toggle).toContainText("Hard");
  // New game never folds.
  await toggle.click();
  await expect(page.locator("#ck-new")).toBeVisible();
});
