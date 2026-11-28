import { test, expect } from "@playwright/test";
import fs from "node:fs";

// Fact Sprint (/play/math-facts/). Engine tests run the page's own engine block
// (sliced out of the shipped HTML); browser tests play through the real page.

const html = fs.readFileSync("play/math-facts/index.html", "utf8");
function pageEngine() {
  const engine = html.slice(html.indexOf("// ════ Engine"), html.indexOf("// ════ UI"));
  expect(engine.length).toBeGreaterThan(1000);
  return new Function(engine + "\nreturn ENGINE;")();
}
const OPS = { "+": (x, y) => x + y, "−": (x, y) => x - y, "×": (x, y) => x * y, "÷": (x, y) => x / y };

test("every fact is right, whole and in range", () => {
  const E = pageEngine();
  const sizes = {};
  for (const lesson of E.ORDER) {
    const all = E.facts(lesson, 0);
    sizes[lesson] = all.length;
    expect(new Set(all.map((f) => f.key)).size, lesson + " duplicates").toBe(all.length);
    for (const f of all) {
      expect(f.a, f.key).toBe(OPS[f.op](f.x, f.y));
      expect(Number.isInteger(f.a) && f.a >= 1, f.key).toBe(true);
    }
  }
  expect(E.facts("add10", 0).every((f) => f.a <= 10)).toBe(true);
  expect(E.facts("add20", 0).every((f) => f.a <= 20 && f.x <= 10 && f.y <= 10)).toBe(true);
  expect(E.facts("sub20", 0).every((f) => f.x <= 20 && f.y <= 10)).toBe(true);
  expect(E.facts("times", 7).every((f) => f.x === 7) && E.facts("times", 7).length).toBe(12);
  expect(E.facts("divide", 6).every((f) => f.y === 6 && f.a <= 12)).toBe(true);
  expect(sizes.mix).toBe(sizes.add20 + sizes.sub20 + sizes.times + sizes.divide);
  expect(sizes.add10).toBeGreaterThanOrEqual(40);
});

test("practice picks, requeues and scores", () => {
  const E = pageEngine();
  const q = E.pick(E.facts("times", 3), 20, E.mulberry32(1));
  expect(q).toHaveLength(20);
  for (let i = 1; i < q.length; i++) expect(q[i].key, "no fact twice in a row").not.toBe(q[i - 1].key);
  const requeued = E.requeue(q, 2, q[2]);
  expect(requeued).toHaveLength(21);
  expect(requeued[6].key).toBe(q[2].key); // three questions after the next one
  expect(E.requeue(q, 19, q[19])).toHaveLength(21); // at the end it goes last
  expect([0, 1, 2, 3, 4, 6, 7].map(E.stars)).toEqual([3, 3, 2, 2, 1, 1, 0]);
  const d = E.buildDaily("2026-11-26");
  expect(d).toHaveLength(20);
  expect(d.map((f) => f.key)).toEqual(E.buildDaily("2026-11-26").map((f) => f.key));
  expect(d.map((f) => f.key)).not.toEqual(E.buildDaily("2026-11-27").map((f) => f.key));
  for (const op of ["+", "−", "×", "÷"]) expect(d.filter((f) => f.op === op)).toHaveLength(5);
});

test("every lesson's number story exists", () => {
  const E = pageEngine();
  for (const lesson of E.ORDER) {
    const [slug, title] = E.LESSONS[lesson].book;
    const page = fs.readFileSync(`read/${slug}/index.html`, "utf8");
    expect(page.replace(/[’]/g, "'"), slug).toContain(title.split(" and ")[0].replace(/[’]/g, "'"));
  }
});

async function answer(page) {
  await page.waitForFunction(() => !document.querySelector("#mf-card").classList.contains("right") && !document.querySelector("#mf-card").classList.contains("wrong"));
  const q = await page.locator("#mf-question").textContent();
  const [x, op, y] = q.replace(" =", "").split(" ");
  return String(OPS[op](Number(x), Number(y)));
}

test("a perfect practice round gives three stars and a record", async ({ page }) => {
  await page.goto("/play/math-facts/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator("#mf-dots")).toContainText("●");
  for (let i = 0; i < 20; i++) await page.keyboard.type(await answer(page));
  await expect(page.locator("#mf-result")).toBeVisible();
  await expect(page.locator("#mf-stars")).toHaveText("★★★");
  expect(JSON.parse(await page.evaluate(() => localStorage.getItem("sp_math_facts_best_practice_add10"))).stars).toBe(3);
  await expect(page.locator("#mf-book a")).toHaveAttribute("href", "/read/cereal-swimmer-and-the-number-line-lagoon/");
});

test("a wrong answer shows the fact and brings it back", async ({ page }) => {
  await page.goto("/play/math-facts/");
  await page.locator('[data-lesson="times"]').click();
  const q = await page.locator("#mf-question").textContent();
  const right = await answer(page);
  const wrong = right.length === 1 ? (right === "9" ? "8" : "9") : "1" + "0".repeat(right.length - 1) === right ? "99".slice(0, right.length) : "1" + "0".repeat(right.length - 1);
  await page.keyboard.type(wrong);
  await expect(page.locator("#mf-feedback")).toHaveText(q + " " + right);
  await expect(page.locator("#mf-card")).toHaveClass(/wrong/);
  const seen = [];
  for (let i = 0; i < 6; i++) { seen.push(await page.locator("#mf-question").textContent()); await page.keyboard.type(await answer(page)); }
  expect(seen.slice(1)).toContain(q);
});

test("the on-screen pad works", async ({ page }) => {
  await page.goto("/play/math-facts/");
  const a = await answer(page);
  for (const d of a) await page.locator(`#mf-pad [data-k="${d}"]`).click();
  await expect(page.locator("#mf-score")).toHaveText("1");
});

test("a sprint ends after 60 seconds and keeps the best", async ({ page }) => {
  await page.clock.install();
  await page.goto("/play/math-facts/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('[data-mode="sprint"]').click();
  for (let i = 0; i < 6; i++) { await page.keyboard.type(await answer(page)); await page.clock.runFor(300); }
  await page.clock.runFor(61_000);
  await expect(page.locator("#mf-result-title")).toHaveText("6 correct in 60 seconds");
  await expect(page.locator("#mf-best")).toHaveText("6");
});

test("today's daily is shared and counts on the daily hub", async ({ page, browser }) => {
  const today = new Date().toISOString().slice(0, 10);
  await page.goto("/play/math-facts/?daily=today&classroom=1");
  const first = await page.locator("#mf-question").textContent();
  const other = await browser.newPage();
  await other.goto("/play/math-facts/?daily=" + today);
  expect(await other.locator("#mf-question").textContent()).toBe(first);
  await other.close();
  for (let i = 0; i < 20; i++) await page.keyboard.type(await answer(page));
  await expect(page.locator("#mf-result")).toBeVisible();
  expect(Object.keys(await page.evaluate(() => window.SnackPackDaily.state().games))).toContain("math-facts");
});

test("an unfinished practice round resumes", async ({ page }) => {
  await page.goto("/play/math-facts/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  for (let i = 0; i < 3; i++) await page.keyboard.type(await answer(page));
  await page.waitForTimeout(1500);
  const q = await page.locator("#mf-question").textContent();
  await page.reload();
  const prompt = page.getByRole("button", { name: /resume|continue/i }).first();
  if (await prompt.count()) await prompt.click();
  await expect(page.locator("#mf-score")).toHaveText("3");
  await expect(page.locator("#mf-question")).toHaveText(q);
});
