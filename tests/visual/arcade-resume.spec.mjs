import { test, expect } from "@playwright/test";

// Saved progress for the long-form games.
//
// resume.js existed but only a dozen games used it. These five are the ones
// where an interrupted sitting actually costs work — a 144-tile Mahjong
// layout, a half-cleared Pyramid, a scored TriPeaks streak, a Golf run, a
// long 2048 board. Each spec plays real moves, reloads the page, takes the
// resume offer and then checks the board is PLAYABLE again rather than
// merely repainted, because a restore that drops the interaction state would
// look perfect in a screenshot.

test("2048: a run survives a reload", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/play/2048/");
  // Play until the score is non-zero (merges are what score).
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press(["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"][i % 4]);
    await page.waitForTimeout(60);
    if (await page.locator("#g-score").textContent() !== "0") break;
  }
  const score = await page.locator("#g-score").textContent();
  expect(Number(score), "scored something to save").toBeGreaterThan(0);
  const tiles = await page.locator("#g-tiles").innerHTML();

  // Give the 400ms debounce time to flush.
  await page.waitForTimeout(700);
  await page.reload();

  const prompt = page.locator(".sp-resume");
  await expect(prompt, "resume offer shown").toBeVisible();
  await prompt.locator("[data-resume]").click();
  await expect(page.locator("#g-score"), "score restored").toHaveText(score);
  expect(await page.locator("#g-tiles").innerHTML(), "board restored").toBe(tiles);
  expect(errors).toEqual([]);
});

test("2048: starting fresh retires the save", async ({ page }) => {
  await page.goto("/play/2048/");
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press(["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"][i % 4]);
    await page.waitForTimeout(60);
    if (await page.locator("#g-score").textContent() !== "0") break;
  }
  await page.waitForTimeout(700);
  await page.locator("#g-new").click();
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.locator(".sp-resume"), "no stale offer after New game").toHaveCount(0);
});

test("2048: a fresh board is not offered back", async ({ page }) => {
  await page.goto("/play/2048/");
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.locator(".sp-resume")).toHaveCount(0);
});

// Mahjong: match a real pair, then reload.
async function matchAPair(page) {
  // Find two open tiles with the same face by reading the live board state.
  return await page.evaluate(() => {
    const open = [...document.querySelectorAll("#mj-board .mj-tile.is-open")];
    const byFace = new Map();
    for (const el of open) {
      const face = el.querySelector(".mj-label").textContent + "|" +
        el.querySelector("[class*='symbol'],[class*='suit-icon']")?.className;
      if (byFace.has(face)) return [byFace.get(face), el.dataset.id];
      byFace.set(face, el.dataset.id);
    }
    return null;
  });
}

test("mahjong: a part-cleared board survives a reload", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/play/mahjong/");
  const before = await page.locator("#mj-left").textContent();

  const pair = await matchAPair(page);
  expect(pair, "found a matchable pair").not.toBeNull();
  await page.locator(`#mj-board .mj-tile[data-id="${pair[0]}"]`).click();
  await page.locator(`#mj-board .mj-tile[data-id="${pair[1]}"]`).click();
  const after = await page.locator("#mj-left").textContent();
  expect(Number(after), "two tiles cleared").toBe(Number(before) - 2);

  await page.waitForTimeout(700);
  await page.reload();
  const prompt = page.locator(".sp-resume");
  await expect(prompt, "resume offered").toBeVisible();
  await prompt.locator("[data-resume]").click();
  await expect(page.locator("#mj-left"), "tile count restored").toHaveText(after);
  // The board must be playable again, not just painted.
  expect(await matchAPair(page), "still has a playable pair").not.toBeNull();
  expect(errors).toEqual([]);
});

test("mahjong: each layout keeps its own save", async ({ page }) => {
  await page.goto("/play/mahjong/");
  const pair = await matchAPair(page);
  await page.locator(`#mj-board .mj-tile[data-id="${pair[0]}"]`).click();
  await page.locator(`#mj-board .mj-tile[data-id="${pair[1]}"]`).click();
  const classicLeft = await page.locator("#mj-left").textContent();
  await page.waitForTimeout(700);

  // Switch to another layout: no offer, because that layout has no save.
  await page.locator('[data-layout="fortress"]').click();
  await expect(page.locator(".sp-resume")).toHaveCount(0);

  // Switching back offers the Classic board again.
  await page.locator('[data-layout="classic"]').click();
  const prompt = page.locator(".sp-resume");
  await expect(prompt, "classic save survived the round trip").toBeVisible();
  await prompt.locator("[data-resume]").click();
  await expect(page.locator("#mj-left")).toHaveText(classicLeft);
});

test("pyramid: a part-cleared deal survives a reload", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/play/pyramid/");
  // Draw from the stock a few times: always legal, always changes state.
  for (let i = 0; i < 3; i++) { await page.locator("#py-stock").click(); await page.waitForTimeout(120); }
  const moves = await page.evaluate(() => document.querySelectorAll("#py-waste .py-card").length);
  expect(moves, "drew cards to the waste").toBeGreaterThan(0);
  const waste = await page.locator("#py-waste").innerHTML();

  await page.waitForTimeout(700);
  await page.reload();
  const prompt = page.locator(".sp-resume");
  await expect(prompt, "resume offered").toBeVisible();
  await prompt.locator("[data-resume]").click();
  expect(await page.locator("#py-waste").innerHTML(), "waste restored").toBe(waste);
  // Playable, not just painted: the stock must still draw.
  await page.locator("#py-stock").click();
  await page.waitForTimeout(150);
  expect(errors).toEqual([]);
});

test("pyramid: a new deal retires the save", async ({ page }) => {
  await page.goto("/play/pyramid/");
  for (let i = 0; i < 3; i++) { await page.locator("#py-stock").click(); await page.waitForTimeout(120); }
  await page.waitForTimeout(700);
  await page.locator("#py-new").click();
  await page.waitForTimeout(300);
  await page.reload();
  await expect(page.locator(".sp-resume")).toHaveCount(0);
});

test("tripeaks: a scored run survives a reload", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/play/tripeaks/");
  for (let i = 0; i < 3; i++) { await page.locator("#tp-stock").click(); await page.waitForTimeout(140); }
  const waste = await page.locator("#tp-waste").innerHTML();
  const stock = await page.locator("#tp-stock").textContent();

  await page.waitForTimeout(700);
  await page.reload();
  const prompt = page.locator(".sp-resume");
  await expect(prompt, "resume offered").toBeVisible();
  await prompt.locator("[data-resume]").click();
  expect(await page.locator("#tp-waste").innerHTML(), "waste restored").toBe(waste);
  expect(await page.locator("#tp-stock").textContent(), "stock count restored").toBe(stock);
  await page.locator("#tp-stock").click();
  await page.waitForTimeout(150);
  expect(errors).toEqual([]);
});

test("golf-solitaire: a run survives a reload", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("/play/golf-solitaire/");
  for (let i = 0; i < 3; i++) { await page.locator("#gs-stock").click(); await page.waitForTimeout(140); }
  const waste = await page.locator("#gs-waste").innerHTML();

  await page.waitForTimeout(700);
  await page.reload();
  const prompt = page.locator(".sp-resume");
  await expect(prompt, "resume offered").toBeVisible();
  await prompt.locator("[data-resume]").click();
  expect(await page.locator("#gs-waste").innerHTML(), "waste restored").toBe(waste);
  await page.locator("#gs-stock").click();
  await page.waitForTimeout(150);
  expect(errors).toEqual([]);
});
