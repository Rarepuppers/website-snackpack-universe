import { test, expect } from "@playwright/test";

// Hearts and Spades (2026-10-17): play a whole quick game through the page's
// own buttons — pass, bid, legal cards only — to a result, and require the
// result to land in the per-difficulty record. Timers are sped up.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const st = window.setTimeout;
    window.setTimeout = (f, d, ...a) => st(f, Math.min(d || 0, 5), ...a);
    const t = new Date();
    localStorage.setItem("sp_donate_shown_on", t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"));
  });
});

async function playToEnd(page, prefix, endRe) {
  for (let k = 0; k < 6000; k++) {
    if (endRe.test(await page.locator(`#${prefix}-status`).textContent())) return;
    const next = page.locator(`#${prefix}-next`), pass = page.locator("#hc-pass"), bid = page.locator(".tc-bids button");
    if (await next.count()) { await next.click(); continue; }
    if (await bid.count()) { await page.locator(".tc-bids .btn-game--primary").click(); continue; }
    if (await pass.count()) {
      if (await pass.isDisabled()) { const cards = page.locator("#hc-hand button.tc-card"); for (const i of [0, 4, 8]) await cards.nth(i).click(); }
      else await pass.click();
      continue;
    }
    const legal = page.locator(".tc-hand button.tc-card:not([disabled])");
    const n = await legal.count();
    if (n) await legal.nth(Math.floor(Math.random() * n)).click(); else await page.waitForTimeout(10);
  }
  throw new Error("game did not finish");
}
const total = (t) => t.split("–").reduce((n, x) => n + Number(x), 0);

for (const level of ["standard", "sharp"]) {
test(`Hearts: a ${level} quick game plays to a result and is recorded`, async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/play/hearts/");
  await page.locator(`.seg [data-level="${level}"]`).evaluate((b) => b.click());
  await page.locator('.seg [data-target="50"]').evaluate((b) => b.click());
  // Passing takes exactly three cards.
  const cards = page.locator("#hc-hand button.tc-card");
  for (const i of [0, 1, 2, 3]) await cards.nth(i).click();
  await expect(page.locator("#hc-hand .is-picked")).toHaveCount(3);
  await playToEnd(page, "hc", /You win|wins with/);
  expect(total(await page.locator("#hc-record").textContent())).toBe(1);
  await page.reload();
  expect(total(await page.locator("#hc-record").textContent())).toBe(1);
});
}

test("Spades: a quick game plays to a result and is recorded", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/play/spades/");
  await page.locator('.seg [data-target="250"]').evaluate((b) => b.click());
  await playToEnd(page, "sp", /Your team (wins|loses)/);
  expect(total(await page.locator("#sp-record").textContent())).toBe(1);
  await page.reload();
  expect(total(await page.locator("#sp-record").textContent())).toBe(1);
});

test("Hearts and Spades daily games deal the same hands to everyone", async ({ browser }) => {
  for (const slug of ["hearts", "spades"]) {
    const hands = [];
    for (let i = 0; i < 2; i++) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(`/play/${slug}/?daily=2026-10-17`);
      hands.push(await page.locator(".tc-hand .tc-card").evaluateAll((cs) => cs.map((c) => c.getAttribute("aria-label")).join(", ")));
      await ctx.close();
    }
    expect(hands[0], slug).toBe(hands[1]);
  }
});
