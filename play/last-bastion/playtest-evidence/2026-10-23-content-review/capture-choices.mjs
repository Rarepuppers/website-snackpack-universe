import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
const root = 'play/last-bastion/playtest-evidence/2026-10-23-content-review/';
const server = spawn(process.execPath, ['scripts/serve-static.mjs'], { env: { ...process.env, PORT: '44184' }, stdio: 'ignore', windowsHide: true });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch('http://127.0.0.1:44184/play/last-bastion/')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Server unavailable');
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const states = {};
  for (const [name, scenario] of [['upgrade', 'level-up-review'], ['shop', 'scrap-shop']]) {
    await page.goto('http://127.0.0.1:44184/play/last-bastion/?scenario=' + scenario + '&sound=0');
    await page.waitForFunction(() => window.__combatDecisionOverlay?.visible);
    states[name] = await page.evaluate(() => window.__combatDecisionOverlay);
    await page.screenshot({ path: root + name + '.png' });
    if (name === 'shop') {
      const index = states[name].optionIds.indexOf('shop-manage');
      if (index < 0 || index >= 9) throw new Error('Manage quick key unavailable');
      await page.keyboard.press(String(index + 1), { delay: 80 });
      await page.waitForFunction(() => window.__combatDecisionOverlay?.optionIds.includes('shop-back'));
      states.manage = await page.evaluate(() => window.__combatDecisionOverlay);
      await page.screenshot({ path: root + 'manage.png' });
    }
  }
  await writeFile(root + 'choice-states.json', JSON.stringify(states, null, 2) + '\n');
} finally { await browser?.close(); server.kill(); }
