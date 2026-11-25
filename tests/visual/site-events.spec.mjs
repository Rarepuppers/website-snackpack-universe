import { test, expect } from "@playwright/test";

// Anonymous GoatCounter counts (play/game-events.js, read/read-events.js).
// window.SP_EVENTS_DEBUG = [] makes both scripts collect event paths instead of
// sending them, so these tests read exactly what production would send.
// Disclosed at /privacy/arcade/ — change that page with anything here.

async function debugPage(page, extra) {
  await page.addInitScript((gpc) => {
    window.SP_EVENTS_DEBUG = [];
    if (gpc) Object.defineProperty(Navigator.prototype, "globalPrivacyControl", { get: () => true });
  }, !!(extra && extra.gpc));
}
const events = (page) => page.evaluate(() => window.SP_EVENTS_DEBUG.slice());
async function hide(page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

test("a game page counts start, one time band, and a win — not the page view", async ({ page }) => {
  await debugPage(page);
  await page.goto("/play/2048/");
  await page.waitForFunction(() => window.__spGameEvents === true);
  expect(await events(page)).toEqual([]);

  await page.locator(".game-stage").first().click({ position: { x: 20, y: 20 } });
  await page.keyboard.press("ArrowLeft");
  await page.evaluate(() => window.SnackPack.celebrate({ delay: 999999 }));
  await page.evaluate(() => window.SnackPack.celebrate({ delay: 999999 })); // within 5 s: one win
  await hide(page);
  await hide(page);
  expect(await events(page)).toEqual(["/arcade/2048/start", "/arcade/2048/win", "/arcade/2048/time-under-1m"]);
});

test("no time band is sent for a game page that was never played", async ({ page }) => {
  await debugPage(page);
  await page.goto("/play/2048/");
  await page.waitForFunction(() => window.__spGameEvents === true);
  await hide(page);
  expect(await events(page)).toEqual([]);
});

test("today's daily puzzle is counted once", async ({ page }) => {
  await debugPage(page);
  await page.goto("/play/sudoku/?daily=" + new Date().toISOString().slice(0, 10));
  await page.waitForFunction(() => window.__spGameEvents === true && !!window.SnackPackDaily);
  await page.evaluate(() => { window.SnackPackDaily.recordIfDaily("Solved"); window.SnackPackDaily.recordIfDaily("Solved"); });
  expect(await events(page)).toEqual(["/arcade/sudoku/daily"]);
});

test("Global Privacy Control sends nothing", async ({ page }) => {
  await debugPage(page, { gpc: true });
  await page.goto("/play/2048/");
  await page.waitForTimeout(300);
  await page.locator(".game-stage").first().click({ position: { x: 20, y: 20 } });
  await page.evaluate(() => window.SnackPack.celebrate({ delay: 999999 }));
  await hide(page);
  expect(await events(page)).toEqual([]);
});

test("off the production host, nothing is sent", async ({ page }) => {
  const hits = [];
  page.on("request", (r) => { if (r.url().includes("goatcounter")) hits.push(r.url()); });
  await page.goto("/play/2048/");
  await page.waitForTimeout(300);
  await page.locator(".game-stage").first().click({ position: { x: 20, y: 20 } });
  await page.keyboard.press("ArrowLeft");
  await hide(page);
  expect(await page.evaluate(() => window.__spGameEvents)).toBeUndefined();
  expect(hits).toEqual([]);
});

test("the hub counts the opened tile and where it sat", async ({ page }) => {
  await debugPage(page);
  await page.goto("/play/");
  await page.waitForFunction(() => window.__spGameEvents === true);
  // Keep the page here so the collected events can be read.
  await page.evaluate(() => window.addEventListener("click", (e) => e.preventDefault()));
  const first = page.locator("#games .game-grid a.game-tile").first();
  const href = await first.getAttribute("href");
  const slug = href === "/atlas-quest/" ? "atlas-quest" : href.replace(/^(\.\/|\/play\/)/, "").replace(/\/$/, "");
  await first.click();
  expect(await events(page)).toEqual(["/arcade/hub/" + slug, "/arcade/hub-position/1-5"]);

  const later = page.locator("#games .game-grid a.game-tile").nth(14);
  await later.scrollIntoViewIfNeeded();
  await later.click();
  expect((await events(page)).slice(2)[1]).toBe("/arcade/hub-position/13-plus");
});

test("a book counts start, finish, read-to-me and the PDF, each once", async ({ page }) => {
  await debugPage(page);
  await page.addInitScript(() => {
    // Headless speech may be missing; a stub keeps "Read to me" on the page.
    window.speechSynthesis = { getVoices: () => [], speak: () => {}, cancel: () => {}, speaking: false };
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  await page.goto("/read/pip-sits/");
  await page.waitForFunction(() => window.__spReadEvents === true);
  await page.waitForTimeout(900);
  expect(await events(page)).toEqual([]); // opening the hero is not reading

  await page.locator("#page-1").scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  expect(await events(page)).toEqual(["/books/pip-sits/start"]);

  await page.locator("#page-2 .read-aloud-btn").click();
  await page.locator(".story-finish-card").scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.evaluate(() => window.addEventListener("click", (e) => e.preventDefault()));
  await page.locator('a[href$=".pdf"]').first().click();
  await page.locator('a[href$=".pdf"]').first().click();
  expect(await events(page)).toEqual(["/books/pip-sits/start", "/books/pip-sits/listen", "/books/pip-sits/finish", "/books/pip-sits/pdf"]);
});

test("the book shelf sends nothing", async ({ page }) => {
  await debugPage(page);
  await page.goto("/read/");
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => window.__spReadEvents)).toBeUndefined();
  expect(await events(page)).toEqual([]);
});
