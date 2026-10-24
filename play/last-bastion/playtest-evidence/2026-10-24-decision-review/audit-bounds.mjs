import { createServer } from '../../dev/node_modules/vite/dist/node/index.js';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
const dir = new URL('./', import.meta.url);
const server = await createServer({ root: fileURLToPath(new URL('../../dev/', import.meta.url)), configFile: false,
  server: { port: 44185, strictPort: true, hmr: false }, appType: 'custom', logLevel: 'error' });
server.middlewares.use('/audit.html', (_req, res) => { res.setHeader('Content-Type', 'text/html'); res.end('<html><body style="margin:0"></body></html>'); });
let browser;
try {
 await server.listen();
 browser = await chromium.launch();
 const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
 await page.goto('http://localhost:44185/audit.html');
 const report = await page.evaluate(async () => {
  const Phaser = (await import('/node_modules/phaser/dist/phaser.esm.js')).default;
  const { CombatDecisionOverlay } = await import('/src/game/ui/CombatDecisionOverlay.ts');
  const { CombatSimulation } = await import('/src/game/combat/CombatSimulation.ts');
  const { planUpgradeDecision } = await import('/src/game/combat/LevelUpDecision.ts');
  const { UPGRADE_CATALOG } = await import('/src/game/content/upgradeCatalog.ts');
  const rows = [];
  await new Promise(resolve => {
   new Phaser.Game({ type: Phaser.CANVAS, width: 960, height: 540, audio: { noAudio: true }, scene: { create() {
    const scene = this;
    scene.cameras.main.preRender();
    const overlay = new CombatDecisionOverlay(scene, { keys: {}, useMarineArt: false, chooseOption: () => false, onConfirmed() {}, onDecisionChanged() {} });
    const inspect = (decision, tag) => {
     if (!decision) return;
     overlay.reset(); overlay.sync(decision);
     const children = overlay.overlay.list;
     const labels = children.filter(c => c.type === 'Text');
     const choices = overlay.buttons;
     const issues = [];
     if (overlay.overlay.height > 540 || overlay.overlay.width > 960) issues.push({ panelOverflow: true });
     for (let i = 0; i < choices.length; i++) {
      const rect = choices[i].rect;
      const label = labels[i + (decision.kind === 'weapon-placement' && decision.weaponId ? 2 : 1)];
      const box = rect.getBounds(), text = label.getBounds();
      if (text.left < box.left || text.right > box.right || text.top < box.top || text.bottom > box.bottom)
       issues.push({ id: choices[i].choiceId, text: label.text, textBounds: {x:text.x,y:text.y,width:text.width,height:text.height}, box: {x:box.x,y:box.y,width:box.width,height:box.height} });
     }
     rows.push({ tag, kind: decision.kind, options: choices.length, issues, panelHeight: overlay.overlay.height });
    };
    for (let seed = 1; seed <= 30; seed++) {
     for (const scenario of ['scrap-shop','level-up-review','stat-card-review','weapon-gate']) {
      const sim = new CombatSimulation({ seed, scenario });
      inspect(sim.snapshot().pendingDecision, `${scenario}:${seed}`);
      if (scenario === 'scrap-shop') {
       sim.chooseOption('shop-manage');inspect(sim.snapshot().pendingDecision, `manage:${seed}`);
       sim.chooseOption('shop-sell-menu');inspect(sim.snapshot().pendingDecision, `sell:${seed}`);
      }
     }
    }
    for (const count of [4,8,12]) {
     const sim = new CombatSimulation({seed: 61061, scenario:'scrap-shop', startingWeaponCount:count});
     sim.chooseOption('shop-manage');sim.chooseOption('shop-sell-menu');
     inspect(sim.snapshot().pendingDecision, `sell-rack:${count}`);
    }
    for (const [id,def] of Object.entries(UPGRADE_CATALOG)) {
     for(let rank=1;rank<=def.maxLevel;rank++) {
      const levels = new Map(Object.entries(UPGRADE_CATALOG).map(([other,d])=>[other,other===id?rank-1:d.maxLevel]));
      inspect(planUpgradeDecision({level:2,upgradeLevels:levels,slotCapacity:{offensive:12,defensive:12,support:12,scavenger:12}}),`upgrade:${id}:${rank}`);
     }
    }
    overlay.destroy();resolve();
   } } });
  });
  return { viewport: '960x540', source: 'production simulation and overlay, useMarineArt=false', rows };
 });
 await writeFile(new URL(process.argv[2] || 'bounds-after.json',dir), JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({cases:report.rows.length, failures:report.rows.filter(r=>r.issues.length).length, examples:report.rows.filter(r=>r.issues.length).slice(0,3)},null,2));
} finally { await browser?.close(); await server.close(); }
