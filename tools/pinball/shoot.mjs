/**
 * shoot.mjs -- drive the real page in a real browser and capture the table.
 *
 * The built-in preview pane reports document.hidden, which pauses
 * requestAnimationFrame and collapses the viewport, so a real-time game cannot
 * be seen or verified there. This drives headless Chromium instead, which has
 * neither problem.
 *
 * Usage: node tools/pinball/shoot.mjs [outdir]
 * Requires the static server on :4173 (scripts/serve-static.mjs).
 */

import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const OUT = path.resolve(process.argv[2] || 'tools/pinball/shots');
const BASE = process.env.PB_BASE || 'http://127.0.0.1:4173';

fs.mkdirSync(OUT, { recursive: true });

const shots = [
  {
    name: '01-modes',
    note: 'mode select on load',
    run: async () => {},
  },
  {
    name: '02-plunge-ready',
    note: 'classic started, plunger charging',
    run: async (page) => {
      await page.click('[data-mode="classic"]');
      await page.keyboard.down('Space');
      await page.waitForTimeout(500);
    },
  },
  {
    name: '03-orbit',
    note: 'mid-orbit after a full plunge',
    run: async (page) => {
      await page.click('[data-mode="classic"]');
      await page.keyboard.down('Space');
      await page.waitForTimeout(900);
      await page.keyboard.up('Space');
      await page.waitForTimeout(1500);
    },
  },
  {
    name: '04-cradled',
    note: 'ball returned to a flipper after the orbit',
    run: async (page) => {
      await page.click('[data-mode="classic"]');
      await page.keyboard.down('Space');
      await page.waitForTimeout(900);
      await page.keyboard.up('Space');
      await page.waitForTimeout(6000);
    },
  },
  {
    name: '05-flippers-up',
    note: 'both flippers held',
    run: async (page) => {
      await page.click('[data-mode="classic"]');
      await page.keyboard.down('Space');
      await page.waitForTimeout(900);
      await page.keyboard.up('Space');
      await page.waitForTimeout(6000);
      await page.keyboard.down('KeyZ');
      await page.keyboard.down('Slash');
      await page.waitForTimeout(250);
    },
  },
];

const browser = await chromium.launch();
const errors = [];

for (const shot of shots) {
  const page = await browser.newPage({ viewport: { width: 520, height: 1180 } });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${shot.name}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${shot.name}: ${e.message}`));

  await page.goto(`${BASE}/play/pinball/`, { waitUntil: 'load' });
  await page.waitForSelector('#pb-canvas');
  await shot.run(page);

  const canvas = page.locator('#pb-canvas');
  await canvas.screenshot({ path: path.join(OUT, `${shot.name}.png`) });

  const info = await page.evaluate(() => ({
    canvas: (() => { const c = document.getElementById('pb-canvas'); return `${c.width}x${c.height}`; })(),
    score: document.getElementById('pb-score').textContent,
    ball: document.getElementById('pb-ball').textContent,
    status: document.getElementById('pb-live').textContent,
  }));
  console.log(`${shot.name.padEnd(18)} ${shot.note.padEnd(42)} canvas ${info.canvas}  score ${info.score}  ball ${info.ball}`);
  await page.close();
}

await browser.close();

// A blank canvas is the failure this script exists to catch: a 0x0 backing
// store or a renderer that draws nothing produces no error at all.
for (const shot of shots) {
  const size = fs.statSync(path.join(OUT, `${shot.name}.png`)).size;
  if (size < 2000) errors.push(`${shot.name}: screenshot is ${size} bytes -- the canvas is probably blank`);
}

if (errors.length) {
  console.error(`\nPROBLEMS (${errors.length}):\n  ${errors.join('\n  ')}`);
  process.exitCode = 1;
} else {
  console.log(`\nAll shots captured to ${OUT}, no console errors.`);
}
