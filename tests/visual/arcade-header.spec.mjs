import { test, expect } from "@playwright/test";

// The sticky site header must stay on top of the game while the page scrolls.
//
// The pause overlay work lifted every game's toolbar to z-index 45 so the
// resume button stays above the overlay. With no stacking context on the stage,
// that 45 also beat the header's 20, so on every game page the score chips and
// option buttons slid over the header as you scrolled. `.game-stage` now
// isolates its own stack.
//
// Scroll each toolbar up under the header and ask the browser which element is
// on top at the point where the two overlap.

import fs from "node:fs"; import path from "node:path";
const PLAY = path.resolve("play");
const RES = new Set(["daily","stats","last-bastion","shared-assets","social","sprites","tiles","docs"]);
const games = fs.readdirSync(PLAY,{withFileTypes:true}).filter(e=>e.isDirectory()&&!RES.has(e.name)&&fs.existsSync(path.join(PLAY,e.name,"index.html"))).map(e=>e.name);

for (const [label, size] of [["phone", { width: 390, height: 844 }], ["desktop", { width: 1280, height: 800 }]]) {
  test(`the site header stays above every game toolbar (${label})`, async ({ page }) => {
    await page.setViewportSize(size);
    const bad = [];
    for (const slug of games) {
      await page.goto(`/play/${slug}/`, { waitUntil: "load" });
      const r = await page.evaluate(() => {
        const header = document.querySelector(".topbar");
        const chip = document.querySelector(".game-stage .game-toolbar .readout-chip, .game-stage .game-toolbar button");
        if (!header || !chip) return "skip";
        const hh = header.getBoundingClientRect().height;
        const c = chip.getBoundingClientRect();
        window.scrollTo(0, c.top + window.scrollY - hh / 2);
        const now = chip.getBoundingClientRect();
        const el = document.elementFromPoint(now.left + now.width / 2, hh / 2);
        return el && el.closest(".topbar") ? "ok" : (el ? el.tagName + "." + String(el.className).split(" ")[0] : "nothing");
      });
      if (r !== "ok" && r !== "skip") bad.push(`${slug}: ${r} drawn over the header`);
    }
    console.log(bad.length ? bad.join("\n") : "header on top everywhere");
    expect(bad).toEqual([]);
  });
}
