import assert from "node:assert/strict";
import { open } from "./browser.mjs";

const { page, base, errors, close } = await open({ touch: true });
const saveKey = "sp_snackdrop_v1";
const url = base + "?dev=1&rush=1";

try {
  await page.goto(base + "?rush=1");
  await page.locator("[data-go=arcade]").waitFor();
  assert.equal(await page.locator("[data-go=rush]").count(), 0, "Rush is hidden without the dev flag");
  assert.equal(await page.locator("#rush-controls").isVisible(), false);

  const legacy = await page.evaluate((key) => {
    const SD = window.SnackDrop;
    const game = SD.createGame({ seed: 77, mode: "classic", container: "toybox" });
    game.step({ drop: 0 });
    const current = window.__snackdrop.save;
    current.resume = { mode: "classic", steps: 1, log: [[0, 0]], snap: game.snapshot() };
    current.bests["toybox:classic"] = { rules: SD.RULES_VERSION, score: 91 };
    current.daily["2026-11-28"] = { rules: SD.RULES_VERSION, score: 30, best: 30, first: 30 };
    for (let i = 0; i < 61; i++) {
      const day = new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10);
      current.daily[day] = { rules: SD.RULES_VERSION, best: i, first: i };
    }
    current.container = "toybox";
    localStorage.setItem(key, JSON.stringify(current));
    return JSON.parse(JSON.stringify(current));
  }, saveKey);

  await page.goto(url);
  await page.locator("[data-go=rush]").tap();
  await page.locator("#rush-action").waitFor();
  assert.equal(await page.evaluate(() => window.__snackdrop.game.container), "pantry");
  assert.equal(await page.locator("#tray").isVisible(), false);

  const action = page.locator("#rush-action");
  await action.focus();
  await page.keyboard.press("Enter");
  assert.match(await action.textContent(), /Start burst/);
  const preview = await page.locator("#rush-lanes").innerText();
  assert.equal(await page.locator("#rush-lanes li").count(), 5);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#rush-lanes").isVisible(), false);
  await action.tap();
  assert.equal(await page.locator("#rush-lanes").innerText(), preview);
  assert.equal(await page.evaluate(() => window.__snackdrop.game.drops), 0, "keyboard preview does not also drop");
  if (process.argv[2]) await page.screenshot({ path: process.argv[2], scale: "css" });

  await action.tap();
  await page.waitForFunction(() => {
    const rush = window.__snackdrop.game.rush;
    if (!rush.active || !rush.drops) return false;
    document.querySelector("#pause").click();
    return true;
  });
  const checkpoint = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).rush.resume, saveKey);
  assert(checkpoint.snap.rush.active.spent);
  assert.equal(checkpoint.snap.rush.charges, 0);
  assert(checkpoint.log.some((e) => e[1] === "rush"));

  await page.reload();
  await page.locator("[data-act=continue-rush]").tap();
  await page.waitForFunction(() => window.__snackdrop.game.rush?.drops === 5 && !window.__snackdrop.game.rush.active);
  const resumed = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), saveKey);
  assert.equal(resumed.rush.resume.snap.rush.charges, 0);
  assert.equal(resumed.rush.resume.snap.rush.drops, 5);
  assert.equal(resumed.rush.resume.snap.drops, 0);
  for (const key of ["resume", "bests", "daily", "counters", "biggest", "container", "mode"]) {
    assert.deepEqual(resumed[key], legacy[key], `Rush keeps legacy ${key}`);
  }

  // Finish a saved Rush run via the real danger check and verify the local best.
  const ending = await page.evaluate((key) => {
    const SD = window.SnackDrop;
    const current = JSON.parse(localStorage.getItem(key));
    const snap = current.rush.resume.snap;
    snap.score = 321;
    snap.snacks = [[snap.nextId++, 8, 0, SD.CRATE.line, 0, 0, 0, 0, snap.time, 1, SD.BALANCE.overLimit - SD.STEP / 2]];
    return current;
  }, saveKey);
  // Install the fixture on the next load. The live page saves on pagehide.
  await page.addInitScript(({ key, value }) => {
    if (sessionStorage.getItem("rush-test-ending")) return;
    sessionStorage.setItem("rush-test-ending", "1");
    localStorage.setItem(key, JSON.stringify(value));
  }, { key: saveKey, value: ending });
  await page.reload();
  await page.locator("[data-act=continue-rush]").tap();
  try {
    await page.getByRole("heading", { name: "New Rush best!" }).waitFor({ timeout: 10000 });
  } catch (error) {
    const state = await page.evaluate(() => {
      const { game, save } = window.__snackdrop;
      return { mode: game.mode, status: game.status, score: game.score, danger: game.danger,
        best: save.rush?.best, sheet: document.getElementById("sheet-title")?.textContent };
    });
    throw new Error(JSON.stringify({ state, errors }), { cause: error });
  }
  const finished = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), saveKey);
  assert.equal(finished.rush.best.score, 321);
  assert.equal(finished.rush.resume, null);
  for (const key of ["resume", "bests", "daily", "counters", "biggest"]) assert.deepEqual(finished[key], legacy[key]);

  await page.goto(base);
  await page.locator("[data-act=continue]").waitFor();
  assert.equal(await page.locator("[data-go=rush]").count(), 0);
  assert.equal(await page.locator("[data-act=continue-rush]").count(), 0);
  assert.deepEqual(errors, []);
  console.log("Rush browser checks passed.");
} finally {
  await close();
}
