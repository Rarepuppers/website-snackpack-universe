import { test, expect } from "@playwright/test";

// Keyboard coverage for the arcade.
//
// check-new-game.mjs accepts either keyboard-grid.js or a written
// data-no-keyboard-reason. 25 games had neither. Playing each one with the
// keyboard alone showed that every one of them was ALREADY operable without a
// mouse — through direct key bindings, a text box, or controls that are real
// buttons Tab already reaches — so what was missing was the marker, not the
// support. Including goalkeeper-hero, which has no keydown handler at all but
// is played entirely through three Left/Centre/Right buttons.
//
// A data-no-keyboard-reason is therefore a CLAIM. These specs check the claim,
// not the attribute: each marked game is driven here by keyboard alone and has
// to respond.

// A data-no-keyboard-reason attribute is a CLAIM that the game is playable
// without a mouse. These specs check the claim rather than the attribute:
// every marked game is driven here by keyboard alone and has to respond.

const MARKED = ["2048","asteroid-destroyer","cascade","crossbar-challenge","crossword",
  "dribble-rush","flag-frenzy","flappy-snacky","free-kick-curl","goalkeeper-hero",
  "golf-solitaire","header-hero","kakuro","keepy-uppy","penalty-shootout","pyramid",
  "snackwords","snacky-worm","snakes-and-ladders","soccer-trivia-sprint","sudoku",
  "table-tennis","target-shooting-arena","thirteen","tripeaks"];

test("every marked game carries a reason that names real bindings", async ({ page }) => {
  const missing = [];
  for (const slug of MARKED) {
    await page.goto(`/play/${slug}/`);
    const reason = await page.getAttribute(".game-stage", "data-no-keyboard-reason");
    if (!reason || reason.length < 80 || !/Tab/.test(reason)) missing.push(slug);
  }
  expect(missing, "each marked game explains itself and mentions Tab").toEqual([]);
});

async function tabTo(page, selector, max = 45) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate((s) => !!document.activeElement?.matches(s), selector)) return true;
  }
  return false;
}

// Does the page actually consume this key? These games all call
// preventDefault() for the keys they own, so a cancelled event is proof the
// binding exists — used for the real-time canvas games where nothing in the
// DOM changes on a single keypress.
const consumes = (page, key) => page.evaluate((k) => {
  const ev = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true });
  document.dispatchEvent(ev);
  return ev.defaultPrevented;
}, key);

// ── Games where a keypress visibly changes the page ──────────────────────────
const observable = [
  { slug: "2048",                  keys: ["ArrowLeft","ArrowDown","ArrowRight","ArrowUp"], watch: "#g-tiles", html: true },
  { slug: "cascade",               keys: ["ArrowLeft"],  watch: "#cs-well", html: true },
  { slug: "crossword",             keys: ["A"],          watch: "#cw-grid", html: true },
  { slug: "snackwords",            keys: ["A"],          watch: "#sw-board", html: true },
  { slug: "crossbar-challenge",    keys: ["Enter"],      watch: "#cb-status", focus: "#cb-canvas" },
  { slug: "free-kick-curl",        keys: ["Enter"],      watch: "#fk-status", focus: "#fk-canvas" },
  { slug: "target-shooting-arena", keys: ["Enter"],      watch: "#ts-status", focus: "#ts-canvas" },
  { slug: "header-hero",           keys: [" "],          watch: "#hh-status" },
  { slug: "flappy-snacky",         keys: [" "],          watch: "#fl-status" },
  { slug: "dribble-rush",          keys: ["ArrowLeft"],  watch: "#dr-status" }
];

for (const c of observable) {
  test(`${c.slug}: responds to its documented keys`, async ({ page }) => {
    await page.goto(`/play/${c.slug}/`);
    const read = () => c.html ? page.locator(c.watch).innerHTML() : page.locator(c.watch).first().textContent();
    if (c.focus) { expect(await tabTo(page, c.focus), "Tab reaches the play area").toBe(true); }
    const before = await read();
    for (const k of c.keys) { await page.keyboard.press(k); await page.waitForTimeout(220); }
    await expect.poll(read, { timeout: 8000 }).not.toBe(before);
  });
}

// ── Real-time canvas games: the binding is the observable thing ──────────────
const cancels = [
  { slug: "asteroid-destroyer", key: "ArrowLeft" },
  { slug: "snacky-worm",        key: "ArrowUp" }
];
for (const c of cancels) {
  test(`${c.slug}: consumes its documented movement key`, async ({ page }) => {
    await page.goto(`/play/${c.slug}/`);
    expect(await consumes(page, c.key), `${c.key} is bound`).toBe(true);
  });
}

test("table-tennis: consumes its paddle keys once play has started", async ({ page }) => {
  await page.goto("/play/table-tennis/");
  // It only claims the keys while a rally is live, so start one by keyboard.
  expect(await tabTo(page, "#tt-start"), "Tab reaches Start").toBe(true);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  expect(await consumes(page, "ArrowUp"), "ArrowUp moves the paddle").toBe(true);
});

// ── Grid games that need a selected cell before digits mean anything ─────────
test("sudoku: arrows move the selection and digits fill it", async ({ page }) => {
  await page.goto("/play/sudoku/");
  expect(await tabTo(page, "#su-board .su-cell, #su-board [tabindex]"), "Tab reaches the grid").toBe(true);
  await page.keyboard.press("Enter");
  const before = await page.locator("#su-board").innerHTML();
  for (const k of ["ArrowRight","ArrowDown","5"]) { await page.keyboard.press(k); await page.waitForTimeout(150); }
  await expect.poll(() => page.locator("#su-board").innerHTML(), { timeout: 6000 }).not.toBe(before);
});

test("kakuro: digits fill the selected cell", async ({ page }) => {
  await page.goto("/play/kakuro/");
  expect(await tabTo(page, "#k-grid button, #k-grid [tabindex]"), "Tab reaches the grid").toBe(true);
  await page.keyboard.press("Enter");
  const before = await page.locator("#k-grid").innerHTML();
  await page.keyboard.press("3");
  await expect.poll(() => page.locator("#k-grid").innerHTML(), { timeout: 6000 }).not.toBe(before);
});

// ── Card games: playable cards are buttons, unplayable ones are disabled ────
// Tab therefore steps through only what you can actually play, which on some
// deals is nothing at all — then the stock is the only move, and it is a Tab
// stop of its own. A test that demanded a reachable card would fail on those
// deals for the right reason, so it checks the rule rather than the deal.
for (const [slug, cardSel, stockSel] of [
  ["golf-solitaire", "#gs-cols button", "#gs-draw"],
  ["pyramid",        "#py-pyramid button", "#py-draw"],
  ["tripeaks",       "#tp-peaks button", "#tp-draw"]
]) {
  test(`${slug}: the playable cards and the stock are keyboard-reachable`, async ({ page }) => {
    await page.goto(`/play/${slug}/`);
    const counts = await page.evaluate((sel) => {
      const all = [...document.querySelectorAll(sel)];
      return { total: all.length, enabled: all.filter((b) => !b.disabled).length };
    }, cardSel);
    expect(counts.total, "cards are rendered as real buttons").toBeGreaterThan(0);

    // Check the cards against THIS deal, before any reload changes it.
    if (counts.enabled > 0) {
      expect(await tabTo(page, cardSel + ":not([disabled])", 90), "Tab reaches a playable card").toBe(true);
      expect(await page.evaluate(() => document.activeElement.tagName)).toBe("BUTTON");
      expect(await page.evaluate(() => document.activeElement.disabled), "and it is not a dead one").toBe(false);
    }

    // The stock is there on every deal, so it is always a way to keep playing.
    await page.goto(`/play/${slug}/`);
    expect(await tabTo(page, stockSel, 90), "Tab reaches the stock").toBe(true);
  });
}

// ── Games driven entirely through buttons or a text box ─────────────────────
// No keydown handler at all in several of these; Tab and Enter are the game.

const cases = [
  { slug: "goalkeeper-hero",      move: "#gk-pad button",         watch: "#gk-shot" },
  { slug: "penalty-shootout",     move: "#pk-pad button",         watch: "#pk-status" },
  { slug: "keepy-uppy",           move: "#ku-kick",               watch: "#ku-status" },
  { slug: "snakes-and-ladders",   move: "#s-roll",                watch: "#s-status" },
  { slug: "soccer-trivia-sprint", move: "#trivia-options button", watch: "#trivia-status" },
];

for (const c of cases) {
  test(`${c.slug}: playable with the keyboard alone`, async ({ page }) => {
    await page.goto(`/play/${c.slug}/`);
    const before = await page.locator(c.watch).first().textContent();
    const reached = await tabTo(page, c.move);
    expect(reached, `Tab reaches ${c.move}`).toBe(true);
    await page.keyboard.press("Enter");
    // Some of these resolve through an animation and a beat, so poll rather
    // than sampling once.
    await expect.poll(() => page.locator(c.watch).first().textContent(), { timeout: 10000 })
      .not.toBe(before);
  });
}

// Flag Frenzy is a typed-answer game: the input and its submit button are the
// whole interface, so it is keyboard-native by construction.
test("flag-frenzy: playable with the keyboard alone", async ({ page }) => {
  await page.goto("/play/flag-frenzy/");
  const before = await page.locator("#ff-guess-count").textContent();
  expect(await tabTo(page, "#ff-input"), "Tab reaches the answer box").toBe(true);
  await page.keyboard.type("Brazil");
  await page.keyboard.press("Enter");
  await expect.poll(() => page.locator("#ff-guess-count").textContent(), { timeout: 8000 }).not.toBe(before);
});

// Thirteen selects cards and then plays them, and who leads depends on who was
// dealt the 3 of spades — so neither the legal card nor the opening status is
// fixed. What is always true, and is the thing the marker claims, is that the
// hand is real buttons: Tab reaches one and Enter selects it.
test("thirteen: playable with the keyboard alone", async ({ page }) => {
  await page.goto("/play/thirteen/");
  // Selection is ignored while the computer is mid-turn, so wait for the move.
  await expect(page.locator("#t-status")).toContainText("Your move", { timeout: 10000 });

  expect(await tabTo(page, ".th-card", 80), "Tab reaches a card in hand").toBe(true);
  expect(await page.evaluate(() => document.activeElement.tagName), "cards are real buttons").toBe("BUTTON");
  await page.keyboard.press("Enter");
  await expect(page.locator("#t-hand .th-card.is-selected"), "Enter selects the focused card").toHaveCount(1);

  // Play, Pass and Sort are reachable the same way.
  expect(await tabTo(page, "#t-sort", 90), "Tab reaches the Sort control").toBe(true);
});
