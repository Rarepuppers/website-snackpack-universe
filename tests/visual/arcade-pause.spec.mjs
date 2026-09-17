import { test, expect } from "@playwright/test";

// Pause coverage for the arcade's real-time games.
//
// Seven games ran a requestAnimationFrame loop with no pause control and no
// visibilitychange handling. For the timed ones that lost you the run: the
// question/shot clock is a setTimeout, which keeps firing in a hidden tab, so
// answering the door auto-failed the live question or conceded the live shot.
// These specs drive the real path — document.hidden plus a visibilitychange —
// rather than trusting the Pause button, and they play full rounds, because a
// tween that never reports "done" would hang a game with every other
// assertion still green.

const GAMES = [
  "crossbar-challenge", "free-kick-curl", "goalkeeper-hero", "header-hero",
  "penalty-shootout", "soccer-trivia-sprint", "target-shooting-arena"
];

for (const slug of GAMES) {
  test(`${slug}: pause control works`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    // The Cloudflare beacon is an external host and never resolves offline;
    // that is environment noise, not a defect in the page.
    page.on("console", (m) => {
      if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text());
    });

    await page.goto(`/play/${slug}/`);
    const btn = page.locator("#sp-pause");
    await expect(btn, "pause button is mounted").toHaveCount(1);
    await expect(btn).toHaveText("Pause");

    const overlay = page.locator(".sp-pause-overlay");
    await expect(overlay).toHaveCount(1);
    await expect(overlay).not.toHaveClass(/is-open/);

    // Pause via the button.
    await btn.click();
    await expect(overlay, "overlay opens on pause").toHaveClass(/is-open/);
    await expect(btn).toHaveText("Resume");
    await expect(btn).toHaveAttribute("aria-pressed", "true");

    // The overlay must actually cover the stage, or play continues underneath.
    const covered = await page.evaluate(() => {
      const o = document.querySelector(".sp-pause-overlay");
      const s = document.querySelector(".game-stage");
      const a = o.getBoundingClientRect(), b = s.getBoundingClientRect();
      // inset:0 sits inside the stage's 1px border, so allow a few px.
      return a.width >= b.width - 4 && a.height >= b.height - 4 && a.width > 0;
    });
    expect(covered, "overlay covers the stage").toBe(true);

    // Escape resumes.
    await page.keyboard.press("Escape");
    await expect(overlay).not.toHaveClass(/is-open/);
    await expect(btn).toHaveText("Pause");

    // P toggles.
    await page.keyboard.press("p");
    await expect(overlay).toHaveClass(/is-open/);
    await page.keyboard.press("p");
    await expect(overlay).not.toHaveClass(/is-open/);

    expect(errors, "no console/page errors").toEqual([]);
  });
}

// The real defect: a timed game must not run its clock out while paused.
test("soccer-trivia-sprint: the question clock is held while paused", async ({ page }) => {
  await page.goto("/play/soccer-trivia-sprint/");
  const status = page.locator("#trivia-status");
  await expect(status).toContainText("Question 1");

  await page.locator("#sp-pause").click();
  // Rookie questions allow far less than 8s; if the clock ran we'd auto-fail.
  await page.waitForTimeout(8000);
  await expect(status, "still on question 1 after 8s paused").toContainText("Question 1");

  await page.keyboard.press("Escape");
  // Answer it: options must still be live after the resume.
  const opts = page.locator("#trivia-options button");
  await expect(opts.first()).toBeEnabled();
});

test("goalkeeper-hero: the shot clock is held while paused", async ({ page }) => {
  await page.goto("/play/goalkeeper-hero/");
  const status = page.locator("#gk-status");
  await expect(status).toContainText("Shot 1");
  await page.locator("#sp-pause").click();
  await page.waitForTimeout(6000);
  await expect(status, "shot 1 not conceded while paused").toContainText("Shot 1");
});

test("header-hero: the cross is not lost while paused", async ({ page }) => {
  await page.goto("/play/header-hero/");
  const status = page.locator("#hh-status");
  await expect(status).toContainText("Cross 1");
  await page.locator("#sp-pause").click();
  await page.waitForTimeout(6000);
  await expect(status, "cross 1 still live after a long pause").toContainText("Cross 1");
});

// A full round, played. The pause work restructured the shot tweens in
// crossbar-challenge, free-kick-curl and penalty-shootout, and a tween that
// never reports "done" would hang the game with every other assertion green.

function watch(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text());
  });
  return errors;
}

test("crossbar-challenge: plays 15 shots through to the finish", async ({ page }) => {
  const errors = watch(page);
  await page.goto("/play/crossbar-challenge/");
  const shot = page.locator("#cb-shot");
  await expect(shot).toHaveText("1/15");
  for (let i = 0; i < 15; i++) {
    const btn = page.locator("#cb-shoot");
    await expect(btn, `shoot re-enabled for shot ${i + 1}`).toBeEnabled({ timeout: 8000 });
    await btn.click();
    if (i < 14) await expect(shot).toHaveText(`${i + 2}/15`, { timeout: 8000 });
  }
  await expect(page.locator("#cb-status")).toContainText(/final|finished|scored|Best|run/i, { timeout: 8000 });
  expect(errors).toEqual([]);
});

test("free-kick-curl: plays 10 kicks through to the finish", async ({ page }) => {
  const errors = watch(page);
  await page.goto("/play/free-kick-curl/");
  const kick = page.locator("#fk-kick");
  await expect(kick).toHaveText("1/10");
  for (let i = 0; i < 10; i++) {
    const btn = page.locator("#fk-shoot");
    await expect(btn, `shoot re-enabled for kick ${i + 1}`).toBeEnabled({ timeout: 8000 });
    await btn.click();
    if (i < 9) await expect(kick).toHaveText(`${i + 2}/10`, { timeout: 8000 });
  }
  expect(errors).toEqual([]);
});

test("crossbar-challenge: a shot paused in mid-air still resolves", async ({ page }) => {
  const errors = watch(page);
  await page.goto("/play/crossbar-challenge/");
  await page.locator("#cb-shoot").click();
  // Catch the ball mid-flight (the tween runs 760ms).
  await page.waitForTimeout(200);
  await page.keyboard.press("p");
  await expect(page.locator(".sp-pause-overlay")).toHaveClass(/is-open/);
  await page.waitForTimeout(1500);
  // Still shot 1: the flight was frozen, not resolved behind the overlay.
  await expect(page.locator("#cb-shot")).toHaveText("1/15");
  await page.keyboard.press("Escape");
  // And it completes normally afterwards.
  await expect(page.locator("#cb-shot")).toHaveText("2/15", { timeout: 8000 });
  await expect(page.locator("#cb-shoot")).toBeEnabled({ timeout: 8000 });
  expect(errors).toEqual([]);
});

test("penalty-shootout: a kick paused in mid-air still resolves", async ({ page }) => {
  const errors = watch(page);
  await page.goto("/play/penalty-shootout/");
  await page.locator("#pk-pad button").first().click();
  await page.waitForTimeout(200);
  await page.keyboard.press("p");
  await expect(page.locator(".sp-pause-overlay")).toHaveClass(/is-open/);
  await page.waitForTimeout(1500);
  await page.keyboard.press("Escape");
  // The shootout must hand control back rather than stalling mid-beat.
  await expect(page.locator("#pk-pad button").first()).toBeEnabled({ timeout: 10000 });
  expect(errors).toEqual([]);
});

test("target-shooting-arena: the target resumes moving after a pause", async ({ page }) => {
  const errors = watch(page);
  await page.goto("/play/target-shooting-arena/");
  await page.locator("#sp-pause").click();
  await page.waitForTimeout(600);
  await page.keyboard.press("Escape");
  // Shooting still works after the loop was torn down and restarted.
  const btn = page.locator("#ts-shoot");
  await expect(btn).toBeEnabled();
  await btn.click();
  await expect(page.locator("#ts-shot")).toHaveText("2/12", { timeout: 8000 });
  expect(errors).toEqual([]);
});

// The original defect, reproduced through the path that caused it: the tab
// going to the background. pause.js auto-pauses on visibilitychange, so this
// drives document.hidden directly rather than trusting the button.
async function background(page, ms) {
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(ms);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

test("soccer-trivia-sprint: a backgrounded tab no longer auto-fails the question", async ({ page }) => {
  await page.goto("/play/soccer-trivia-sprint/");
  await expect(page.locator("#trivia-status")).toContainText("Question 1");
  await background(page, 9000);
  await expect(page.locator(".sp-pause-overlay"), "auto-paused while hidden").toHaveClass(/is-open/);
  await expect(page.locator("#trivia-status"), "question survived the tab switch").toContainText("Question 1");
  await expect(page.locator("#trivia-streak")).toHaveText("0");
  // Deliberately does not auto-resume; the player resumes when ready.
  await page.keyboard.press("Escape");
  await expect(page.locator(".sp-pause-overlay")).not.toHaveClass(/is-open/);
  await expect(page.locator("#trivia-options button").first()).toBeEnabled();
});

test("goalkeeper-hero: a backgrounded tab no longer concedes the shot", async ({ page }) => {
  await page.goto("/play/goalkeeper-hero/");
  await expect(page.locator("#gk-status")).toContainText("Shot 1");
  await background(page, 7000);
  await expect(page.locator(".sp-pause-overlay")).toHaveClass(/is-open/);
  await expect(page.locator("#gk-shot"), "still on shot 1").toHaveText("1/12");
  await page.keyboard.press("Escape");
  await expect(page.locator("#gk-status")).toContainText("Shot 1");
});

test("header-hero: a backgrounded tab no longer burns the cross", async ({ page }) => {
  await page.goto("/play/header-hero/");
  await background(page, 7000);
  await expect(page.locator(".sp-pause-overlay")).toHaveClass(/is-open/);
  await expect(page.locator("#hh-cross"), "still on cross 1").toHaveText("1/12");
  await page.keyboard.press("Escape");
  await expect(page.locator("#hh-head")).toBeEnabled({ timeout: 5000 });
});
