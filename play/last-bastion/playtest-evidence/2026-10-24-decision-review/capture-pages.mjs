import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
const root = 'play/last-bastion/playtest-evidence/2026-10-24-decision-review/';
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
  await page.goto('http://127.0.0.1:44184/play/last-bastion/?scenario=scrap-shop&weapons=12&seed=61061&sound=0');
  await page.waitForFunction(() => window.__combatDecisionOverlay?.visible);
  const activate = async id => {
    const index = await page.evaluate(id => window.__combatDecisionOverlay.optionIds.indexOf(id),id);
    for(let i=0;i<15;i++) {
      if(await page.evaluate(()=>window.__combatDecisionOverlay.selectedIndex)===index) break;
      await page.keyboard.press('ArrowDown',{delay:80});
    }
    await page.keyboard.press('Enter',{delay:80});
  };
  await activate('shop-manage');await activate('shop-sell-menu');
  states.first = await page.evaluate(()=>window.__combatDecisionOverlay);
  await page.screenshot({path:root+'sell-page-1.png'});
  await activate('decision-page-next');
  states.second = await page.evaluate(()=>window.__combatDecisionOverlay);
  await page.screenshot({path:root+'sell-page-2.png'});
  await writeFile(root+'pages.json',JSON.stringify(states,null,2)+'\n');

} finally { await browser?.close(); server.kill(); }
