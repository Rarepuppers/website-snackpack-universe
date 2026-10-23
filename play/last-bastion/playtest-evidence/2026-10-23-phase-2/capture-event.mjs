// Run from the nested website root. Disposable browser context; no real save.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const server = spawn(process.execPath, ['scripts/serve-static.mjs'], {
  env: { ...process.env, PORT: '44183' }, stdio: 'ignore', windowsHide: true,
});
let browser;
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch('http://127.0.0.1:44183/play/last-bastion/')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Capture server unavailable');
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto('http://127.0.0.1:44183/play/last-bastion/?screen=event&eventdemo=1');
  await page.waitForFunction(() => window.__expeditionEvent !== undefined);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__expeditionEvent.outcomeShown);
  await page.screenshot({ path: 'play/last-bastion/playtest-evidence/2026-10-23-phase-2/event-result.png' });
} finally {
  await browser?.close();
  server.kill();
}
