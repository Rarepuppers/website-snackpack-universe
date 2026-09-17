import { test, expect } from "@playwright/test";

// Horizontal overflow at phone width.
//
// Eight games hung off the right edge at 390px. Seven shared one cause: a width
// of min(92vw, Npx) on the control pad or board, sized against the VIEWPORT
// when the shell only leaves about 320px of content box — so 92vw (359px)
// started at the content edge and ran 4px past the screen. They now size
// against the container. Solitaire was its own thing: seven 12vw cards plus six
// gaps needed 365px and had 320.
//
// Phones are most of this audience, so a sideways wobble on every one of these
// is worth a guard.

import fs from "node:fs"; import path from "node:path";
const PLAY = path.resolve("play");
const RES = new Set(["daily","stats","last-bastion","shared-assets","social","sprites","tiles","docs"]);
const games = fs.readdirSync(PLAY,{withFileTypes:true}).filter(e=>e.isDirectory()&&!RES.has(e.name)&&fs.existsSync(path.join(PLAY,e.name,"index.html"))).map(e=>e.name);
test("no game overflows horizontally on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const bad = [];
  for (const slug of games) {
    await page.goto(`/play/${slug}/`, { waitUntil: "load" });
    await page.waitForTimeout(220);
    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const over = de.scrollWidth - de.clientWidth;
      let first = "";
      if (over > 1) for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > de.clientWidth + 1) { first = el.tagName + "." + (el.className||"").toString().split(" ")[0]; break; }
      }
      return { over, first };
    });
    if (m.over > 1) bad.push(`${slug}: ${m.over}px (${m.first})`);
  }
  console.log(bad.length ? bad.join("\n") : "no overflow anywhere");
  expect(bad).toEqual([]);
});
