import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const out='play/last-bastion/playtest-evidence/2026-10-21-followup-review';
fs.mkdirSync(out,{recursive:true});
const port=44272,origin=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['scripts/serve-static.mjs'],{env:{...process.env,PORT:String(port)},stdio:'ignore'});
let browser; const results=[];
try {
 for(let i=0;i<80;i++){try{if((await fetch(origin+'/play/last-bastion/')).ok)break;}catch{} await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:960,height:540}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/play/last-bastion/?flow=settings',{waitUntil:'networkidle'});
 for(const name of ['Accessibility','Audio','Controls','Display','Save & privacy']){
  await page.getByRole('button',{name,exact:true}).click(); await page.waitForTimeout(150);
  const controls=await page.locator('.semantic-shell input,.semantic-shell select,.semantic-setting-action').evaluateAll(els=>els.map(el=>({key:el.dataset.shellKey,rect:el.getBoundingClientRect().toJSON(),name:el.labels?.[0]?.textContent??el.textContent,value:el.value})));
  const file='settings-'+name.toLowerCase().replaceAll(/[^a-z]+/g,'-');
  await page.screenshot({path:`${out}/${file}.png`});
  results.push({name,controls,errors:[...errors]});
 }
 await page.close();
 const routes=[
 ['baseline-1080','?screen=game&theme=bastion-standard&seed=61061&sound=0',1920,1080],
 ['kit-1080','?screen=game&theme=bastion-standard&seed=61061&floorpilot=kit&sound=0',1920,1080],
 ['dense-cvd-4k','?screen=game&theme=bastion-standard&seed=61061&floorpilot=kit&transformation=gravity-adept&stress=12&palette=deuteranopia&uiscale=1.2&radarsize=1.25&flash=0&sound=0',3840,2160],
 ['map-1080','?screen=map&sound=0',1920,1080],
 ['gallery-marine','?mode=gallery&hero=marine',1920,1080],
 ['gallery-medic','?mode=gallery&hero=medic',1920,1080],
 ['gallery-assault','?mode=gallery&hero=assault',1920,1080],
 ];
 for(const [name,query,width,height] of routes){
  const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:1}); const failures=[];
  p.on('pageerror',e=>failures.push(e.message));
  await p.goto(origin+'/play/last-bastion/'+query,{waitUntil:'networkidle'});
  await p.waitForSelector('#game-root canvas'); await p.waitForTimeout(800);
  if(name.includes('1080')||name.includes('dense')){await p.keyboard.down('d');await p.waitForTimeout(1200);await p.keyboard.up('d');}
  await p.screenshot({path:`${out}/${name}.png`});
  results.push({name,query,width,height,errors:failures,audit:await p.evaluate(()=>({shell:window.__shellState,gallery:window.__galleryReview,combat:window.__combatAccessibilityAudit})),canvas:await p.locator('#game-root canvas').boundingBox()}); await p.close();
 }
 fs.writeFileSync(out+'/capture-results.json',JSON.stringify({checkedAt:new Date().toISOString(),head:'7780ba86',limitations:'Diagnostic snapshots and brief simulated input only. DPR 1. No observed-run, audio, assistive-technology or hardware acceptance.',results},null,2));
 console.log(JSON.stringify(results.map(({name,errors})=>({name,errors}))));
}finally{await browser?.close();server.kill();}
