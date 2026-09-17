/**
 * record-tape.mjs -- capture a replay tape through the REAL page.
 *
 * Drives `/play/pinball/?record=1` in a real browser, so the input goes
 * through the actual key handlers, the actual rAF loop and the actual frame
 * jitter — not straight into the engine the way the scripted tapes in
 * replay.test.mjs do. That is the difference: these tapes exercise the whole
 * stack, including game.js.
 *
 * They are still MACHINE-driven, so they are not a substitute for a tape Mark
 * records by hand. To record one of those: open the page with ?record=1, play
 * a game, then in the console run
 *     copy(JSON.stringify(window.__pbTape()))
 * and save it into tools/pinball/tapes/.
 *
 * Usage: node tools/pinball/record-tape.mjs [name] [seconds]
 */

import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const TAPES = path.join(HERE, 'tapes');
const BASE = process.env.PB_BASE || 'http://127.0.0.1:4173';

const name = process.argv[2] || 'browser-classic';
const seconds = Number(process.argv[3] || 70);

fs.mkdirSync(TAPES, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 520, height: 1180 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE}/play/pinball/?record=1`, { waitUntil: 'load' });
await page.waitForSelector('#pb-canvas');
await page.evaluate(() => { try { localStorage.clear(); } catch (err) { /* blocked storage is fine */ } });
await page.click('[data-mode="classic"]');

/**
 * Play something that resembles a person: plunge when the table is waiting,
 * then flip with irregular timing and occasional held cradles, rather than a
 * fixed metronome. Irregularity is the point — it is what finds shot patterns
 * a periodic loop never produces.
 */
const end = Date.now() + seconds * 1000;
let over = false;
while (Date.now() < end && !over) {
  const phase = await page.evaluate(() => {
    const el = document.getElementById('pb-dmd');
    return { over: !document.getElementById('pb-overlay').hidden, dmd: el ? el.textContent : '' };
  });
  if (phase.over) { over = true; break; }

  // Plunge whenever the table is waiting for it.
  await page.keyboard.down('Space');
  await page.waitForTimeout(400 + Math.floor(Math.random() * 700));
  await page.keyboard.up('Space');

  // Then a burst of irregular flipping, with the odd cradle.
  const burst = 14 + Math.floor(Math.random() * 12);
  for (let i = 0; i < burst && Date.now() < end; i += 1) {
    const key = Math.random() < 0.5 ? 'KeyZ' : 'Slash';
    const hold = Math.random() < 0.25
      ? 260 + Math.floor(Math.random() * 500)   // a cradle
      : 40 + Math.floor(Math.random() * 90);    // a normal flip
    await page.keyboard.down(key);
    await page.waitForTimeout(hold);
    await page.keyboard.up(key);
    await page.waitForTimeout(90 + Math.floor(Math.random() * 320));
    if (await page.evaluate(() => !document.getElementById('pb-overlay').hidden)) { over = true; break; }
  }
}

const tape = await page.evaluate(() => window.__pbTape());
const summary = await page.evaluate(() => ({
  score: document.getElementById('pb-score').textContent,
  ball: document.getElementById('pb-ball').textContent,
  over: !document.getElementById('pb-overlay').hidden,
}));
await browser.close();

if (errors.length) {
  console.error('page errors during recording:\n  ' + errors.join('\n  '));
  process.exit(1);
}
if (!tape.frames.length) {
  console.error('recorded no frames — is ?record=1 reaching game.js?');
  process.exit(1);
}

tape.name = name;
fs.writeFileSync(path.join(TAPES, `${name}.json`), `${JSON.stringify(tape)}\n`);
console.log(`recorded ${name}: ${tape.frames.length} frames, seed ${tape.seed}, mode ${tape.mode}`);
console.log(`  in-page result: score ${summary.score}, ball ${summary.ball}, game over ${summary.over}`);
console.log('  expectations are added by: node tools/pinball/replay.test.mjs --update');
