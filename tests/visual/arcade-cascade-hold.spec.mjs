import { test, expect } from "@playwright/test";

// Cascade Hold on the web (2026-10-22), matching the app's 10-19 rule: hold
// once per piece, unlocked when the next piece locks; an empty hold takes the
// next piece; a swap brings the held piece back.

const NAMES = ["I", "O", "T", "S", "Z", "J", "L"];
const COLORS = ["#4FC3F7", "#FFD54F", "#BA68C8", "#81C784", "#E57373", "#64B5F6", "#FFB74D"];

test("Hold works once per piece and swaps the held piece back in", async ({ page }) => {
  await page.addInitScript(() => {
    const t = new Date();
    localStorage.setItem("sp_donate_shown_on", t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"));
  });
  await page.goto("/play/cascade/");
  const hold = page.locator("#cs-hold");
  // The colour of the falling piece, read from the top rows of an empty well.
  const activeType = () => page.evaluate((colors) => {
    const cells = [...document.querySelectorAll("#cs-well .cs-cell")].slice(0, 80);
    const rgb = (h) => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;
    const found = cells.map((c) => c.style.background).find((b) => colors.some((h) => rgb(h) === b));
    return colors.findIndex((h) => rgb(h) === found);
  }, COLORS);
  await expect(hold).toHaveAttribute("aria-label", "Hold piece, empty");
  await expect(hold).toBeEnabled();

  const first = await activeType();
  expect(first).toBeGreaterThanOrEqual(0);
  await page.keyboard.press("c");
  await expect(hold).toHaveAttribute("aria-label", `Hold piece, holding the ${NAMES[first]} piece`);
  await expect(hold).toBeDisabled();

  // A second hold on the same piece does nothing.
  await page.keyboard.press("c");
  await expect(hold).toHaveAttribute("aria-label", `Hold piece, holding the ${NAMES[first]} piece`);

  // Locking the piece unlocks Hold; holding again swaps the first piece back.
  await page.keyboard.press(" ");
  await expect(hold).toBeEnabled();
  const second = await activeType();
  await hold.click();
  await expect(hold).toHaveAttribute("aria-label", `Hold piece, holding the ${NAMES[second]} piece`);
  expect(await activeType()).toBe(first);

  // New game empties the hold.
  await page.locator("#cs-new").click();
  await expect(hold).toHaveAttribute("aria-label", "Hold piece, empty");
});
