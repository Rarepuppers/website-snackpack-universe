import { test, expect } from "@playwright/test";

// Rummy 500 (2026-10-22): a whole quick game through the page's own buttons —
// draw, lay a meld when the hint says one is ready, lay off on a highlighted
// meld, discard — to a result, which must land in the record. Timers are sped up.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const st = window.setTimeout;
    window.setTimeout = (f, d, ...a) => st(f, Math.min(d || 0, 5), ...a);
    const t = new Date();
    localStorage.setItem("sp_donate_shown_on", t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"));
  });
});

test("a quick game plays to a result through the page and is recorded", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/play/rummy-500/");
  await page.locator('.seg [data-target="250"]').evaluate((b) => b.click());
  let melds = 0, layoffs = 0;
  const RANK = { Ace: 1, Jack: 11, Queen: 12, King: 13 }, SUITS = ["clubs", "diamonds", "spades", "hearts"];
  const parse = (label) => { const [r, , s] = label.split(" "); return { r: RANK[r] || +r, s: SUITS.indexOf(s) }; };
  // The player's own meld search, from the visible card labels: a set of
  // three of a rank, or three in a row in one suit.
  function findMeld(cards) {
    for (let i = 0; i < cards.length; i++) {
      const same = cards.map((c, j) => j).filter((j) => cards[j].r === cards[i].r);
      if (same.length >= 3) return same.slice(0, 3);
      const a = cards.findIndex((c) => c.s === cards[i].s && c.r === cards[i].r + 1), b = cards.findIndex((c) => c.s === cards[i].s && c.r === cards[i].r + 2);
      if (a >= 0 && b >= 0) return [i, a, b];
    }
    return null;
  }
  for (let k = 0; k < 3000; k++) {
    const status = await page.locator("#rm-status").textContent();
    if (/You win|wins with/.test(status)) break;
    const next = page.locator("#rm-next");
    if (await next.count()) { await next.click(); continue; }
    if (await page.locator("#rm-stock").isEnabled()) { await page.locator("#rm-stock").click(); continue; }
    const hand = page.locator("#rm-hand button.tc-card:not([disabled])");
    const labels = await hand.evaluateAll((bs) => bs.map((b) => b.getAttribute("aria-label")));
    if (!labels.length) { await page.waitForTimeout(10); continue; }
    const meld = findMeld(labels.map(parse));
    if (meld) {
      for (const j of meld) await hand.nth(j).click();
      await expect(page.locator("#rm-meld")).toBeEnabled();
      await page.locator("#rm-meld").click(); melds++;
      continue;
    }
    // One lay-off try per turn with the last card; otherwise discard it.
    await hand.last().click();
    const target = page.locator("button.rm-meld");
    if (labels.length > 1 && await target.count()) { await target.first().click(); layoffs++; continue; }
    await page.locator("#rm-discard-btn").click();
  }
  await expect(page.locator("#rm-status")).toContainText(/You win|wins with/);
  const rec = (await page.locator("#rm-record").textContent()).split("–").map(Number);
  expect(rec[0] + rec[1]).toBe(1);
  console.log(`laid ${melds} melds and ${layoffs} lay-offs through the page`);
  await page.reload();
  const again = (await page.locator("#rm-record").textContent()).split("–").map(Number);
  expect(again[0] + again[1]).toBe(1);
});

test("the daily game deals the same hand to everyone", async ({ browser }) => {
  const hands = [];
  for (let i = 0; i < 2; i++) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/play/rummy-500/?daily=2026-10-22");
    hands.push(await page.locator("#rm-hand .tc-card").evaluateAll((cs) => cs.map((c) => c.getAttribute("aria-label")).join(", ")));
    await ctx.close();
  }
  expect(hands[0].split(", ")).toHaveLength(13);
  expect(hands[0]).toBe(hands[1]);
});
