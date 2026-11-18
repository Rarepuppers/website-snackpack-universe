import { test, expect } from "@playwright/test";
import fs from "node:fs";

const html = fs.readFileSync("play/thirteen/index.html", "utf8");
const engine = html.slice(html.indexOf("// ════ Engine"), html.indexOf("// ════ UI"));
const E = new Function("location", engine + "; return { identifyCombo, legalCombos, applyPass, applyPlay, cpuChoosePlay };")({ search: "" });
const training = new Function("window", "module", fs.readFileSync("play/thirteen/training.js", "utf8") +
  "; return [window.SnackPackThirteenTraining, module.exports];");
const [curriculum, Practice] = training({}, { exports: {} });

for (const activity of [...curriculum.lessons, ...curriculum.challenges]) {
  test(`authored proof solves ${activity.title}`, () => {
    for (const step of activity.steps) {
      const state = Practice.position(step, E.identifyCombo);
      const ids = [...state.players.flatMap(player => player.hand), ...(state.lastCombo?.cards ?? [])].map(card => card.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every(id => /^(?:[1-9]|1[0-3])-[0-3]$/.test(id))).toBe(true);
      if (step.opening) expect(ids).toHaveLength(52);
      if (step.table) expect(state.lastCombo).toBeTruthy();
      const attempts = [];
      let lostLead = false;
      for (const action of step.proof) {
        expect(state.currentPlayer).toBe(0);
        if (action === "pass") {
          expect(state.lastCombo).toBeTruthy();
          attempts.push("pass");
          E.applyPass(state, 0);
        } else {
          const combo = E.legalCombos(state, 0).find(move =>
            move.cards.length === action.length && move.cards.every(card => action.includes(card.id)));
          expect(combo).toBeTruthy();
          attempts.push(combo);
          E.applyPlay(state, 0, combo);
        }
        if (step.goal.kind !== "win") continue;
        for (let turn = 0; state.phase === "playing" && state.currentPlayer !== 0; turn++) {
          expect(turn).toBeLessThan(12);
          const seat = state.currentPlayer;
          const move = E.cpuChoosePlay(state, seat);
          if (move === "pass") E.applyPass(state, seat);
          else {
            lostLead = true;
            E.applyPlay(state, seat, move);
          }
        }
      }
      expect(Practice.meetsGoal(step.goal, attempts, state.winner === 0, lostLead)).toBe(true);
    }
  });
}

test("practice uses the table, keeps solo stats and restores the paused board", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.999; });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/play/thirteen/");
  const cards = page.locator("#t-hand button");
  const startingCards = await cards.evaluateAll(elements => elements.map(card => card.dataset.id));
  await page.locator("#t-learn summary").click();
  await page.getByRole("button", { name: "Open with 3♠" }).click();
  await page.getByRole("button", { name: "3 of spades", exact: true }).click();
  await page.locator("#t-play").click();
  await expect(page.locator("#t-practice-prompt")).toContainText("legal combination");
  await expect(page.locator("#t-tablecards")).toHaveText("3");
  await page.locator("#t-practice-next").click();
  await expect(page.locator("#t-record")).toHaveText("0–0");
  expect(await cards.evaluateAll(elements => elements.map(card => card.dataset.id))).toEqual(startingCards);
  await expect(page.getByRole("button", { name: /Open with 3♠.*Complete/ })).toBeFocused();
});

test("pace and high contrast persist after reload", async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.999; });
  await page.goto("/play/thirteen/");
  await page.getByText("Table settings", { exact: true }).click();
  await page.getByLabel("Game speed").selectOption("fast");
  await page.getByLabel("High-contrast cards").check();
  await expect(page.locator(".thirteen-table")).toHaveClass(/th-high-contrast/);
  await page.getByRole("button", { name: "Sort by suit" }).click();
  await expect(page.locator("#t-hand button").nth(1)).toHaveAttribute("data-id", "4-0");
  await page.reload();
  await expect(page.getByLabel("Game speed")).toHaveValue("fast");
  await expect(page.getByLabel("High-contrast cards")).toBeChecked();
  await expect(page.getByRole("button", { name: "Sort by rank" })).toBeVisible();
});

test("a series saves its score and resumes between deals", async ({ page }) => {
  await page.addInitScript(() => {
    const finishable = {
      version: 1, scoring: "cards", results: [], deal: 1,
      board: {
        phase: "playing", mode: "standard", currentPlayer: 0, winner: null,
        lastCombo: null, lastPlayerIdx: null, isFirstTurn: false, roundStarter: 0, passed: [], selected: [],
        players: [6, 7, 8, 9].map((value, id) => ({
          id, name: id === 0 ? "You" : "CPU " + id, hand: [{ value, suit: 0, id: value + "-0" }],
        })),
      },
    };
    if (!localStorage.getItem("sp_thirteen_series")) localStorage.setItem("sp_thirteen_series", JSON.stringify(finishable));
  });
  await page.goto("/play/thirteen/");
  await page.locator("#t-series-menu summary").click();
  await page.locator("#t-series-resume").click();
  await expect(page.locator("#t-series-title")).toHaveText("Deal 1 of 3 · Cards Left");
  await page.getByRole("button", { name: "6 of spades" }).click();
  await page.locator("#t-play").click();
  await expect(page.locator("#t-series-score")).toHaveText("You 0 · CPU 1 1 · CPU 2 1 · CPU 3 1");
  await page.reload();
  await page.locator("#t-series-menu summary").click();
  await page.locator("#t-series-resume").click();
  await expect(page.locator("#t-series-score")).toHaveText("You 0 · CPU 1 1 · CPU 2 1 · CPU 3 1");
  await page.locator("#t-series-next").click();
  await expect(page.locator("#t-series-title")).toHaveText("Deal 2 of 3 · Cards Left");
  await expect(page.locator("#t-hand button")).toHaveCount(13);
});

test("the featured Daily pins its rules and preserves dated legacy links", async ({ page }) => {
  await page.goto("/play/thirteen/?daily=2026-11-18&featured=1");
  await expect(page.locator("#t-daily-description")).toContainText("Standard · Normal");
  await expect(page.locator("#t-suggest")).toBeHidden();
  const hand = page.locator("#t-hand button");
  const first = await hand.evaluateAll(elements => elements.map(el => el.dataset.id));
  await page.goto("/play/thirteen/?daily=2026-11-18");
  await expect(page.locator("#t-daily-description")).toBeHidden();
  expect(await hand.evaluateAll(elements => elements.map(el => el.dataset.id))).toEqual(first);
});

test("cached Thirteen loads a featured Daily and its lessons offline", async ({ page, context }) => {
  await page.goto("/play/thirteen/");
  await page.waitForFunction(() => !!navigator.serviceWorker?.controller);
  await context.setOffline(true);
  await page.goto("/play/thirteen/?daily=2026-11-18&featured=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#t-daily-description")).toContainText("Standard · Normal");
  await expect(page.locator("#t-learn summary")).toBeVisible();
  await page.locator("#t-learn summary").click();
  await page.locator("#t-practice-opening").click();
  await expect(page.locator("#t-hand button")).toHaveCount(13);
});
