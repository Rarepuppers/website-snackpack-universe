import { test, expect } from "@playwright/test";
import fs from "node:fs";

// Snack Typer (/play/typing/). The engine tests run the page's own engine block
// (sliced out of the shipped HTML, not re-implemented); the browser tests type
// through the real page.

const html = fs.readFileSync("play/typing/index.html", "utf8");
function pageEngine() {
  const engine = html.slice(html.indexOf("// ════ Engine"), html.indexOf("// ════ UI"));
  expect(engine.length).toBeGreaterThan(1000);
  return new Function(engine + "\nreturn ENGINE;")();
}

test("every word lesson only uses keys the child has learned", () => {
  const E = pageEngine();
  for (const name of ["home", "top", "bottom", "letters"]) {
    const L = E.LESSONS[name];
    expect(L.words.length, name + " needs enough words for a run").toBeGreaterThanOrEqual(L.count + 8);
    expect(new Set(L.words).size, name + " has duplicates").toBe(L.words.length);
    for (const w of L.words) for (const ch of w) expect(L.keys, `${name}: "${w}" uses ${ch}`).toContain(ch);
  }
  // The rows actually teach something new each time.
  expect(E.LESSONS.top.words.every((w) => /[qwertyuiop]/.test(w))).toBe(true);
  expect(E.LESSONS.bottom.words.every((w) => /[zxcvbnm]/.test(w))).toBe(true);
});

test("story sentences are typeable and link to books that exist", () => {
  const E = pageEngine();
  for (const name of ["readers", "stories"]) {
    for (const [text, slug, title] of E.LESSONS[name].lines) {
      expect(text, "straight ASCII only").toMatch(/^[A-Za-z ,.!?'-]+$/);
      expect(fs.existsSync(`read/${slug}/index.html`), slug).toBe(true);
      const page = fs.readFileSync(`read/${slug}/index.html`, "utf8");
      expect(page.replace(/<[^>]+>/g, "").replace(/[’‘]/g, "'"), `${slug} still contains "${text}"`).toContain(text);
      expect(page, `${slug} title`).toContain(title);
    }
  }
});

test("runs, the daily and scoring", () => {
  const E = pageEngine();
  const run = E.buildRun("home", E.mulberry32(7));
  expect(run.text.split(" ")).toHaveLength(12);
  const sentences = E.buildRun("readers", E.mulberry32(7));
  expect(sentences.sources.length).toBeGreaterThan(0);
  expect(E.buildDaily("2026-11-26")).toEqual(E.buildDaily("2026-11-26"));
  expect(E.buildDaily("2026-11-26").text).not.toBe(E.buildDaily("2026-11-27").text);
  expect(E.wpm(250, 60000)).toBe(50);
  expect(E.accuracy(98, 2)).toBe(98);
  expect([E.stars(98), E.stars(97.9), E.stars(95), E.stars(90), E.stars(89.9)]).toEqual([3, 2, 2, 1, 0]);
  expect(E.fingerFor("F")).toBe("li");
  expect(E.fingerFor(" ")).toBe("th");
  expect(E.fingerFor(";")).toBe("rp");
});

async function typeRun(page, { mistakes = 0 } = {}) {
  const text = await page.locator("#ty-chars").textContent();
  await page.locator("#ty-text").click();
  for (let i = 0; i < mistakes; i++) await page.keyboard.type("#");
  await page.keyboard.type(text, { delay: 5 });
  return text;
}

test("typing a whole lesson gives stars, a record and the finger hint", async ({ page }) => {
  await page.goto("/play/typing/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator("#ty-finger")).toContainText("finger");
  await expect(page.locator(".ty-key.next")).toHaveCount(1);
  const text = await typeRun(page);
  expect(text.length).toBeGreaterThan(20);
  await expect(page.locator("#ty-result")).toBeVisible();
  await expect(page.locator("#ty-stars")).toHaveText("★★★");
  await expect(page.locator("#ty-best")).toContainText("★★★");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("sp_typing_best_home")).stars)).toBe(3);
});

test("a wrong key turns red, does not advance, and costs accuracy", async ({ page }) => {
  await page.goto("/play/typing/");
  await page.locator("#ty-text").click();
  const first = (await page.locator("#ty-chars").textContent())[0];
  await page.keyboard.type(first === "x" ? "y" : "x");
  await expect(page.locator(".ty-ch").first()).toHaveClass(/miss/);
  await expect(page.locator("#ty-acc")).toHaveText("0%");
  await page.keyboard.type(first);
  await expect(page.locator(".ty-ch").first()).toHaveClass(/done/);
  await expect(page.locator(".ty-ch").nth(1)).toHaveClass(/cur/);
});

test("too many mistakes give no stars and no record", async ({ page }) => {
  await page.goto("/play/typing/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await typeRun(page, { mistakes: 30 });
  await expect(page.locator("#ty-stars")).toHaveText("☆☆☆");
  await expect(page.locator("#ty-result-body")).toContainText("one star needs 90%");
  expect(await page.evaluate(() => localStorage.getItem("sp_typing_best_home"))).toBeNull();
});

test("story sentences need capitals and link back to their book", async ({ page }) => {
  await page.goto("/play/typing/");
  await page.locator('[data-lesson="readers"]').click();
  const link = page.locator("#ty-source a").first();
  await expect(link).toHaveAttribute("href", /^\/read\/[a-z0-9-]+\/$/);
  const text = await page.locator("#ty-chars").textContent();
  expect(text).toMatch(/^[A-Z]/);
  await typeRun(page);
  await expect(page.locator("#ty-result")).toBeVisible();
});

test("today's daily is the same for everyone and counts on the daily hub", async ({ page, browser }) => {
  const today = new Date().toISOString().slice(0, 10);
  await page.goto("/play/typing/?daily=" + today);
  const a = await page.locator("#ty-chars").textContent();
  const other = await browser.newPage();
  await other.goto("/play/typing/?daily=" + today);
  expect(await other.locator("#ty-chars").textContent()).toBe(a);
  await other.close();
  await typeRun(page);
  await expect(page.locator("#ty-result")).toBeVisible();
  const done = await page.evaluate(() => window.SnackPackDaily.state().games);
  expect(Object.keys(done)).toContain("typing");
});

test("an unfinished lesson resumes where it stopped", async ({ page }) => {
  await page.goto("/play/typing/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const text = await page.locator("#ty-chars").textContent();
  await page.locator("#ty-text").click();
  await page.keyboard.type(text.slice(0, 6), { delay: 5 });
  await page.waitForTimeout(1200); // resume saves on a short debounce
  await page.reload();
  const prompt = page.getByRole("button", { name: /resume|continue/i }).first();
  if (await prompt.count()) await prompt.click();
  await expect(page.locator("#ty-chars")).toHaveText(text);
  await expect(page.locator(".ty-ch.done")).toHaveCount(6);
});

test("the live speed waits for a few seconds of typing", async ({ page }) => {
  await page.goto("/play/typing/");
  await page.locator("#ty-text").click();
  const text = await page.locator("#ty-chars").textContent();
  await page.keyboard.type(text.slice(0, 4));
  await expect(page.locator("#ty-wpm")).toHaveText("—");
});
