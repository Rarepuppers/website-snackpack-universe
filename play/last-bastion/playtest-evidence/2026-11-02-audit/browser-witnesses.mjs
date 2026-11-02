// Run from the website root. Disposable browser profile and task-owned local server.
import { chromium } from '../../../../node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import { readFileSync,writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const out='play/last-bastion/playtest-evidence/2026-11-02-audit';
const report=JSON.parse(readFileSync(out+'/production-witnesses.json','utf8'));
const port=44284, base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['scripts/serve-static.mjs'],{env:{...process.env,PORT:String(port)},windowsHide:true,stdio:'ignore'});
let browser;
try {
  for(let i=0;i<40;i++) { try { if((await fetch(base)).ok)break; }catch{} await new Promise(r=>setTimeout(r,100)); }
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:960,height:540}});
  const results=[];
  for(const key of ['locked','capped','free','hunt','echo','duplicate']) {
    const witness=report.witnesses[key],route=report.routes[key];
    await page.goto(base+'/play/last-bastion/?flow=menu');
    await page.waitForFunction(()=>window.__shellState);
    await page.evaluate(({route,witness})=>{
      localStorage.setItem('last-bastion-save',JSON.stringify({version:17,selectedHeroId:'marine',expedition:{...route,threatTier:0,build:witness.before}}));
    },{route,witness});
    await page.goto(base+`/play/last-bastion/?screen=event&expedition=1&node=${route.currentNodeId}`);
    await page.waitForFunction(id=>window.__expeditionEvent?.eventId===id,witness.eventId);
    for(let i=0;i<route.choiceIndex;i++) await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForFunction(()=>window.__expeditionEvent?.outcomeShown);
    await page.screenshot({path:out+'/'+key+'-result.png'});
    await page.keyboard.press('Enter');
    await page.waitForURL(url=>url.searchParams.get('screen')==='map');
    await page.reload();
    await page.waitForFunction(()=>window.__expeditionState);
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('last-bastion-save')));
    if(key==='locked') {assert.equal(saved.expedition.build.weapons.length,0);assert.deepEqual(saved.expedition.build.transformation,witness.before.transformation);}
    if(key==='capped') {assert.equal(saved.expedition.build.scrap,70);assert.deepEqual(saved.expedition.build.transformation,witness.before.transformation);}
    if(key==='free') assert.equal(saved.expedition.build.transformation.paths[0].affinity,1);
    if(key==='hunt') {assert.equal(saved.expedition.build.scrap,70);assert(!('guaranteedEliteRelicNextNode' in saved.expedition.build));}
    if(key==='echo') assert.deepEqual(saved.expedition.build.upgrades,witness.before.upgrades);
    results.push({key,route,saveAfterReload:saved});
  }
  writeFileSync(out+'/browser-witnesses.json',JSON.stringify(results,null,2)+'\n');
  console.log('Six actual event scenes confirmed and saved/reloaded through local published bundle.');
}finally {await browser?.close();server.kill();}
