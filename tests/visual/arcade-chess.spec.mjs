import { test, expect } from "@playwright/test";

// Chess (2026-10-22). The engine and computer player are generated from the
// Vol 3 app (a Node run of 20 Hard-vs-Beginner games lives with the plan).
// These check the page: pieces draw, a move and the computer's reply happen
// through the board, Take back restores the position, Black lets the
// computer open, and Resign lands in the level's record.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const t = new Date();
    localStorage.setItem("sp_donate_shown_on", t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"));
  });
});

const sq = (page, name) => page.locator(`#ch-board .ch-sq[aria-label^="${name},"]`);
const pieces = (page) => page.locator("#ch-board .ch-sq img").count();

test("a move through the board gets a computer reply, and Take back undoes both", async ({ page }) => {
  await page.goto("/play/chess/");
  expect(await pieces(page)).toBe(32);
  // No draw to claim at the start (the button once showed despite `hidden`).
  await expect(page.locator("#ch-claim")).toBeHidden();
  // Every square is square, empty ranks included (they once collapsed).
  const heights = await page.locator("#ch-board .ch-sq").evaluateAll((s) => s.map((x) => Math.round(x.getBoundingClientRect().height)));
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
  // The piece art actually loads (it comes through the shared-asset pipeline).
  expect(await page.locator("#ch-board img").first().evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  await sq(page, "e2").click();
  await expect(sq(page, "e4")).toHaveAttribute("aria-label", /move here/);
  await sq(page, "e4").click();
  await expect(sq(page, "e4")).toHaveAttribute("aria-label", "e4, white pawn");
  await expect(page.locator("#ch-status")).toHaveText(/Your move|Check/, { timeout: 15_000 });
  // The computer moved one black piece: some black-piece square changed.
  const blackOnRank7or8 = await page.locator('#ch-board .ch-sq[aria-label*="black"]').evaluateAll((s) => s.map((x) => x.getAttribute("aria-label").split(",")[0]).join(" "));
  expect(blackOnRank7or8).not.toBe("a8 b8 c8 d8 e8 f8 g8 h8 a7 b7 c7 d7 e7 f7 g7 h7");
  await page.locator("#ch-undo").click();
  await expect(sq(page, "e2")).toHaveAttribute("aria-label", "e2, white pawn");
  await expect(sq(page, "e4")).toHaveAttribute("aria-label", "e4, empty");
  expect(await pieces(page)).toBe(32);
});

test("playing Black lets the computer open and flips the board", async ({ page }) => {
  await page.goto("/play/chess/");
  await page.locator('.seg [data-side="b"]').evaluate((b) => b.click());
  await expect(page.locator("#ch-status")).toHaveText(/Your move/, { timeout: 15_000 });
  // Black's back rank is at the bottom: the first square drawn is h1.
  await expect(page.locator("#ch-board .ch-sq").first()).toHaveAttribute("aria-label", /^h1,/);
  const white = await page.locator('#ch-board .ch-sq[aria-label*="white"]').count();
  expect(white).toBe(16);
  await expect(page.locator("#ch-move")).toHaveText("1");
});

test("resigning records a loss for the level, kept after a reload", async ({ page }) => {
  await page.goto("/play/chess/");
  await page.locator('.seg [data-level="hard"]').evaluate((b) => b.click());
  await page.locator("#ch-resign").click();
  await expect(page.locator("#ch-status")).toContainText("You resigned");
  await expect(page.locator("#ch-record")).toHaveText("0–1–0");
  await page.reload();
  await expect(page.locator("#ch-record")).toHaveText("0–1–0");
  await page.locator('.seg [data-level="beginner"]').evaluate((b) => b.click());
  await expect(page.locator("#ch-record")).toHaveText("0–0–0");
});
