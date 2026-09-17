/**
 * perf.mjs -- measure the renderer's actual draw cost at a given device pixel
 * ratio.
 *
 * Frame time is useless for this: rAF is vsync-locked, so a comfortable frame
 * and a struggling one both report 16.7ms until the moment it collapses. This
 * times draw() directly, which is the number that decides whether a DPR tier
 * is affordable.
 *
 * Usage: node tools/pinball/perf.mjs [dpr]
 */
import { chromium } from '@playwright/test';

const dpr = Number(process.argv[2] || 2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 520, height: 1180 }, deviceScaleFactor: dpr });
await p.goto('http://127.0.0.1:4173/play/pinball/');
await p.waitForSelector('#pb-canvas');
await p.click('[data-mode="classic"]');
await p.keyboard.down('Space'); await p.waitForTimeout(900); await p.keyboard.up('Space');
await p.waitForTimeout(2500);

const out = await p.evaluate(async () => {
  const eng = await import('/play/pinball/engine.js');
  const rnd = await import('/play/pinball/render.js');
  const c = document.getElementById('pb-canvas');
  const r = rnd.createRenderer(c);
  const w = eng.createWorld('classic', 1);
  for (let i = 0; i < 480; i++) eng.step(w, { plunge: i < 400 }, eng.DT);
  // Four balls and a full particle load: the worst case the table produces.
  eng.addBall(w, 243, 500, 400, -600);
  eng.addBall(w, 200, 450, -300, -500);
  eng.addBall(w, 300, 520, 250, -700);
  const lit = ['orbit-left', 'ramp-right', 'saucer', 'lock', 'bank'];
  const flashes = new Map([['bumper-left', 0.1], ['bumper-right', 0.1], ['bumper-top', 0.1]]);
  for (let i = 0; i < 20; i++) r.draw(w, flashes, lit, 1 / 60); // warm up
  const t0 = performance.now();
  const N = 200;
  for (let i = 0; i < N; i++) r.draw(w, flashes, lit, 1 / 60);
  const ms = (performance.now() - t0) / N;
  return { ms: +ms.toFixed(3), canvas: `${c.width}x${c.height}`, particles: r.particleCount };
});
console.log(`dpr ${dpr}: canvas ${out.canvas}  draw ${out.ms}ms  (budget 16.6ms/frame)`);
await b.close();
