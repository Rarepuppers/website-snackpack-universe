import { test, expect } from "@playwright/test";

// Thirteen's table label built "<name> leads" from the player's name, so when
// the human opened a round it read "You leads" (and "played by You").

test("Thirteen says 'You lead' when the player opens a round", async ({ page }) => {
  await page.goto("/play/thirteen/", { waitUntil: "load" });
  // Whoever holds the 3 of spades opens, so deal until that is the player.
  for (let i = 0; i < 40 && !/lead the round/i.test(await page.locator("#t-status").textContent()); i++) {
    await page.locator("#t-new").click();
  }
  await expect(page.locator("#t-status")).toContainText(/lead the round/i);
  await expect(page.locator("#t-tableby")).toHaveText("You lead");
});

// Snakes & Ladders built its messages the same way: "You wins!", "Snake! You
// slides to 6.", "Ladder! You climbs to 38." Whether the player meets a snake
// or wins is down to the dice, so the game's timers are sped up and games are
// played until the player has done both, reading every status line on the way.
test("Snakes & Ladders conjugates for 'You'", async ({ page }) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => {
    const st = window.setTimeout, si = window.setInterval;
    window.setTimeout = (f, d, ...a) => st(f, Math.min(d || 0, 4), ...a);
    window.setInterval = (f, d, ...a) => si(f, Math.min(d || 0, 4), ...a);
    // The once-a-day donation modal opens on a first win and covers New game.
    localStorage.setItem("sp_donate_shown_on", new Date().toISOString().slice(0, 10));
  });
  await page.goto("/play/snakes-and-ladders/", { waitUntil: "load" });
  await page.evaluate(() => {
    window.__lines = [];
    const el = document.getElementById("s-status");
    // Read each record, not el.textContent: a landing message is replaced by
    // "CPU 1 is rolling…" in the same task, before the observer runs.
    new MutationObserver(rs => rs.forEach(r => r.addedNodes.forEach(n => window.__lines.push(n.textContent)))).observe(el, { childList: true });
  });
  const seen = async () => {
    const lines = await page.evaluate(() => window.__lines);
    return { lines, move: lines.some(l => /^(Snake|Ladder)! You /.test(l)), win: lines.some(l => /^You \w+! Reached 100/.test(l)) };
  };
  const until = Date.now() + 150_000;
  let s = await seen();
  while (Date.now() < until && !(s.move && s.win)) {
    if (/Reached 100/.test(await page.locator("#s-status").textContent())) await page.locator("#s-new").click();
    const roll = page.locator("#s-roll");
    if (await roll.isEnabled()) await roll.click(); else await page.waitForTimeout(20);
    s = await seen();
  }
  expect(s.move, "the player never met a snake or ladder").toBe(true);
  expect(s.win, "the player never won").toBe(true);
  expect(s.lines.filter(l => /\bYou (wins|slides|climbs)\b/.test(l))).toEqual([]);
});
