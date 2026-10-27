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
  const { shopDecisionPages } = await import("/src/game/ui/ShopDecisionPages.ts");
  const { CombatDecisionOverlay } = await import('/src/game/ui/CombatDecisionOverlay.ts');
  const { CombatSimulation } = await import('/src/game/combat/CombatSimulation.ts');
  const { planUpgradeDecision } = await import('/src/game/combat/LevelUpDecision.ts');
  const { UPGRADE_CATALOG } = await import('/src/game/content/upgradeCatalog.ts');
  const { GAME_ASSETS } = await import('/src/game/assets/GameAssetManifest.ts');
  const { WEAPON_CATALOG } = await import('/src/game/content/weaponCatalog.ts');
  const { ITEM_CATALOG } = await import('/src/game/content/itemCatalog.ts');
  const candidates = await import('/src/game/combat/ScrapShopCandidateConstruction.ts');
  const presentation = await import('/src/game/combat/ScrapShopDecisionPresentation.ts');
  const { createWeaponInventory, WEAPON_INVENTORY_CAPACITY } = await import('/src/game/equipment/WeaponInventory.ts');
  const { MAX_EQUIPPED_WEAPONS } = await import('/src/game/equipment/WeaponLoadout.ts');
  const { prepareScrapShopSellEntries } = await import('/src/game/combat/ScrapShopWeaponSale.ts');
  const rows = [];
  await new Promise(resolve => {
   new Phaser.Game({ type: Phaser.CANVAS, width: 960, height: 540, audio: { noAudio: true }, scene: { preload() {
    for(const [id,a] of Object.entries(GAME_ASSETS)) {
      if (!/scrap-shop|quartermaster|batch-i|batch-c-rewards|elemental-upgrade|weapon-identity|marauder-ar-tile|event-horizon-tile/.test(id)) continue;
      if(a.kind==='spritesheet') this.load.spritesheet(id,a.url,{frameWidth:a.frameWidth,frameHeight:a.frameHeight});
      else this.load.image(id,a.url);
    }
   }, create() {
    const scene = this;
    scene.cameras.main.preRender();
    const overlay = new CombatDecisionOverlay(scene, { keys: {}, useMarineArt: true, chooseOption: () => false, onConfirmed() {}, onDecisionChanged() {} });
    const inspect = (decision, tag) => {
     if (!decision) return;
     overlay.reset(); overlay.sync(decision);
     const pages = shopDecisionPages(decision).length;
     for(let pageIndex=0;pageIndex<pages;pageIndex++) {
     overlay.pageIndex=pageIndex;overlay.sync(decision);
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
     if(decision.kind==='scrap-shop') {
       for(const label of [labels[0], labels[labels.length-1]]) {
         const box=label.getBounds();
         if(box.left<overlay.overlay.x-overlay.overlay.width/2+16 || box.right>overlay.overlay.x+overlay.overlay.width/2-16)
           issues.push({headerOverflow:label.text});
         if(box.bottom>Math.min(...choices.map(choice=>choice.rect.getBounds().top))) issues.push({headerOverlapsChoices:label.text});
       }
       for(const choice of choices) {
         const box=choice.rect.getBounds();
         if(box.bottom>overlay.overlay.y+overlay.overlay.height/2-50) issues.push({id:choice.choiceId,frameInset:false});
       }
     }
     rows.push({ tag, pageIndex, ids: choices.map(c=>c.choiceId), kind: decision.kind, options: choices.length, issues, panelHeight: overlay.overlay.height });
     }
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
    const weapons = candidates.prepareScrapShopWeaponInputs({stocksWeapons:true,equippedWeaponIds:[],maxEquippedWeapons:12,offerableWeaponIds:Object.keys(WEAPON_CATALOG),candidateCount:Object.keys(WEAPON_CATALOG).length,rotationOffset:0});
    const stock = [
      ...candidates.buildUpgradeWeaponScrapShopCandidates({upgrades:[],weapons,prices:{upgrade:30,weapon:50},profilePriceMultiplier:1,uniqueWeaponPriceMultiplier:1}),
      ...candidates.buildItemScrapShopCandidates({items:Object.values(ITEM_CATALOG),waveIndex:1,profilePriceMultiplier:1}),
    ];
    for(const offer of stock) {
      const offers=[offer,...stock.filter(c=>c.id!==offer.id).slice(0,3)];
      inspect(presentation.presentScrapShopOffersDecision({ownedItemIds:ITEM_CATALOG.flatMap(item=>Array(99).fill(item.id)),offers,profileName:'Salvage',securedScrap:150,lockedOfferId:offer.id,rerollUsed:false,rerollCost:10}),`catalogue:${offer.id}`);
    }
    for(const count of [11,12,MAX_EQUIPPED_WEAPONS+WEAPON_INVENTORY_CAPACITY]) {
      const tiles=Array.from({length:count},(_,i)=>({instanceId:i+1,weaponId:'bastion-service-rifle',weaponClass:WEAPON_CATALOG['bastion-service-rifle'].weaponClass,tier:1}));
      const inventory=createWeaponInventory(Array(MAX_EQUIPPED_WEAPONS).fill('all'),tiles);
      const entries=prepareScrapShopSellEntries({...inventory,equippedInstanceIds:inventory.rack.flatMap(s=>s.tile?[s.tile.instanceId]:[])});
      inspect(presentation.presentScrapShopSellDecision({entries,securedScrap:150,lockedOfferId:null,rerollUsed:false,rerollCost:10}),`sell-boundary:${count}`);
    }
    const refresh = presentation.presentScrapShopOffersDecision({offers:stock.slice(0,4),profileName:'Salvage',securedScrap:150,lockedOfferId:null,rerollUsed:false,rerollCost:10});
    overlay.reset();overlay.sync(refresh);overlay.selectionIndex=2;
    overlay.sync({...refresh, options:refresh.options.map((o,i)=>i===2?{...o,description:'REFRESH PROBE',cost:1}:o)});
    rows.push({tag:'refresh-probe',issues:[],labelUpdated:overlay.overlay.list.some(c=>c.type==='Text'&&c.text.includes('REFRESH PROBE')),selection:overlay.selectionIndex});
    overlay.sync({...refresh, options:refresh.options.filter((o,i)=>i!==2)});
    const removedSelection=overlay.buttons[overlay.selectionIndex]?.choiceId;
    rows.push({tag:'removed-choice-probe',issues:removedSelection==='shop-leave'?[]:[{unsafeSelection:removedSelection}]});
    const selected = stock.find(c=>c.id==='shop-weapon:marauder-ar');
    overlay.reset();overlay.sync(presentation.presentScrapShopOffersDecision({offers:[selected,...stock.filter(c=>c.id!==selected.id).slice(0,3)],profileName:'Salvage',securedScrap:150,lockedOfferId:selected.id,rerollUsed:false,rerollCost:10}));
    resolve();
   } } });
  });
  const probe=rows.find(row=>row.tag==='refresh-probe');
  if(!probe.labelUpdated || probe.selection!==2) probe.issues.push({refreshFailed:true});
  return { viewport: '960x540', source: 'production simulation, catalogue candidate factories and overlay with production art', rows };
 });
 await page.screenshot({path:fileURLToPath(new URL('long-description.png',dir))});
 await writeFile(new URL(process.argv[2] || 'coverage-final.json',dir), JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({cases:report.rows.length, failures:report.rows.filter(r=>r.issues.length).length, examples:report.rows.filter(r=>r.issues.length).slice(0,3)},null,2));
 if(report.rows.some(r=>r.issues.length)) process.exitCode=1;
} finally { await browser?.close(); await server.close(); }
