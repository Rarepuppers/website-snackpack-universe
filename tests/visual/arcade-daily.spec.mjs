import { test, expect } from "@playwright/test";

// The daily hub is a retention surface, and a card that 404s or opens a game
// with no puzzle is invisible until someone clicks it. crossword, kakuro and
// picross all had working, deterministic daily puzzles that the hub simply did
// not link — three free entries nobody could find.

test("daily hub: every card reaches a working daily puzzle", async ({ page }) => {
  await page.goto("/play/daily/", { waitUntil: "load" });
  const cards = await page.evaluate(() =>
    [...document.querySelectorAll(".dl-card")].map((a) => ({
      game: a.dataset.game,
      href: a.getAttribute("href"),
      title: a.querySelector("h3").textContent
    })));
  console.log("cards on the hub: " + cards.length);
  expect(cards.length).toBeGreaterThan(14);

  const bad = [];
  for (const c of cards) {
    const errors = [];
    const onErr = (e) => errors.push(String(e));
    page.on("pageerror", onErr);
    const resp = await page.goto(`/play/daily/${c.href.replace("../", "../")}`.replace("/play/daily/../", "/play/"), { waitUntil: "load" });
    await page.waitForTimeout(350);
    const ok = await page.evaluate(() => {
      const stage = document.querySelector(".game-stage");
      return !!stage && stage.getBoundingClientRect().height > 100;
    });
    page.off("pageerror", onErr);
    if (!resp || resp.status() >= 400) bad.push(`${c.game}: HTTP ${resp && resp.status()}`);
    else if (!ok) bad.push(`${c.game}: no stage rendered`);
    else if (errors.length) bad.push(`${c.game}: ${errors[0].slice(0, 90)}`);
  }
  expect(bad).toEqual([]);
});

// The three added this session specifically.
for (const [slug, id] of [["crossword", "#cw-grid"], ["kakuro", "#k-grid"], ["picross", "#pc-grid, #p-grid, .pc-grid"]]) {
  test(`${slug}: the hub's daily link opens a daily puzzle`, async ({ page }) => {
    await page.goto(`/play/${slug}/?daily`, { waitUntil: "load" });
    await page.waitForTimeout(400);
    const boardCells = await page.evaluate((sel) => {
      const el = document.querySelector(sel.split(",")[0].trim()) ||
        document.querySelector(sel.split(",")[1]?.trim() || "nope") ||
        document.querySelector(".game-stage");
      return el ? el.querySelectorAll("*").length : 0;
    }, id);
    expect(boardCells, "a grid is rendered").toBeGreaterThan(10);
  });
}
