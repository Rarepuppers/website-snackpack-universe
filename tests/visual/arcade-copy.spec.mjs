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
// or wins is down to the dice. Supply legal rolls for one short ladder route
// and speed up timers, while reading the real game's status mutations.
test("Snakes & Ladders conjugates for 'You'", async ({ page }) => {
  test.setTimeout(30_000);
  await page.addInitScript(() => {
    // Choose inputs from the visible turn/position rather than relying on a
    // random win within a wall-clock budget. Animation frames consume random
    // values too, so a call-count sequence would be brittle.
    const route = { 0: 4, 14: 6, 38: 2, 59: 4, 81: 6, 87: 6, 93: 6, 99: 1 };
    Math.random = () => {
      const player = [...document.querySelectorAll("#s-playerlist .sl-pchip")].find(p => p.querySelector("strong")?.textContent === "You");
      const human = document.getElementById("s-turn")?.textContent === "You";
      const square = Number(player?.querySelector(".sl-ppos")?.textContent.replace("Square ", ""));
      const roll = human ? route[square] ?? 1 : 1;
      return (roll - 0.5) / 6;
    };
    const st = window.setTimeout, si = window.setInterval;
    window.setTimeout = (f, d, ...a) => st(f, Math.min(d || 0, 4), ...a);
    window.setInterval = (f, d, ...a) => si(f, Math.min(d || 0, 4), ...a);
    // The once-a-day donation modal opens on a first win and covers New game.
    const d = new Date(); localStorage.setItem("sp_donate_shown_on", d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"));
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
  const until = Date.now() + 20_000;
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

// Word Search's only sign of a find was the strike-through in the word list,
// which sits below the board and off-screen on a phone.
test("Word Search says which word was found and how many are left", async ({ page }) => {
  await page.goto("/play/word-search/");
  const found = await page.evaluate(() => {
    const cells = [...document.querySelectorAll("#ws-board .ws-cell")];
    const n = Math.round(Math.sqrt(cells.length));
    const letters = cells.map((c) => c.textContent.trim());
    const words = [...document.querySelectorAll("#ws-list [data-word]")].map((w) => w.dataset.word);
    for (const w of words) for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]]) {
      let ok = true;
      for (let k = 0; k < w.length && ok; k++) { const rr = r + dr * k, cc = c + dc * k; ok = rr >= 0 && cc >= 0 && rr < n && cc < n && letters[rr * n + cc] === w[k]; }
      if (ok) return { word: w, a: r * n + c, b: (r + dr * (w.length - 1)) * n + c + dc * (w.length - 1), total: words.length };
    }
    return null;
  });
  expect(found).not.toBeNull();
  await page.locator("#ws-board .ws-cell").nth(found.a).click();
  await page.locator("#ws-board .ws-cell").nth(found.b).click();
  await expect(page.locator("#ws-status")).toHaveText(`Found ${found.word} — ${found.total - 1} words to go.`);
});

// Flag Frenzy kept its progress under snackpack-flag-frenzy-*, outside the sp_
// namespace /stats/ shows and clears. Existing players' data must move across.
test("Flag Frenzy moves legacy progress into the sp_ namespace", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.setItem("snackpack-flag-frenzy-streak", "7");
    localStorage.setItem("snackpack-flag-frenzy-maxstreak", "9");
  });
  await page.goto("/play/flag-frenzy/");
  const keys = await page.evaluate(() => ({
    streak: localStorage.getItem("sp_flag_frenzy_streak"),
    max: localStorage.getItem("sp_flag_frenzy_maxstreak"),
    legacy: Object.keys(localStorage).filter((k) => k.startsWith("snackpack-flag-frenzy-")),
  }));
  expect(keys.max).toBe("9");
  expect(keys.streak).not.toBeNull();
  expect(keys.legacy).toEqual([]);
});

// Thirteen's CPU always led its lowest single card. In Classic, where 2 is the
// lowest rank, a CPU holding the 3 of spades therefore opened with a 2 — the
// rules say the opening play must include the 3 of spades. Deal Classic games
// until a CPU opens, five times, and check every opening play.
test("Thirteen Classic: a CPU's opening play includes the 3 of spades", async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => { const st = window.setTimeout; window.setTimeout = (f, d, ...a) => st(f, Math.min(d || 0, 5), ...a); });
  await page.goto("/play/thirteen/");
  await page.locator('.seg [data-mode="classic"]').evaluate((b) => b.click());
  // Record the first cards to land on the table after each deal: later plays
  // replace them within milliseconds once the CPUs are sped up.
  await page.evaluate(() => {
    window.__openings = []; window.__fresh = false;
    const table = document.getElementById("t-tablecards");
    new MutationObserver(() => {
      if (!window.__fresh || !table.children.length) return;
      window.__fresh = false;
      window.__openings.push([...table.children].map((c) => c.getAttribute("aria-label")).join(", "));
    }).observe(table, { childList: true });
  });
  let cpuOpened = 0;
  for (let deal = 0; deal < 60 && cpuOpened < 5; deal++) {
    await page.evaluate(() => { window.__fresh = true; document.getElementById("t-new").click(); });
    await page.waitForTimeout(80);
    if (/lead the round/i.test(await page.locator("#t-status").textContent())) { await page.evaluate(() => { window.__fresh = false; }); continue; }
    cpuOpened++;
  }
  const openings = (await page.evaluate(() => window.__openings)).slice(-5);
  expect(openings.length).toBe(5);
  for (const o of openings) expect(o, `opening play "${o}"`).toMatch(/3 of spades/);
});
