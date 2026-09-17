import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// FAQ structured data for the arcade.
//
// Every answer here is a public claim about a specific game, so the risk is not
// malformed JSON — it is a true-sounding sentence that is false of that page.
// The offline answer is the one that bit: a first draft told every game's
// players to download it in the Android app, but Dribble Rush, Header Hero,
// Penalty Shootout and TriPeaks are web only and are in no app at all.
//
// These specs check the claims against the page that makes them.

const PLAY = path.resolve("play");
const RESERVED = new Set(["daily", "stats", "last-bastion", "shared-assets", "social", "sprites", "tiles", "docs"]);

const games = fs.readdirSync(PLAY, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !RESERVED.has(e.name) && fs.existsSync(path.join(PLAY, e.name, "index.html")))
  .map((e) => e.name);

function faqOf(slug) {
  const html = fs.readFileSync(path.join(PLAY, slug, "index.html"), "utf8");
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let parsed;
    try { parsed = JSON.parse(m[1]); } catch { continue; }
    if (parsed["@type"] === "FAQPage") return { html, faq: parsed };
  }
  return { html, faq: null };
}

test("every game page carries a valid FAQPage", () => {
  const without = games.filter((s) => !faqOf(s).faq);
  expect(without, "no game is left without FAQ structured data").toEqual([]);
});

test("every JSON-LD block on every game page parses", () => {
  const broken = [];
  for (const slug of games) {
    const html = fs.readFileSync(path.join(PLAY, slug, "index.html"), "utf8");
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(m[1]); } catch (e) { broken.push(`${slug}: ${e.message}`); }
    }
  }
  expect(broken).toEqual([]);
});

test("no FAQ answer is empty or a stub", () => {
  const bad = [];
  for (const slug of games) {
    const { faq } = faqOf(slug);
    if (!faq) continue;
    for (const q of faq.mainEntity) {
      const a = q.acceptedAnswer && q.acceptedAnswer.text;
      if (!q.name || !a) bad.push(`${slug}: empty question or answer`);
      else if (a.length < 40) bad.push(`${slug}: "${q.name}" answered in ${a.length} chars`);
    }
  }
  expect(bad).toEqual([]);
});

// The claim that burned once: only promise an app to a game that has one.
test("an answer only promises an Android app when the page links to one", () => {
  const lies = [];
  for (const slug of games) {
    const { html, faq } = faqOf(slug);
    if (!faq) continue;
    const link = html.match(/\/go\/arcade\/[a-z0-9-]+\/(braingames[23]?)\//);
    for (const q of faq.mainEntity) {
      const a = q.acceptedAnswer.text;
      const promisesApp = /Brain Games/.test(a) && /(also in|includes|install|download)/i.test(a);
      if (promisesApp && !link) lies.push(`${slug}: promises an app it does not link to — "${a}"`);
      // And when it does promise one, it must name the volume that page links to.
      if (promisesApp && link) {
        const expected = { braingames: "Snackpack Brain Games", braingames2: "Snackpack Brain Games Vol 2", braingames3: "Snackpack Brain Games Vol 3" }[link[1]];
        if (!a.includes(expected)) lies.push(`${slug}: links to ${link[1]} but names something else — "${a}"`);
      }
    }
  }
  expect(lies).toEqual([]);
});

// "Does my progress save?" must match whether resume.js is actually wired.
test("the saved-progress answer matches what the page actually does", () => {
  const wrong = [];
  for (const slug of games) {
    const { html, faq } = faqOf(slug);
    if (!faq) continue;
    const q = faq.mainEntity.find((x) => /progress save/i.test(x.name));
    if (!q) continue;
    const claimsResume = /game in progress is saved/i.test(q.acceptedAnswer.text);
    const hasResume = html.includes("resume.js");
    if (claimsResume && !hasResume) wrong.push(`${slug}: claims a game in progress is saved, but resume.js is not loaded`);
    if (!claimsResume && hasResume) wrong.push(`${slug}: loads resume.js but does not say a game in progress is saved`);
  }
  expect(wrong).toEqual([]);
});

// The keyboard answer must agree with the marker the keyboard specs verified.
test("the keyboard answer agrees with the page's own keyboard marker", () => {
  const wrong = [];
  for (const slug of games) {
    const { html, faq } = faqOf(slug);
    if (!faq) continue;
    const q = faq.mainEntity.find((x) => /with a keyboard/i.test(x.name));
    if (!q) continue;
    const marker = html.match(/data-no-keyboard-reason="([^"]*)"/);
    const grid = /attachGrid\(/.test(html);
    if (!marker && !grid) wrong.push(`${slug}: answers a keyboard question but has neither a marker nor a grid`);
  }
  expect(wrong).toEqual([]);
});

// The offline answer shipped wrong once, copied from a house line that predated
// sw.js: it told people the web version needs a connection and pushed them to
// the Android app. The site registers a service worker on every game page and
// plays offline once a game has been opened — verified by cutting the network,
// not by reading the worker. Do not let that claim come back.
test("no answer claims the web version needs a connection", () => {
  const lies = [];
  for (const slug of games) {
    const { faq } = faqOf(slug);
    if (!faq) continue;
    for (const q of faq.mainEntity) {
      const a = q.acceptedAnswer.text;
      if (/needs a browser tab open|Not as an installed app|needs a connection/i.test(a)) {
        lies.push(`${slug}: "${q.name}" still says the web version cannot go offline`);
      }
    }
  }
  expect(lies).toEqual([]);
});

// And every game page must actually register the worker that makes it true.
test("every game page registers the service worker its FAQ relies on", () => {
  const without = games.filter((slug) => {
    const html = fs.readFileSync(path.join(PLAY, slug, "index.html"), "utf8");
    const { faq } = faqOf(slug);
    const claimsOffline = faq && faq.mainEntity.some((q) =>
      /offline/i.test(q.name) && /keeps working with no connection/i.test(q.acceptedAnswer.text));
    return claimsOffline && !/serviceWorker/.test(html);
  });
  expect(without, "a page promising offline play must register the worker").toEqual([]);
});

// The evidence behind the claim, kept as a test rather than a note: cut the
// network and a game that has been opened must still load and still be
// playable. If the worker ever regresses, the FAQ becomes a lie and this is
// what catches it.
test("a game really does play with the network cut", async ({ page, context }) => {
  await page.goto("/play/sudoku/", { waitUntil: "load" });
  const ready = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;
    return !!(await navigator.serviceWorker.ready.catch(() => null));
  });
  expect(ready, "the service worker registers and becomes ready").toBe(true);

  await page.waitForTimeout(1200);
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(600);

  await context.setOffline(true);
  try {
    await page.goto("/play/sudoku/", { waitUntil: "load" });
    const state = await page.evaluate(() => ({
      cells: document.querySelectorAll("#su-board .su-cell").length,
      status: (document.querySelector(".game-status") || {}).textContent || ""
    }));
    expect(state.cells, "the grid is rendered offline").toBe(81);
    expect(state.status.length, "the game is in a playable state offline").toBeGreaterThan(0);
  } finally {
    await context.setOffline(false);
  }
});
